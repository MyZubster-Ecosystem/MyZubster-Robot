"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  P2PPaymentStore,
  applyP2PAiDecision,
  approveP2PRelease,
  calculateRobotReputation,
  createP2PServiceRequest,
  lockP2PEscrow,
  acceptP2PService,
  submitP2PServiceEvidence
} = require("../src/p2pRobotPayments");
const { createP2PRouter } = require("../src/p2pRobotRoutes");

const now = new Date("2026-08-02T19:30:00Z");

test("creates x402 Payment Required payload with identity and reputation metadata", () => {
  const request = createP2PServiceRequest(baseInput(), { now });

  assert.equal(request.status, "payment_required");
  assert.equal(request.x402.statusCode, 402);
  assert.equal(request.x402.payTo, "provider-wallet");
  assert.equal(request.x402.metadata.providerRobotId, "robot-b");
  assert.ok(request.x402.metadata.providerReputation >= 0.55);
});

test("rejects low reputation providers before payment lock", () => {
  const input = baseInput({
    provider: identity("robot-b", "provider-wallet", {
      completedJobs: 1,
      disputedJobs: 5,
      averageRating: 2,
      successfulPayments: 1,
      failedPayments: 4
    })
  });

  assert.throws(() => createP2PServiceRequest(input, { now }), /provider reputation is too low/);
});

test("locks escrow, starts service, accepts evidence, and releases funds", () => {
  let request = createP2PServiceRequest(baseInput(), { now });
  request = lockP2PEscrow(request, {
    payerRobotId: "robot-a",
    escrowId: "escrow-p2p-1",
    amountXmr: 0.07
  }, { now });
  request = acceptP2PService(request, { note: "provider accepted route" }, { now });
  request = submitP2PServiceEvidence(request, { completed: true, workUnits: 18, photoCount: 2 }, { now });
  request = approveP2PRelease(request, "requester", { accepted: true }, { now });

  assert.equal(request.status, "released");
  assert.equal(request.escrow.lockedAmountXmr, 0.07);
  assert.ok(request.settledAt);
});

test("AI arbiter can release completed service when requester is unavailable", () => {
  let request = createP2PServiceRequest(baseInput(), { now });
  request = lockP2PEscrow(request, {
    payerRobotId: "robot-a",
    escrowId: "escrow-p2p-1",
    amountXmr: 0.07
  }, { now });
  request = submitP2PServiceEvidence(request, { completed: true, workUnits: 20 }, { now });
  request = applyP2PAiDecision(request, {
    decision: "release",
    confidence: 0.82,
    reason: "telemetry and evidence match"
  }, { now });

  assert.equal(request.status, "released");
  assert.ok(request.releaseApprovals.arbiter);
});

test("AI arbiter refunds failed P2P service", () => {
  let request = createP2PServiceRequest(baseInput(), { now });
  request = lockP2PEscrow(request, {
    payerRobotId: "robot-a",
    escrowId: "escrow-p2p-1",
    amountXmr: 0.07
  }, { now });
  request = submitP2PServiceEvidence(request, { completed: false, error: "service failed" }, { now });
  request = applyP2PAiDecision(request, {
    decision: "refund",
    confidence: 0.9,
    reason: "provider reported failure"
  }, { now });

  assert.equal(request.status, "refunded");
});

test("route handler exposes create, pay, evidence, and release endpoints", () => {
  const store = new P2PPaymentStore({ now: () => now });
  const router = createP2PRouter({ store });

  const created = router.handle({ method: "POST", path: "/api/p2p/requests", body: baseInput() });
  assert.equal(created.statusCode, 402);

  const id = created.body.request.id;
  const paid = router.handle({
    method: "POST",
    path: `/api/p2p/requests/${id}/pay`,
    body: { payerRobotId: "robot-a", escrowId: "escrow-p2p-1", amountXmr: 0.07 }
  });
  assert.equal(paid.statusCode, 200);
  assert.equal(paid.body.request.status, "escrow_locked");

  router.handle({ method: "POST", path: `/api/p2p/requests/${id}/accept`, body: {} });
  router.handle({
    method: "POST",
    path: `/api/p2p/requests/${id}/evidence`,
    body: { completed: true, workUnits: 18 }
  });
  const released = router.handle({
    method: "POST",
    path: `/api/p2p/requests/${id}/release`,
    body: { role: "requester", evidence: { accepted: true } }
  });

  assert.equal(released.statusCode, 200);
  assert.equal(released.body.request.status, "released");
});

test("reputation score rewards completed work and successful payments", () => {
  const strong = calculateRobotReputation({
    completedJobs: 20,
    disputedJobs: 1,
    averageRating: 4.8,
    successfulPayments: 20,
    failedPayments: 1
  });
  const weak = calculateRobotReputation({
    completedJobs: 1,
    disputedJobs: 8,
    averageRating: 2,
    successfulPayments: 1,
    failedPayments: 5
  });

  assert.ok(strong > weak);
});

function baseInput(overrides = {}) {
  return {
    requester: identity("robot-a", "requester-wallet"),
    provider: identity("robot-b", "provider-wallet"),
    service: "field assistance",
    amountXmr: 0.07,
    ...overrides
  };
}

function identity(robotId, walletAddress, reputation = {}) {
  return {
    robotId,
    walletAddress,
    services: ["field assistance"],
    reputation: {
      completedJobs: 12,
      disputedJobs: 1,
      averageRating: 4.6,
      successfulPayments: 12,
      failedPayments: 1,
      ...reputation
    }
  };
}
