"use strict";

const TERMINAL_SUBSCRIPTION_STATUSES = new Set(["cancelled", "expired"]);
const TERMINAL_TRANCHE_STATUSES = new Set(["released", "refunded"]);

function createRobotSubscription(input, { now = new Date() } = {}) {
  const clientId = requireString(input.clientId, "clientId");
  const robotId = requireString(input.robotId, "robotId");
  const totalAmountXmr = requirePositiveNumber(input.totalAmountXmr, "totalAmountXmr");
  const trancheCount = requirePositiveInteger(input.trancheCount || 4, "trancheCount");
  const periodDays = requirePositiveInteger(input.periodDays || 28, "periodDays");
  const intervalDays = requirePositiveInteger(input.intervalDays || Math.ceil(periodDays / trancheCount), "intervalDays");

  if (clientId === robotId) {
    throw createError(400, "clientId and robotId must be different");
  }

  const startAt = input.startAt ? parseDate(input.startAt, "startAt") : now;
  const amountPerTranche = roundXmr(totalAmountXmr / trancheCount);

  return {
    id: input.id || `subscription_${startAt.getTime()}`,
    clientId,
    robotId,
    escrowId: input.escrowId || null,
    currency: input.currency || "XMR",
    totalAmountXmr,
    periodDays,
    intervalDays,
    autoRenew: input.autoRenew !== false,
    renewalCount: Number(input.renewalCount || 0),
    status: "active",
    workOrder: input.workOrder || null,
    startAt: startAt.toISOString(),
    endAt: addDays(startAt, periodDays).toISOString(),
    tranches: buildTranches({
      startAt,
      intervalDays,
      trancheCount,
      amountPerTranche,
      totalAmountXmr
    }),
    createdAt: now.toISOString(),
    cancelledAt: null,
    renewalOf: input.renewalOf || null
  };
}

function recordTrancheWork(subscription, sequence, evidence, { now = new Date() } = {}) {
  const next = requireActiveSubscription(subscription);
  const tranche = findMutableTranche(next, sequence);
  requireUnsettledTranche(tranche);

  tranche.status = "work_submitted";
  tranche.workEvidence = normalizeEvidence(evidence);
  tranche.workSubmittedAt = now.toISOString();
  return next;
}

function approveTranche(subscription, sequence, approval, { now = new Date() } = {}) {
  const next = requireActiveSubscription(subscription);
  const tranche = findMutableTranche(next, sequence);
  requireUnsettledTranche(tranche);

  tranche.clientApproval = {
    approved: Boolean(approval && approval.approved),
    note: approval && approval.note ? String(approval.note) : "",
    at: now.toISOString()
  };

  tranche.status = tranche.clientApproval.approved ? "approved" : "disputed";
  return next;
}

function releaseDueTranches(subscription, { now = new Date() } = {}) {
  const next = requireActiveSubscription(subscription);
  const released = [];
  const blocked = [];

  for (const tranche of next.tranches) {
    if (TERMINAL_TRANCHE_STATUSES.has(tranche.status)) {
      continue;
    }

    if (parseDate(tranche.dueAt, "dueAt") > now) {
      blocked.push({ sequence: tranche.sequence, reason: "not_due" });
      continue;
    }

    if (!isTrancheReady(tranche)) {
      blocked.push({ sequence: tranche.sequence, reason: blockedReason(tranche) });
      continue;
    }

    tranche.status = "released";
    tranche.releasedAt = now.toISOString();
    released.push({
      sequence: tranche.sequence,
      amountXmr: tranche.amountXmr
    });
  }

  if (next.tranches.every((tranche) => tranche.status === "released")) {
    next.status = next.autoRenew ? "renewal_due" : "expired";
  }

  return {
    subscription: next,
    released,
    blocked,
    totalReleasedXmr: roundXmr(sum(released.map((tranche) => tranche.amountXmr)))
  };
}

function refundRemainingTranches(subscription, reason, { now = new Date() } = {}) {
  const next = requireActiveSubscription(subscription);
  const refundReason = requireString(reason, "reason");
  let refundedAmountXmr = 0;

  for (const tranche of next.tranches) {
    if (!TERMINAL_TRANCHE_STATUSES.has(tranche.status)) {
      tranche.status = "refunded";
      tranche.refundReason = refundReason;
      tranche.refundedAt = now.toISOString();
      refundedAmountXmr = roundXmr(refundedAmountXmr + tranche.amountXmr);
    }
  }

  next.status = "cancelled";
  next.cancelledAt = now.toISOString();

  return {
    subscription: next,
    refundedAmountXmr
  };
}

