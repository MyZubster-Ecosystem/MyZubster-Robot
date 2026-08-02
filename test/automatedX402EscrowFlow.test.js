"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  WORKFLOW_STATES,
  buildEndpointDefinitions,
  calculateFeeSplit,
  createPaymentRequest,
  handleTimeout,
  lockEscrow,
  raiseDispute,
  resolveDispute,
  signWorkflow,
  startRobotWork,
  submitWorkEvidence
} = require("../src/automatedX402EscrowFlow");
const {
  createAutomatedX402EscrowHandler,
  createInMemoryEscrowStore
} = require("../src/automatedX402EscrowRoutes");

function createRequest() {
  return createPaymentRequest({
    clientId: "client-1",
    robotId: "robot-1",
    aiArbiterId: "ai-1",
    amountXmr: 1,
    description: "mow garden",
    createdAt: "2026-08-02T00:00:00Z"
  }, {
    requestTtlSeconds: 600
  });
}

test("creates an x402 Payment Required payload", () => {
  const request = createRequest();

  assert.equal(request.state, WORKFLOW_STATES.PAYMENT_REQUIRED);
  assert.equal(request.x402.statusCode, 402);
  assert.equal(request.x402.maxAmountRequired, "1 XMR");
  assert.equal(request.clientId, "client-1");
  assert.equal(request.robotId, "robot-1");
  assert.equal(request.events[0].type, "payment_required");
});

test("locks escrow and calculates the required 2% + 8% + 5% fee split", () => {
  const locked = lockEscrow(createRequest(), {
    txId: "tx-lock-1",
    lockedAt: "2026-08-02T00:01:00Z"
  });

  assert.equal(locked.state, WORKFLOW_STATES.ESCROW_LOCKED);
  assert.equal(locked.payment.txId, "tx-lock-1");
  assert.deepEqual(calculateFeeSplit(1), {
    feeRates: { platform: 0.02, network: 0.08, referrer: 0.05 },
    platformFeeXmr: 0.02,
    networkFeeXmr: 0.08,
    referrerFeeXmr: 0.05,
    totalFeesXmr: 0.15,
    robotReceivesXmr: 0.85
  });
});

test("runs the complete automated x402 escrow release flow", () => {
  const locked = lockEscrow(createRequest(), {
    txId: "tx-lock-1",
    lockedAt: "2026-08-02T00:01:00Z"
  });
  const started = startRobotWork(locked, {
    robotId: "robot-1",
    startedAt: "2026-08-02T00:02:00Z"
  });
  const submitted = submitWorkEvidence(started, {
    robotId: "robot-1",
    type: "photo",
    hash: "sha256:work-proof",
    submittedAt: "2026-08-02T00:10:00Z"
  });
  const clientSigned = signWorkflow(submitted, {
    role: "client",
    signerId: "client-1",
    signedAt: "2026-08-02T00:12:00Z"
  });
  const released = signWorkflow(clientSigned, {
    role: "robot",
    signerId: "robot-1",
    signedAt: "2026-08-02T00:13:00Z"
  });

  assert.equal(started.state, WORKFLOW_STATES.WORK_STARTED);
  assert.equal(submitted.state, WORKFLOW_STATES.WORK_SUBMITTED);
  assert.equal(clientSigned.state, WORKFLOW_STATES.CLIENT_SIGNED);
  assert.equal(released.state, WORKFLOW_STATES.RELEASED);
  assert.equal(released.settlement.robotReceivesXmr, 0.85);
  assert.equal(released.events.at(-1).type, "escrow_released");
});

test("handles timeout refund before robot work starts", () => {
  const locked = lockEscrow(createRequest(), {
    txId: "tx-lock-1",
    lockedAt: "2026-08-02T00:01:00Z",
    workTtlSeconds: 60
  });
  const timedOut = handleTimeout(locked, {
    now: "2026-08-02T00:03:00Z"
  });

  assert.equal(timedOut.state, WORKFLOW_STATES.REFUNDED);
  assert.equal(timedOut.settlement.clientReceivesXmr, 1);
  assert.equal(timedOut.settlement.reason, "work_timeout");
});

test("raises and resolves a dispute through the AI arbiter", () => {
  const locked = lockEscrow(createRequest(), {
    txId: "tx-lock-1",
    lockedAt: "2026-08-02T00:01:00Z"
  });
  const started = startRobotWork(locked, {
    robotId: "robot-1",
    startedAt: "2026-08-02T00:02:00Z"
  });
  const disputed = raiseDispute(started, {
    actorId: "client-1",
    reason: "work_quality"
  });
  const refunded = resolveDispute(disputed, {
    aiArbiterId: "ai-1",
    decision: "client"
  });

  assert.equal(disputed.state, WORKFLOW_STATES.DISPUTED);
  assert.equal(refunded.state, WORKFLOW_STATES.REFUNDED);
  assert.equal(refunded.settlement.reason, "ai_dispute_refund");
});

test("rejects invalid signer and terminal-state mutation", () => {
  const locked = lockEscrow(createRequest(), {
    txId: "tx-lock-1",
    lockedAt: "2026-08-02T00:01:00Z"
  });
  const submitted = submitWorkEvidence(startRobotWork(locked, {
    robotId: "robot-1"
  }), {
    robotId: "robot-1"
  });

  assert.throws(() => signWorkflow(submitted, {
    role: "client",
    signerId: "robot-1"
  }), /signerId does not match/);

  const released = signWorkflow(signWorkflow(submitted, {
    role: "client",
    signerId: "client-1"
  }), {
    role: "robot",
    signerId: "robot-1"
  });

  assert.throws(() => raiseDispute(released, {
    actorId: "client-1"
  }), /Workflow is terminal/);
});

test("documents unified endpoint definitions and route handling", () => {
  const endpoints = buildEndpointDefinitions();
  const store = createInMemoryEscrowStore();
  const handle = createAutomatedX402EscrowHandler({
    store,
    now: () => "2026-08-02T00:00:00Z"
  });

  const requestResponse = handle({
    method: "POST",
    path: "/api/x402/escrow/request",
    body: {
      clientId: "client-1",
      robotId: "robot-1",
      aiArbiterId: "ai-1",
      amountXmr: 1
    }
  });
  const escrowId = requestResponse.body.escrowId;
  const lockedResponse = handle({
    method: "POST",
    path: `/api/x402/escrow/${escrowId}/lock`,
    body: { txId: "tx-lock-1" }
  });
  const readResponse = handle({
    method: "GET",
    path: `/api/x402/escrow/${escrowId}`
  });

  assert.ok(endpoints.some((endpoint) => endpoint.path.endsWith("/sign")));
  assert.equal(requestResponse.statusCode, 402);
  assert.equal(lockedResponse.body.state, WORKFLOW_STATES.ESCROW_LOCKED);
  assert.equal(readResponse.body.payment.txId, "tx-lock-1");
});
