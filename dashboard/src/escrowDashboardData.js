"use strict";

const PAYMENT_STATUSES = ["pending", "escrow_locked", "completed", "disputed", "refunded"];
const ACTIVE_DISPUTE_STATUSES = new Set(["open", "pending", "in_review", "disputed"]);

function normalizeDashboardSnapshot(input = {}) {
  const payments = Array.isArray(input.payments) ? input.payments.map(normalizePayment) : [];
  const transactions = Array.isArray(input.transactions)
    ? input.transactions.map(normalizeTransaction).sort(sortNewestFirst)
    : [];
  const disputes = Array.isArray(input.disputes) ? input.disputes.map(normalizeDispute).sort(sortNewestFirst) : [];

  return {
    generatedAt: input.generatedAt || new Date(0).toISOString(),
    payments,
    transactions,
    disputes,
    metrics: buildMetrics(payments, transactions, disputes)
  };
}

function buildDashboardSummary(input = {}, filters = {}) {
  const snapshot = input.metrics ? input : normalizeDashboardSnapshot(input);
  const filteredPayments = filterPayments(snapshot.payments, filters);
  const activeDisputes = snapshot.disputes.filter((dispute) => ACTIVE_DISPUTE_STATUSES.has(dispute.status));
  const disputePaymentIds = new Set(activeDisputes.map((dispute) => dispute.paymentId));

  return {
    generatedAt: snapshot.generatedAt,
    filters: normalizeFilters(filters),
    metrics: {
      ...snapshot.metrics,
      filteredPayments: filteredPayments.length,
      filteredAmountXmr: sum(filteredPayments.map((payment) => payment.amountXmr)),
      filteredFeesXmr: sum(filteredPayments.map((payment) => payment.feeXmr))
    },
    payments: filteredPayments.map((payment) => ({
      ...payment,
      hasActiveDispute: disputePaymentIds.has(payment.id)
    })),
    transactions: snapshot.transactions,
    disputes: activeDisputes,
    alerts: buildAlerts(snapshot, activeDisputes)
  };
}

function filterPayments(payments = [], filters = {}) {
  const normalized = normalizeFilters(filters);
  return payments.filter((payment) => {
    if (normalized.status !== "all" && payment.status !== normalized.status) return false;
    if (normalized.robotId && payment.robotId !== normalized.robotId) return false;
    if (normalized.clientId && payment.clientId !== normalized.clientId) return false;
    if (normalized.query) {
      const haystack = [payment.id, payment.escrowId, payment.clientId, payment.robotId, payment.service]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(normalized.query)) return false;
    }
    return true;
  });
}

function buildDashboardEndpointDefinitions() {
  return [
    {
      method: "GET",
      path: "/api/dashboard/x402-escrow",
      description: "Aggregated x402 payment, escrow, transaction, and dispute dashboard payload"
    },
    {
      method: "GET",
      path: "/api/dashboard/x402-escrow/payments",
      description: "Filterable payment list for clients and robots"
    },
    {
      method: "GET",
      path: "/api/dashboard/x402-escrow/transactions",
      description: "Chronological transaction and fee history"
    },
    {
      method: "GET",
      path: "/api/dashboard/x402-escrow/disputes",
      description: "Open dispute and alert feed"
    }
  ];
}

function formatXmr(value) {
  return `${Number(value || 0).toFixed(6)} XMR`;
}

function buildMetrics(payments, transactions, disputes) {
  const statusCounts = PAYMENT_STATUSES.reduce((counts, status) => {
    counts[status] = 0;
    return counts;
  }, {});

  for (const payment of payments) {
    statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
  }

  const activeDisputeCount = disputes.filter((dispute) => ACTIVE_DISPUTE_STATUSES.has(dispute.status)).length;

  return {
    totalPayments: payments.length,
    totalAmountXmr: sum(payments.map((payment) => payment.amountXmr)),
    totalFeesXmr: sum(transactions.map((transaction) => transaction.feeXmr)),
    pendingPayments: statusCounts.pending + statusCounts.escrow_locked,
    completedPayments: statusCounts.completed,
    disputedPayments: statusCounts.disputed,
    refundedPayments: statusCounts.refunded,
    activeDisputes: activeDisputeCount,
    statusCounts
  };
}

