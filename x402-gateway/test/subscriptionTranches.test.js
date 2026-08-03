"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  approveTranche,
  createRobotSubscription,
  recordTrancheWork,
  refundRemainingTranches,
  releaseDueTranches,
  renewSubscription,
  summarizeSubscription
} = require("../src/subscriptionTranches");

const start = new Date("2026-08-01T00:00:00Z");

test("creates weekly subscription tranches from a monthly escrow amount", () => {
  const subscription = createSubscription();

  assert.equal(subscription.status, "active");
  assert.equal(subscription.tranches.length, 4);
  assert.equal(subscription.tranches[0].amountXmr, 0.02);
  assert.equal(subscription.tranches[0].dueAt, "2026-08-08T00:00:00.000Z");
  assert.equal(subscription.tranches[3].dueAt, "2026-08-29T00:00:00.000Z");
});

test("releases only due tranches with work evidence and client approval", () => {
  let subscription = createSubscription();
  subscription = recordTrancheWork(subscription, 1, { completed: true, workUnits: 12, photoCount: 1 });
  subscription = approveTranche(subscription, 1, { approved: true, note: "week one complete" });
  subscription = recordTrancheWork(subscription, 2, { completed: true, workUnits: 10 });
  subscription = approveTranche(subscription, 2, { approved: true });

  const result = releaseDueTranches(subscription, { now: new Date("2026-08-09T00:00:00Z") });

  assert.equal(result.released.length, 1);
  assert.equal(result.released[0].sequence, 1);
  assert.equal(result.totalReleasedXmr, 0.02);
  assert.equal(result.subscription.tranches[1].status, "approved");
  assert.equal(result.blocked.some((item) => item.sequence === 2 && item.reason === "not_due"), true);
});

test("blocks a due tranche until the client approves it", () => {
  const withEvidence = recordTrancheWork(createSubscription(), 1, { completed: true, workUnits: 8 });
  const result = releaseDueTranches(withEvidence, { now: new Date("2026-08-09T00:00:00Z") });

  assert.equal(result.released.length, 0);
  assert.deepEqual(result.blocked[0], { sequence: 1, reason: "missing_client_approval" });
});

test("marks subscription renewal due after all tranches release", () => {
  let subscription = createSubscription();
  for (let sequence = 1; sequence <= 4; sequence += 1) {
    subscription = recordTrancheWork(subscription, sequence, { completed: true, workUnits: 10 });
    subscription = approveTranche(subscription, sequence, { approved: true });
  }

  const result = releaseDueTranches(subscription, { now: new Date("2026-08-30T00:00:00Z") });

  assert.equal(result.released.length, 4);
  assert.equal(result.subscription.status, "renewal_due");
});

test("renews a completed auto-renew subscription for the next period", () => {
  const readyForRenewal = {
    ...createSubscription(),
    status: "renewal_due"
  };
  const renewal = renewSubscription(readyForRenewal, { now: new Date("2026-08-30T00:00:00Z") });

  assert.equal(renewal.renewalOf, readyForRenewal.id);
  assert.equal(renewal.renewalCount, 1);
  assert.equal(renewal.startAt, readyForRenewal.endAt);
  assert.equal(renewal.tranches[0].dueAt, "2026-09-05T00:00:00.000Z");
});

test("refunds unreleased tranches when a subscription is cancelled", () => {
  let subscription = createSubscription();
  subscription = recordTrancheWork(subscription, 1, { completed: true });
  subscription = approveTranche(subscription, 1, { approved: true });
  subscription = releaseDueTranches(subscription, { now: new Date("2026-08-09T00:00:00Z") }).subscription;

  const result = refundRemainingTranches(subscription, "client cancelled", {
    now: new Date("2026-08-10T00:00:00Z")
  });

  assert.equal(result.subscription.status, "cancelled");
  assert.equal(result.refundedAmountXmr, 0.06);
  assert.equal(summarizeSubscription(result.subscription).releasedAmountXmr, 0.02);
});

test("rejects invalid subscription totals", () => {
  assert.throws(
    () => createRobotSubscription({ clientId: "client-1", robotId: "robot-1", totalAmountXmr: 0 }),
    /totalAmountXmr must be a positive number/
  );
});

function createSubscription() {
  return createRobotSubscription(
    {
      id: "sub-1",
      clientId: "client-1",
      robotId: "robot-1",
      totalAmountXmr: 0.08,
      periodDays: 28,
      intervalDays: 7,
      trancheCount: 4,
      workOrder: { task: "weekly garden service" }
    },
    { now: start }
  );
}
