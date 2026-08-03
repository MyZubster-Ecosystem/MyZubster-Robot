"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  applyAiDecision,
  createConditionalPayment,
  markWorkStarted,
  recordClientDecision,
  recordRobotFailure,
  simulateAiReview,
  submitRobotEvidence
} = require("../src/conditionalPayment");

const now = new Date("2026-08-02T18:30:00Z");

test("releases funds only after robot success and client approval", () => {
  const payment = createPayment();
  const started = markWorkStarted(payment, { note: "route accepted" }, { now });
  const withEvidence = submitRobotEvidence(
    started,
    { completed: true, workUnits: 32, photoCount: 2 },
    { now }
  );

  assert.equal(withEvidence.status, "awaiting_client_confirmation");

  const settled = recordClientDecision(withEvidence, { approved: true, note: "work looks good" }, { now });

  assert.equal(settled.status, "released");
  assert.equal(settled.releaseReason, "success_conditions_met");
  assert.ok(settled.settledAt);
});

test("refunds when the robot reports failure", () => {
  const payment = markWorkStarted(createPayment(), {}, { now });
  const refunded = recordRobotFailure(payment, "navigation failed", { now });

  assert.equal(refunded.status, "refunded");
  assert.equal(refunded.refundReason, "navigation failed");
});

test("client rejection moves the payment into dispute for AI review", () => {
  const payment = submitRobotEvidence(
    createPayment(),
    { completed: true, workUnits: 10, photoCount: 1 },
    { now }
  );
  const disputed = recordClientDecision(payment, { approved: false, note: "missed area" }, { now });

  assert.equal(disputed.status, "disputed");
  assert.equal(disputed.refundReason, "missed area");
});

test("simulated AI can release a disputed payment when evidence is strong", () => {
  const payment = submitRobotEvidence(
    createPayment(),
    { completed: true, workUnits: 60, photoCount: 3 },
    { now }
  );
  const review = simulateAiReview(payment);
  const settled = applyAiDecision(payment, review, { now });

  assert.equal(review.decision, "release");
  assert.equal(settled.status, "released");
  assert.equal(settled.aiDecision.simulated, true);
});

test("simulated AI refunds failed work", () => {
  const payment = submitRobotEvidence(
    createPayment(),
    { completed: false, failed: true, error: "sensor timeout" },
    { now }
  );
  const review = simulateAiReview(payment);
  const settled = applyAiDecision(payment, review, { now });

  assert.equal(review.decision, "refund");
  assert.equal(settled.status, "refunded");
});

test("does not allow changes after settlement", () => {
  const released = recordClientDecision(
    submitRobotEvidence(createPayment(), { completed: true }, { now }),
    { approved: true },
    { now }
  );

  assert.throws(() => recordRobotFailure(released, "too late", { now }), /already released/);
});

function createPayment() {
  return createConditionalPayment(
    {
      id: "pay-conditional-1",
      escrowId: "escrow-1",
      clientId: "client-1",
      robotId: "robot-1",
      amountXmr: 0.06,
      workOrder: { task: "garden watering" }
    },
    { now }
  );
}