function buildAlerts(snapshot, activeDisputes) {
  const staleEscrows = snapshot.payments.filter((payment) => {
    if (!["pending", "escrow_locked"].includes(payment.status)) return false;
    const updatedAt = new Date(payment.updatedAt || payment.createdAt);
    if (Number.isNaN(updatedAt.getTime())) return false;
    const ageHours = (Date.now() - updatedAt.getTime()) / 36e5;
    return ageHours >= 24;
  });

  return [
    ...activeDisputes.map((dispute) => ({
      type: "dispute",
      severity: dispute.severity,
      message: `Dispute ${dispute.id} needs review for payment ${dispute.paymentId}`,
      paymentId: dispute.paymentId
    })),
    ...staleEscrows.map((payment) => ({
      type: "stale_escrow",
      severity: "medium",
      message: `Payment ${payment.id} has been waiting in ${payment.status}`,
      paymentId: payment.id
    }))
  ];
}

function normalizePayment(payment) {
  return {
    id: requireString(payment.id, "payment.id"),
    escrowId: payment.escrowId ? String(payment.escrowId) : "",
    clientId: requireString(payment.clientId || payment.client, "payment.clientId"),
    robotId: requireString(payment.robotId || payment.robot, "payment.robotId"),
    service: payment.service ? String(payment.service) : "Robot service",
    status: normalizeStatus(payment.status),
    amountXmr: numberOrZero(payment.amountXmr || payment.amount),
    feeXmr: numberOrZero(payment.feeXmr || payment.fee),
    createdAt: normalizeDate(payment.createdAt),
    updatedAt: normalizeDate(payment.updatedAt || payment.createdAt)
  };
}

function normalizeTransaction(transaction) {
  return {
    id: requireString(transaction.id, "transaction.id"),
    paymentId: transaction.paymentId ? String(transaction.paymentId) : "",
    txHash: transaction.txHash ? String(transaction.txHash) : "",
    type: transaction.type ? String(transaction.type) : "payment",
    status: transaction.status ? String(transaction.status) : "pending",
    amountXmr: numberOrZero(transaction.amountXmr || transaction.amount),
    feeXmr: numberOrZero(transaction.feeXmr || transaction.fee),
    createdAt: normalizeDate(transaction.createdAt)
  };
}

function normalizeDispute(dispute) {
  return {
    id: requireString(dispute.id, "dispute.id"),
    paymentId: requireString(dispute.paymentId, "dispute.paymentId"),
    status: dispute.status ? String(dispute.status) : "open",
    severity: dispute.severity ? String(dispute.severity) : "medium",
    reason: dispute.reason ? String(dispute.reason) : "Dispute requires review",
    assignedTo: dispute.assignedTo ? String(dispute.assignedTo) : "",
    createdAt: normalizeDate(dispute.createdAt || dispute.openedAt)
  };
}

function normalizeFilters(filters = {}) {
  return {
    status: filters.status && filters.status !== "all" ? normalizeStatus(filters.status) : "all",
    robotId: filters.robotId ? String(filters.robotId).trim() : "",
    clientId: filters.clientId ? String(filters.clientId).trim() : "",
    query: filters.query ? String(filters.query).trim().toLowerCase() : ""
  };
}

function normalizeStatus(status) {
  const value = String(status || "pending").trim().toLowerCase().replace(/-/g, "_");
  if (value === "paid" || value === "released") return "completed";
  if (value === "waiting" || value === "payment_required") return "pending";
  if (!PAYMENT_STATUSES.includes(value)) return "pending";
  return value;
}

function normalizeDate(value) {
  const date = value ? new Date(value) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function sortNewestFirst(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function sum(values) {
  return Number(values.reduce((total, value) => total + numberOrZero(value), 0).toFixed(12));
}

module.exports = {
  buildDashboardEndpointDefinitions,
  buildDashboardSummary,
  filterPayments,
  formatXmr,
  normalizeDashboardSnapshot
};
