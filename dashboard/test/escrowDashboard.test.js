"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildDashboardEndpointDefinitions,
  buildDashboardSummary,
  filterPayments,
  formatXmr,
  normalizeDashboardSnapshot
} = require("../src/escrowDashboardData");
const { buildUrl, createEscrowDashboardApi } = require("../src/escrowDashboardApi");
const { createEscrowDashboard } = require("../src/EscrowDashboard");

test("normalizes dashboard data and calculates escrow metrics", () => {
  const snapshot = normalizeDashboardSnapshot(samplePayload());

  assert.equal(snapshot.metrics.totalPayments, 3);
  assert.equal(snapshot.metrics.pendingPayments, 1);
  assert.equal(snapshot.metrics.completedPayments, 1);
  assert.equal(snapshot.metrics.activeDisputes, 1);
  assert.equal(snapshot.metrics.totalFeesXmr, 0.0019);
});

test("filters payments by status and query", () => {
  const snapshot = normalizeDashboardSnapshot(samplePayload());
  const disputed = filterPayments(snapshot.payments, { status: "disputed", query: "inspection" });

  assert.equal(disputed.length, 1);
  assert.equal(disputed[0].id, "pay-3");
});

test("builds dashboard summary with active alerts", () => {
  const summary = buildDashboardSummary(samplePayload(), { status: "all" });

  assert.equal(summary.alerts.length, 1);
  assert.equal(summary.payments.find((payment) => payment.id === "pay-3").hasActiveDispute, true);
  assert.equal(formatXmr(summary.metrics.totalAmountXmr), "0.150000 XMR");
});

test("API client builds filter URLs and normalizes response payload", async () => {
  const calls = [];
  const api = createEscrowDashboardApi({
    baseUrl: "https://robot.example",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({ data: samplePayload() })
      };
    },
    headers: { Authorization: "Bearer token" }
  });

  const snapshot = await api.getDashboard({ status: "pending", robotId: "robot-a" });

  assert.equal(calls[0].url, "https://robot.example/api/dashboard/x402-escrow?status=pending&robotId=robot-a");
  assert.equal(calls[0].options.headers.Authorization, "Bearer token");
  assert.equal(snapshot.metrics.totalPayments, 3);
});

test("dashboard component factory renders metric cards, payments, and alerts", () => {
  const React = {
    createElement(type, props, ...children) {
      return { type, props: props || {}, children };
    }
  };
  const Dashboard = createEscrowDashboard(React);
  const tree = Dashboard({ snapshot: samplePayload(), filters: { status: "disputed" } });
  const text = flattenText(tree).join(" ");

  assert.equal(tree.type, "section");
  assert.match(text, /x402 Payments/);
  assert.match(text, /pay-3/);
  assert.match(text, /Dispute disp-1 needs review/);
});

test("documents the expected dashboard API surface", () => {
  const endpoints = buildDashboardEndpointDefinitions();

  assert.deepEqual(
    endpoints.map((endpoint) => endpoint.path),
    [
      "/api/dashboard/x402-escrow",
      "/api/dashboard/x402-escrow/payments",
      "/api/dashboard/x402-escrow/transactions",
      "/api/dashboard/x402-escrow/disputes"
    ]
  );
  assert.equal(buildUrl("", "/api/dashboard/x402-escrow", { status: "completed" }), "/api/dashboard/x402-escrow?status=completed");
});

function samplePayload() {
  return {
    generatedAt: "2026-08-02T21:30:00Z",
    payments: [
      {
        id: "pay-1",
        escrowId: "escrow-1",
        clientId: "client-a",
        robotId: "robot-a",
        service: "inspection",
        status: "escrow_locked",
        amountXmr: 0.05,
        feeXmr: 0.0005,
        createdAt: "2026-08-02T12:00:00Z",
        updatedAt: "2026-08-02T12:15:00Z"
      },
      {
        id: "pay-2",
        escrowId: "escrow-2",
        clientId: "client-b",
        robotId: "robot-b",
        service: "delivery",
        status: "released",
        amountXmr: 0.04,
        feeXmr: 0.0004,
        createdAt: "2026-08-02T13:00:00Z",
        updatedAt: "2026-08-02T14:00:00Z"
      },
      {
        id: "pay-3",
        escrowId: "escrow-3",
        clientId: "client-c",
        robotId: "robot-a",
        service: "inspection",
        status: "disputed",
        amountXmr: 0.06,
        feeXmr: 0.001,
        createdAt: "2026-08-02T15:00:00Z",
        updatedAt: "2026-08-02T16:00:00Z"
      }
    ],
    transactions: [
      {
        id: "tx-1",
        paymentId: "pay-2",
        txHash: "abc",
        type: "release",
        status: "confirmed",
        amountXmr: 0.04,
        feeXmr: 0.0004,
        createdAt: "2026-08-02T14:00:00Z"
      },
      {
        id: "tx-2",
        paymentId: "pay-3",
        txHash: "",
        type: "fee",
        status: "pending",
        amountXmr: 0.001,
        feeXmr: 0.0015,
        createdAt: "2026-08-02T16:00:00Z"
      }
    ],
    disputes: [
      {
        id: "disp-1",
        paymentId: "pay-3",
        status: "open",
        severity: "high",
        reason: "robot evidence mismatch",
        openedAt: "2026-08-02T16:05:00Z"
      }
    ]
  };
}

function flattenText(node) {
  if (node === null || node === undefined) return [];
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (!node.children) return [];
  return node.children.flatMap(flattenText);
}
