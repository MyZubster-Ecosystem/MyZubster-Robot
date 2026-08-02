"use strict";

const DEFAULT_POLICY = {
  baseFeeXmr: 0.00005,
  perOutputFeeXmr: 0.000002,
  maxFeeRatio: 0.025,
  minMicropaymentXmr: 0.001,
  maxMicropaymentXmr: 0.01,
  minBatchAmountXmr: 0.02,
  maxBatchSize: 25,
  maxHoldSeconds: 3600
};

function estimateMoneroFee({ outputCount = 1, policy = {} } = {}) {
  const mergedPolicy = mergePolicy(policy);
  const outputs = Math.max(1, Number(outputCount) || 1);
  return roundXmr(mergedPolicy.baseFeeXmr + outputs * mergedPolicy.perOutputFeeXmr);
}

function analyzeMicropayment(amountXmr, { policy = {} } = {}) {
  const mergedPolicy = mergePolicy(policy);
  const amount = requirePositiveNumber(amountXmr, "amountXmr");
  const directFee = estimateMoneroFee({ outputCount: 1, policy: mergedPolicy });
  const feeRatio = directFee / amount;

  return {
    amountXmr: roundXmr(amount),
    directFeeXmr: directFee,
    feeRatio: Number(feeRatio.toFixed(6)),
    isMicropayment: amount >= mergedPolicy.minMicropaymentXmr && amount <= mergedPolicy.maxMicropaymentXmr,
    shouldBatch: feeRatio > mergedPolicy.maxFeeRatio
  };
}

function planMicropaymentSettlement(payments, { policy = {}, now = new Date() } = {}) {
  if (!Array.isArray(payments)) {
    throw new TypeError("payments must be an array");
  }

  const mergedPolicy = mergePolicy(policy);
  const normalized = payments.map((payment, index) => normalizePayment(payment, index));
  const groups = groupPayments(normalized);
  const batches = [];
  const pending = [];

  for (const group of groups.values()) {
    const totalAmountXmr = roundXmr(sum(group.map((payment) => payment.amountXmr)));
    const oldestAgeSeconds = Math.max(
      0,
      ...group.map((payment) => (now.getTime() - payment.createdAt.getTime()) / 1000)
    );
    const shouldSettle =
      totalAmountXmr >= mergedPolicy.minBatchAmountXmr ||
      group.length >= mergedPolicy.maxBatchSize ||
      oldestAgeSeconds >= mergedPolicy.maxHoldSeconds;

    const settlement = buildSettlement(group, totalAmountXmr, mergedPolicy);
    if (shouldSettle) {
      batches.push({
        ...settlement,
        reason: settlementReason({
          totalAmountXmr,
          paymentCount: group.length,
          oldestAgeSeconds,
          policy: mergedPolicy
        })
      });
    } else {
      pending.push({
        ...settlement,
        missingAmountXmr: roundXmr(mergedPolicy.minBatchAmountXmr - totalAmountXmr),
        secondsUntilForcedSettlement: Math.max(0, Math.ceil(mergedPolicy.maxHoldSeconds - oldestAgeSeconds))
      });
    }
  }

  return {
    batches,
    pending,
    summary: summarize(normalized, batches, mergedPolicy)
  };
}

function normalizePayment(payment, index) {
  if (!payment || typeof payment !== "object") {
    throw new TypeError(`payment at index ${index} must be an object`);
  }

  const amountXmr = requirePositiveNumber(payment.amountXmr, `payments[${index}].amountXmr`);
  const recipient = requireString(payment.recipient || payment.robotId, `payments[${index}].recipient`);

  return {
    id: payment.id || `payment-${index + 1}`,
    recipient,
    amountXmr: roundXmr(amountXmr),
    currency: payment.currency || "XMR",
    workOrderId: payment.workOrderId || null,
    metadata: payment.metadata || {},
    createdAt: payment.createdAt ? new Date(payment.createdAt) : new Date()
  };
}

function groupPayments(payments) {
  const groups = new Map();

  for (const payment of payments) {
    if (Number.isNaN(payment.createdAt.getTime())) {
      throw new TypeError(`payment ${payment.id} has invalid createdAt`);
    }

    const key = `${payment.currency}:${payment.recipient}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(payment);
  }

  return groups;
}

function buildSettlement(group, totalAmountXmr, policy) {
  const directFeesXmr = roundXmr(group.length * estimateMoneroFee({ outputCount: 1, policy }));
  const batchFeeXmr = estimateMoneroFee({ outputCount: 1, policy });
  const feeSavingsXmr = roundXmr(Math.max(0, directFeesXmr - batchFeeXmr));

  return {
    recipient: group[0].recipient,
    currency: group[0].currency,
    paymentCount: group.length,
    totalAmountXmr,
    directFeesXmr,
    batchFeeXmr,
    feeSavingsXmr,
    effectiveFeeRatio: Number((batchFeeXmr / totalAmountXmr).toFixed(6)),
    paymentIds: group.map((payment) => payment.id),
    workOrderIds: group.map((payment) => payment.workOrderId).filter(Boolean)
  };
}

function settlementReason({ totalAmountXmr, paymentCount, oldestAgeSeconds, policy }) {
  if (totalAmountXmr >= policy.minBatchAmountXmr) {
    return "amount_threshold";
  }
  if (paymentCount >= policy.maxBatchSize) {
    return "batch_size";
  }
  if (oldestAgeSeconds >= policy.maxHoldSeconds) {
    return "max_hold_time";
  }
  return "manual";
}

function summarize(payments, batches, policy) {
  const totalAmountXmr = roundXmr(sum(payments.map((payment) => payment.amountXmr)));
  const directFeesXmr = roundXmr(payments.length * estimateMoneroFee({ outputCount: 1, policy }));
  const batchedFeesXmr = roundXmr(sum(batches.map((batch) => batch.batchFeeXmr)));

  return {
    paymentCount: payments.length,
    totalAmountXmr,
    directFeesXmr,
    batchedFeesXmr,
    estimatedFeeSavingsXmr: roundXmr(Math.max(0, directFeesXmr - batchedFeesXmr))
  };
}

function mergePolicy(policy) {
  return { ...DEFAULT_POLICY, ...policy };
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}

function requirePositiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new TypeError(`${field} must be a positive number`);
  }
  return number;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function roundXmr(value) {
  return Number(value.toFixed(12));
}

module.exports = {
  DEFAULT_POLICY,
  analyzeMicropayment,
  estimateMoneroFee,
  planMicropaymentSettlement
};