function renewSubscription(subscription, { now = new Date() } = {}) {
  if (!subscription || typeof subscription !== "object") {
    throw createError(400, "subscription is required");
  }
  if (!subscription.autoRenew) {
    throw createError(409, "subscription does not allow auto renewal");
  }
  if (subscription.status !== "renewal_due" && parseDate(subscription.endAt, "endAt") > now) {
    throw createError(409, "subscription is not ready for renewal");
  }

  return createRobotSubscription(
    {
      id: `${subscription.id}_renewal_${Number(subscription.renewalCount || 0) + 1}`,
      clientId: subscription.clientId,
      robotId: subscription.robotId,
      totalAmountXmr: subscription.totalAmountXmr,
      currency: subscription.currency,
      periodDays: subscription.periodDays,
      intervalDays: subscription.intervalDays,
      trancheCount: subscription.tranches.length,
      autoRenew: subscription.autoRenew,
      workOrder: subscription.workOrder,
      startAt: subscription.endAt,
      renewalCount: Number(subscription.renewalCount || 0) + 1,
      renewalOf: subscription.id
    },
    { now }
  );
}

function summarizeSubscription(subscription) {
  if (!subscription || typeof subscription !== "object") {
    throw createError(400, "subscription is required");
  }

  const releasedAmountXmr = roundXmr(sum(
    subscription.tranches
      .filter((tranche) => tranche.status === "released")
      .map((tranche) => tranche.amountXmr)
  ));
  const lockedAmountXmr = roundXmr(sum(
    subscription.tranches
      .filter((tranche) => !TERMINAL_TRANCHE_STATUSES.has(tranche.status))
      .map((tranche) => tranche.amountXmr)
  ));

  return {
    id: subscription.id,
    status: subscription.status,
    releasedAmountXmr,
    lockedAmountXmr,
    releasedTranches: subscription.tranches.filter((tranche) => tranche.status === "released").length,
    totalTranches: subscription.tranches.length,
    nextDueAt: nextDueAt(subscription)
  };
}

function buildTranches({ startAt, intervalDays, trancheCount, amountPerTranche, totalAmountXmr }) {
  const tranches = [];
  let allocated = 0;

  for (let index = 0; index < trancheCount; index += 1) {
    const isLast = index === trancheCount - 1;
    const amountXmr = isLast ? roundXmr(totalAmountXmr - allocated) : amountPerTranche;
    allocated = roundXmr(allocated + amountXmr);

    tranches.push({
      sequence: index + 1,
      dueAt: addDays(startAt, intervalDays * (index + 1)).toISOString(),
      amountXmr,
      status: "locked",
      workEvidence: null,
      workSubmittedAt: null,
      clientApproval: null,
      releasedAt: null,
      refundedAt: null,
      refundReason: null
    });
  }

  return tranches;
}

function isTrancheReady(tranche) {
  return Boolean(
    tranche.workEvidence &&
    tranche.workEvidence.completed === true &&
    !tranche.workEvidence.error &&
    tranche.clientApproval &&
    tranche.clientApproval.approved === true
  );
}

function blockedReason(tranche) {
  if (!tranche.workEvidence) return "missing_work_evidence";
  if (tranche.workEvidence.error) return "work_error";
  if (!tranche.clientApproval) return "missing_client_approval";
  if (!tranche.clientApproval.approved) return "client_rejected";
  return "not_ready";
}

function findMutableTranche(subscription, sequence) {
  const numericSequence = requirePositiveInteger(sequence, "sequence");
  const tranche = subscription.tranches.find((item) => item.sequence === numericSequence);
  if (!tranche) {
    throw createError(404, "tranche not found");
  }
  return tranche;
}

function requireActiveSubscription(subscription) {
  if (!subscription || typeof subscription !== "object") {
    throw createError(400, "subscription is required");
  }
  if (TERMINAL_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    throw createError(409, `subscription is ${subscription.status}`);
  }
  return clone(subscription);
}

function requireUnsettledTranche(tranche) {
  if (TERMINAL_TRANCHE_STATUSES.has(tranche.status)) {
    throw createError(409, `tranche is already ${tranche.status}`);
  }
}

function normalizeEvidence(evidence) {
  if (!evidence || typeof evidence !== "object") {
    throw createError(400, "evidence is required");
  }

  return {
    completed: Boolean(evidence.completed),
    workUnits: Number(evidence.workUnits || 0),
    photoCount: Number(evidence.photoCount || 0),
    note: evidence.note ? String(evidence.note) : "",
    error: evidence.error ? String(evidence.error) : ""
  };
}

function nextDueAt(subscription) {
  const next = subscription.tranches.find((tranche) => !TERMINAL_TRANCHE_STATUSES.has(tranche.status));
  return next ? next.dueAt : null;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function parseDate(value, field) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError(400, `${field} must be a valid date`);
  }
  return date;
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createError(400, `${field} is required`);
  }
  return value.trim();
}

function requirePositiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw createError(400, `${field} must be a positive number`);
  }
  return number;
}

function requirePositiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw createError(400, `${field} must be a positive integer`);
  }
  return number;
}

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function roundXmr(value) {
  return Number(value.toFixed(12));
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

module.exports = {
  approveTranche,
  createRobotSubscription,
  recordTrancheWork,
  refundRemainingTranches,
  releaseDueTranches,
  renewSubscription,
  summarizeSubscription
};
