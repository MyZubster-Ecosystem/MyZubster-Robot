"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { EscrowStore, ZERO_ADDRESS } = require("../src/escrowStore");
const { reviewWorkEvidence } = require("../src/aiArbiter");
const { createServer } = require("../src/server");
const { EvmChainReader } = require("../src/evmChainReader");

const ADDRESSES = {
  clientAddress: "0x1111111111111111111111111111111111111111",
  robotAddress: "0x2222222222222222222222222222222222222222",
  arbiterAddress: "0x3333333333333333333333333333333333333333",
  contractAddress: "0x4444444444444444444444444444444444444444",
  tokenAddress: ZERO_ADDRESS
};
const WORK_HASH = `0x${"ab".repeat(32)}`;

function input(overrides = {}) {
  return {
    clientId: "client-1",
    robotId: "robot-1",
    arbiterId: "arbiter-1",
    amount: "60000000000000000",
    currency: "EVM_NATIVE",
    chain: "base-sepolia",
    chainEscrowId: "1",
    workHash: WORK_HASH,
    ...ADDRESSES,
    ...overrides
  };
}

function snapshot(overrides = {}) {
  return {
    status: "funded",
    amount: "60000000000000000",
    workHash: WORK_HASH,
    releaseApprovals: 0,
    refundApprovals: 0,
    ...ADDRESSES,
    ...overrides
  };
}

function createHarness(initialSnapshot = snapshot()) {
  const chain = { value: initialSnapshot };
  const store = new EscrowStore({
    chainReader: { getEscrow: async () => ({ ...chain.value }) }
  });
  return { chain, store };
}

test("all 2-of-3 approval combinations request release without claiming settlement", async () => {
  for (const pair of [
    ["client-1", "robot-1"],
    ["client-1", "arbiter-1"],
    ["robot-1", "arbiter-1"]
  ]) {
    const { store } = createHarness();
    const escrow = store.createEscrow(input());
    await store.reconcile(escrow.id);
    store.approveRelease(escrow.id, pair[0]);
    const pending = store.approveRelease(escrow.id, pair[1]);
    assert.equal(pending.status, "funded");
    assert.equal(pending.pendingSettlement, "release");
    assert.equal(pending.settledAt, null);
  }
});

test("duplicate and unauthorized approvals are rejected", async () => {
  const { store } = createHarness();
  const escrow = store.createEscrow(input());
  await store.reconcile(escrow.id);
  store.approveRelease(escrow.id, "client-1");
  assert.throws(() => store.approveRelease(escrow.id, "client-1"), /already approved/);
  assert.throws(() => store.approveRelease(escrow.id, "outsider"), /not an escrow participant/);
});

test("disputed escrow requests refund but only chain reconciliation settles it", async () => {
  const { chain, store } = createHarness();
  const escrow = store.createEscrow(input());
  await store.reconcile(escrow.id);
  store.raiseDispute(escrow.id, "client-1", "work incomplete");
  store.approveRefund(escrow.id, "client-1");
  const pending = store.approveRefund(escrow.id, "arbiter-1");
  assert.equal(pending.status, "funded");
  assert.equal(pending.pendingSettlement, "refund");

  chain.value = snapshot({
    status: "refunded",
    refundApprovals: 5,
    transactionHash: `0x${"12".repeat(32)}`,
    blockNumber: 42
  });
  const settled = await store.reconcile(escrow.id);
  assert.equal(settled.status, "refunded");
  assert.equal(settled.pendingSettlement, null);
  assert.equal(settled.chainSnapshot.blockNumber, 42);
});

test("gateway rejects divergent on-chain identity and leaves local state unchanged", async () => {
  const { chain, store } = createHarness();
  const escrow = store.createEscrow(input());
  chain.value = snapshot({ robotAddress: "0x9999999999999999999999999999999999999999" });
  await assert.rejects(store.reconcile(escrow.id), /divergence: robotAddress mismatch/);
  assert.equal(store.getEscrow(escrow.id).status, "awaiting_chain_confirmation");
});

test("AI never approves alone, at low confidence, or during a dispute", async () => {
  const { store } = createHarness();
  const escrow = store.createEscrow(input());
  await store.reconcile(escrow.id);
  const high = reviewWorkEvidence({
    telemetry: { completed: true, workUnits: 100 },
    evidence: { photoCount: 1 }
  });
  assert.equal(high.decision, "approve_release");
  assert.equal(store.recordAiReview(escrow.id, high).releaseApprovals.arbiter, undefined);

  store.approveRelease(escrow.id, "robot-1");
  const low = reviewWorkEvidence({ telemetry: { completed: true } });
  assert.equal(low.decision, "needs_human_review");
  assert.equal(store.recordAiReview(escrow.id, low).releaseApprovals.arbiter, undefined);

  store.raiseDispute(escrow.id, "client-1", "incomplete work");
  const disputed = store.recordAiReview(escrow.id, high);
  assert.equal(disputed.releaseApprovals.arbiter, undefined);
  assert.equal(disputed.pendingSettlement, null);
});

test("XMR is rejected by the EVM adapter", () => {
  const { store } = createHarness();
  assert.throws(() => store.createEscrow(input({ currency: "XMR" })), /Monero multisig flow/);
});

test("HTTP API reconciles canonical chain state and records participant proposals", async () => {
  const { store } = createHarness();
  const server = createServer({ store });
  server.listen(0);
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const created = await postJson(`${baseUrl}/api/escrow/create`, input(), 201);
    assert.equal(created.escrow.status, "awaiting_chain_confirmation");
    const reconciled = await postJson(
      `${baseUrl}/api/escrow/${created.escrow.id}/reconcile`,
      {},
      200
    );
    assert.equal(reconciled.escrow.status, "funded");
    const approved = await postJson(
      `${baseUrl}/api/escrow/${created.escrow.id}/confirm-release`,
      { actorId: "client-1", evidence: { accepted: true } },
      200
    );
    assert.ok(approved.escrow.releaseApprovals.client);
    assert.equal(approved.escrow.status, "funded");
  } finally {
    server.close();
  }
});

test("EVM reader returns settlement transaction evidence", async () => {
  const fakeRecord = {
    client: ADDRESSES.clientAddress,
    robot: ADDRESSES.robotAddress,
    arbiter: ADDRESSES.arbiterAddress,
    token: ADDRESSES.tokenAddress,
    amount: 60000000000000000n,
    workHash: WORK_HASH,
    releaseApprovals: 3n,
    refundApprovals: 0n,
    status: 3n
  };
  const fakeContract = {
    getEscrow: async () => fakeRecord,
    filters: { FundsReleased: (id) => ({ id }), FundsRefunded: (id) => ({ id }) },
    queryFilter: async () => [{
      blockNumber: 41,
      transactionHash: `0x${"34".repeat(32)}`
    }]
  };
  const reader = new EvmChainReader({
    provider: {
      getBlockNumber: async () => 50,
      getBlock: async () => ({ timestamp: 1700000000 })
    },
    contractFactory: () => fakeContract,
    fromBlock: 10
  });
  const result = await reader.getEscrow({
    contractAddress: ADDRESSES.contractAddress,
    escrowId: "1"
  });
  assert.equal(result.status, "released");
  assert.equal(result.blockNumber, 41);
  assert.equal(result.transactionHash, `0x${"34".repeat(32)}`);
  assert.equal(result.blockTimestamp, "2023-11-14T22:13:20.000Z");
});

async function postJson(url, body, expectedStatus) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  assert.equal(response.status, expectedStatus, text);
  return JSON.parse(text);
}
