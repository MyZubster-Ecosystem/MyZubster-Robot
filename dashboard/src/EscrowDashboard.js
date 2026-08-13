"use strict";

const { buildDashboardSummary, formatXmr } = require("./escrowDashboardData");

function createEscrowDashboard(React) {
  if (!React || typeof React.createElement !== "function") {
    throw new Error("React with createElement is required");
  }

  return function EscrowDashboard({
    snapshot,
    filters = {},
    onFilterChange = () => {},
    onRefresh = () => {},
    isLoading = false
  }) {
    const summary = buildDashboardSummary(snapshot || {}, filters);
    const h = React.createElement;

    return h(
      "section",
      { className: "x402-dashboard", "aria-label": "x402 escrow payment dashboard" },
      h(
        "header",
        { className: "x402-dashboard__header" },
        h("div", null, h("h1", null, "x402 Payments"), h("p", null, "Escrow, fees, transactions, and disputes")),
        h(
          "button",
          { type: "button", className: "x402-dashboard__refresh", onClick: onRefresh, disabled: isLoading },
          isLoading ? "Refreshing" : "Refresh"
        )
      ),
      h("div", { className: "x402-dashboard__filters" }, renderStatusFilter(h, summary.filters, onFilterChange)),
      h(
        "div",
        { className: "x402-dashboard__cards" },
        metricCard(h, "Payments", summary.metrics.totalPayments),
        metricCard(h, "Pending", summary.metrics.pendingPayments),
        metricCard(h, "Completed", summary.metrics.completedPayments),
        metricCard(h, "Disputes", summary.metrics.activeDisputes),
        metricCard(h, "Fees", formatXmr(summary.metrics.totalFeesXmr))
      ),
      renderAlerts(h, summary.alerts),
      renderPayments(h, summary.payments),
      renderTransactions(h, summary.transactions)
    );
  };
}

function renderStatusFilter(h, filters, onFilterChange) {
  const statuses = [
    ["all", "All"],
    ["pending", "Pending"],
    ["escrow_locked", "Escrow"],
    ["completed", "Completed"],
    ["disputed", "Disputed"],
    ["refunded", "Refunded"]
  ];

  return h(
    "div",
    { className: "x402-dashboard__status-filter", role: "tablist", "aria-label": "Payment status" },
    ...statuses.map(([status, label]) =>
      h(
        "button",
        {
          key: status,
          type: "button",
          role: "tab",
          "aria-selected": filters.status === status,
          className: filters.status === status ? "is-active" : "",
          onClick: () => onFilterChange({ ...filters, status })
        },
        label
      )
    )
  );
}

function metricCard(h, label, value) {
  return h(
    "article",
    { className: "x402-dashboard__card" },
    h("span", { className: "x402-dashboard__card-label" }, label),
    h("strong", null, String(value))
  );
}

function renderAlerts(h, alerts) {
  if (!alerts.length) {
    return h("div", { className: "x402-dashboard__empty-alerts" }, "No active payment alerts");
  }

  return h(
    "div",
    { className: "x402-dashboard__alerts", role: "status" },
    ...alerts.map((alert) =>
      h(
        "article",
        { key: `${alert.type}-${alert.paymentId}`, className: `x402-dashboard__alert is-${alert.severity}` },
        h("strong", null, alert.severity.toUpperCase()),
        h("span", null, alert.message)
      )
    )
  );
}

function renderPayments(h, payments) {
  return h(
    "section",
    { className: "x402-dashboard__panel" },
    h("h2", null, "Payments"),
    h(
      "div",
      { className: "x402-dashboard__table", role: "table", "aria-label": "Escrow payments" },
      h(
        "div",
        { className: "x402-dashboard__row is-heading", role: "row" },
        h("span", { role: "columnheader" }, "Payment"),
        h("span", { role: "columnheader" }, "Robot"),
        h("span", { role: "columnheader" }, "Status"),
        h("span", { role: "columnheader" }, "Amount"),
        h("span", { role: "columnheader" }, "Fee")
      ),
      ...payments.map((payment) =>
        h(
          "div",
          {
            key: payment.id,
            className: payment.hasActiveDispute ? "x402-dashboard__row has-dispute" : "x402-dashboard__row",
            role: "row"
          },
          h("span", { role: "cell" }, payment.id),
          h("span", { role: "cell" }, payment.robotId),
          h("span", { role: "cell" }, payment.status.replace(/_/g, " ")),
          h("span", { role: "cell" }, formatXmr(payment.amountXmr)),
          h("span", { role: "cell" }, formatXmr(payment.feeXmr))
        )
      )
    )
  );
}

function renderTransactions(h, transactions) {
  return h(
    "section",
    { className: "x402-dashboard__panel" },
    h("h2", null, "Transaction History"),
    h(
      "ol",
      { className: "x402-dashboard__history" },
      ...transactions.slice(0, 8).map((transaction) =>
        h(
          "li",
          { key: transaction.id },
          h("span", null, transaction.type),
          h("strong", null, formatXmr(transaction.amountXmr)),
          h("small", null, transaction.txHash || transaction.status)
        )
      )
    )
  );
}

module.exports = {
  createEscrowDashboard
};
