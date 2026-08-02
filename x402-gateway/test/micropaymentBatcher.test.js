"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  analyzeMicropayment,
  estimateMoneroFee,
  planMicropaymentSettlement
} = require("../src/micropaymentBatcher");

test("flags tiny x402 payments when direct Monero fees are too expensive", () => {
  const analysis = analyzeMicropayment(0.001);

  assert.equal(analysis.isMicropayment, true);
  assert.equal(analysis.shouldBatch, true);
  assert.equal(analysis.directFeeXmr, estimateMoneroFee());
  assert.ok(analysis.feeRatio > 0.025);
});

test("aggregates micropayments by robot recipient", () => {
  const plan = planMicropaymentSettlement(
    [
      payment("pay-1", "robot-a", 0.004),
      payment("pay-2", "robot-a", 0.006),
      payment("pay-3", "robot-a", 0.01),
      payment("pay-4", "robot-b", 0.003)
    ],
    { now: new Date("2026-08-02T18:00:00Z") }
  );

  assert.equal(plan.batches.length, 1);
  assert.equal(plan.batches[0].recipient, "robot-a");
  assert.equal(plan.batches[0].totalAmountXmr, 0.02);
  assert.equal(plan.batches[0].reason, "amount_threshold");
  assert.deepEqual(plan.batches[0].paymentIds, ["pay-1", "pay-2", "pay-3"]);
  assert.equal(plan.pending.length, 1);
  assert.equal(plan.pending[0].recipient, "robot-b");
  assert.ok(plan.summary.estimatedFeeSavingsXmr > 0);
});

test("forces settlement when a small batch reaches the maximum hold time", () => {
  const plan = planMicropaymentSettlement(
    [payment("pay-1", "robot-a", 0.002, "2026-08-02T16:30:00Z")],
    {
      now: new Date("2026-08-02T18:00:00Z"),
      policy: { maxHoldSeconds: 1800 }
    }
  );

  assert.equal(plan.batches.length, 1);
  assert.equal(plan.batches[0].reason, "max_hold_time");
});

test("keeps small recent totals pending until they are efficient to settle", () => {
  const plan = planMicropaymentSettlement(
    [payment("pay-1", "robot-a", 0.002), payment("pay-2", "robot-a", 0.003)],
    { now: new Date("2026-08-02T18:00:00Z") }
  );

  assert.equal(plan.batches.length, 0);
  assert.equal(plan.pending.length, 1);
  assert.equal(plan.pending[0].totalAmountXmr, 0.005);
  assert.equal(plan.pending[0].missingAmountXmr, 0.015);
});

test("rejects invalid payment payloads before planning settlement", () => {
  assert.throws(
    () => planMicropaymentSettlement([{ id: "bad", recipient: "robot-a", amountXmr: 0 }]),
    /amountXmr must be a positive number/
  );
});

function payment(id, recipient, amountXmr, createdAt = "2026-08-02T17:55:00Z") {
  return {
    id,
    recipient,
    amountXmr,
    workOrderId: `${id}-work`,
    createdAt
  };
}
