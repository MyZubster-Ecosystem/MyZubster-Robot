"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { EscrowStore } = require("../src/escrowStore");
const { reviewWorkEvidence } = require("../src/aiArbiter");
const { createServer } = require("../src/server");

test("escrow releases funds after any two participant approvals", () => {
  const store = new EscrowStore();
  const escrow = store.createEscrow({
    clientId: "client-1",
    robotId: "robot-1",
    amount: 0.06
  });

  assert.equal(escrow.status, "funded");

  const firstApproval = store.approveRelease(escrow.id, "robot", { tx: "work-complete" });
  assert.equal(firstApproval.status, "funded");

  const secondApproval = store.approveRelease(escrow.id, "client", { accepted: true });
  assert.equal(secondApproval.status, "released");
  assert.ok(secondApproval.settledAt);
});

test("disputed escrow refunds after two refund approvals", () => {
  const store = new EscrowStore();
  const escrow = store.createEscrow({
    clientId: "client-1",
    robotId: "robot-1",
    amount: 0.06
  });

  const disputed = store.raiseDispute(escrow.id, "client", "work incomplete");
  assert.equal(disputed.status, "disputed");

  store.approveRefund(escrow.id, "client", { reason: "incomplete" });
  const refunded = store.approveRefund(escrow.id, "arbiter", { aiDecision: "refund" });

  assert.equal(refunded.status, "refunded");
});

test("AI arbiter can add the second release approval", () => {
  const store = new EscrowStore();
  const escrow = store.createEscrow({
    clientId: "client-1",
    robotId: "robot-1",
    amount: 0.06
  });

  store.approveRelease(escrow.id, "robot", { workUnits: 24 });
  const review = reviewWorkEvidence({
    telemetry: { completed: true, workUnits: 24 },
    evidence: { photoCount: 2 }
  });
  const settled = store.recordAiReview(escrow.id, review);

  assert.equal(review.decision, "approve_release");
  assert.equal(settled.status, "released");
  assert.ok(settled.releaseApprovals.arbiter);
});

test("HTTP API creates and settles an escrow", async () => {
  const server = createServer();
  server.listen(0);
  await once(server, "listening");
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const created = await postJson(`${baseUrl}/api/escrow/create`, {
      clientId: "client-1",
      robotId: "robot-1",
      amount: 0.06,
      workOrder: { task: "mow lawn" }
    });

    assert.equal(created.escrow.status, "funded");

    const confirmed = await postJson(`${baseUrl}/api/escrow/${created.escrow.id}/confirm-release`, {
      role: "client",
      evidence: { accepted: true }
    });

    assert.equal(confirmed.escrow.status, "funded");

    const arbitrated = await postJson(`${baseUrl}/api/escrow/${created.escrow.id}/ai-arbitrate`, {
      telemetry: { completed: true, workUnits: 12 },
      evidence: { photoCount: 1 }
    });

    assert.equal(arbitrated.review.decision, "approve_release");
    assert.equal(arbitrated.escrow.status, "released");
  } finally {
    server.close();
  }
});

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  assert.ok(response.ok, `${response.status} ${text}`);
  return JSON.parse(text);
}
