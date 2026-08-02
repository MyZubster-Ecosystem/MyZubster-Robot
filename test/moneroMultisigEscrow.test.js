"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createMoneroMultisigEscrow,
  setupMoneroMultisig,
  syncMultisigInfo,
  recordFunding,
  createSpendTransaction,
  signSpendTransaction,
  submitSpendTransaction,
  buildTestnetWalletRpcPlan,
  createMoneroWalletRpcClient,
  xmrToAtomicUnits,
  atomicUnitsToXmr,
} = require("../src/moneroMultisigEscrow");

const TEST_MULTISIG_ADDRESS = "9xTestMoneroMultisigAddress111111111111111111111111111111111111111111111111111111";

function createFakeWallet(role) {
  const calls = [];
  return {
    role,
    calls,
    async call(method, params = {}) {
      calls.push({ method, params });
      if (method === "prepare_multisig") return { multisig_info: `prepare-${role}` };
      if (method === "make_multisig") return { address: TEST_MULTISIG_ADDRESS, multisig_info: `round-${role}` };
      if (method === "finalize_multisig") return { address: TEST_MULTISIG_ADDRESS };
      if (method === "is_multisig") return { multisig: true, ready: true, threshold: 2, total: 3 };
      if (method === "export_multisig_info") return { info: `export-${role}` };
      if (method === "import_multisig_info") return { n_outputs: params.info.length };
      if (method === "transfer") {
        return {
          multisig_txset: `txset-${role}-${params.destinations[0].address}`,
          tx_hash: `draft-hash-${role}`,
          fee: 120000000,
        };
      }
      if (method === "sign_multisig") {
        return {
          tx_data_hex: `${params.tx_data_hex}|signed:${role}`,
          tx_hash_list: [`hash-after-${role}`],
        };
      }
      if (method === "submit_multisig") return { tx_hash_list: [`submitted-${role}`] };
      throw new Error(`unexpected method ${method}`);
    },
  };
}

function createEscrowFixture() {
  const client = createFakeWallet("client");
  const robot = createFakeWallet("robot");
  const arbiter = createFakeWallet("arbiter");
  return {
    wallets: { client, robot, arbiter },
    escrow: createMoneroMultisigEscrow({
      escrowId: "escrow-93",
      network: "testnet",
      amountXmr: "0.10",
      releaseAddress: "9releaseAddress111111111111111111111111111111111111111111111111111111111",
      refundAddress: "9refundAddress1111111111111111111111111111111111111111111111111111111111",
      confirmationsRequired: 2,
      client: { id: "client-1", rpc: client },
      robot: { id: "robot-1", rpc: robot },
      arbiter: { id: "ai-arbiter", rpc: arbiter },
    }),
  };
}

test("sets up a real 2-of-3 multisig wallet flow through wallet-rpc methods", async () => {
  const { escrow, wallets } = createEscrowFixture();

  const ready = await setupMoneroMultisig(escrow, {
    walletPasswords: { client: "client-pass", robot: "robot-pass", arbiter: "arbiter-pass" },
  });

  assert.equal(ready.status, "multisig_ready");
  assert.equal(ready.threshold, 2);
  assert.equal(ready.totalSigners, 3);
  assert.equal(ready.multisigAddress, TEST_MULTISIG_ADDRESS);
  assert.deepEqual(wallets.client.calls.map((call) => call.method), [
    "prepare_multisig",
    "make_multisig",
    "finalize_multisig",
    "is_multisig",
  ]);
  assert.equal(wallets.client.calls[1].params.threshold, 2);
  assert.deepEqual(wallets.client.calls[1].params.multisig_info.sort(), ["prepare-arbiter", "prepare-robot"]);
});

test("exports and imports peer multisig info before spending", async () => {
  const { escrow, wallets } = createEscrowFixture();
  const ready = await setupMoneroMultisig(escrow);

  const synced = await syncMultisigInfo(ready);

  assert.equal(synced.participants.client.lastImportCount, 2);
  assert.deepEqual(wallets.client.calls.at(-1), {
    method: "import_multisig_info",
    params: { info: ["export-robot", "export-arbiter"] },
  });
});

test("creates, signs, and submits a release transaction with two signers", async () => {
  const { escrow, wallets } = createEscrowFixture();
  const ready = await setupMoneroMultisig(escrow);
  const funded = recordFunding(ready, {
    txHash: "funding-tx",
    amountXmr: "0.10",
    confirmations: 3,
    observedAtHeight: 123456,
  });

  const spend = await createSpendTransaction(funded, { spendType: "release", signerRole: "client" });
  const signed = await signSpendTransaction(spend, ["client", "robot"]);
  const submitted = await submitSpendTransaction(signed, "robot");

  assert.equal(spend.status, "release_tx_created");
  assert.equal(signed.status, "release_signed");
  assert.equal(submitted.status, "released");
  assert.deepEqual(submitted.pendingSpend.signatures, ["client", "robot"]);
  assert.deepEqual(submitted.pendingSpend.txHashList, ["submitted-robot"]);
  assert.equal(wallets.client.calls.find((call) => call.method === "transfer").params.do_not_relay, true);
});

test("supports arbiter-assisted refund path", async () => {
  const { escrow } = createEscrowFixture();
  const ready = await setupMoneroMultisig(escrow);
  const funded = recordFunding(ready, {
    txHash: "funding-tx",
    amountAtomic: xmrToAtomicUnits("0.10"),
    confirmations: 2,
  });

  const refund = await createSpendTransaction(funded, { spendType: "refund", signerRole: "arbiter" });
  const signed = await signSpendTransaction(refund, ["arbiter", "client"]);
  const submitted = await submitSpendTransaction(signed, "arbiter");

  assert.equal(submitted.status, "refunded");
  assert.equal(submitted.pendingSpend.destination, escrow.refundAddress);
});

test("blocks unsafe state transitions", async () => {
  const { escrow } = createEscrowFixture();
  const ready = await setupMoneroMultisig(escrow);

  assert.throws(() => recordFunding(ready, { txHash: "low", amountXmr: "0.01", confirmations: 2 }), /below escrow amount/);
  assert.throws(() => recordFunding(ready, { txHash: "young", amountXmr: "0.10", confirmations: 1 }), /requires 2 confirmations/);

  const funded = recordFunding(ready, { txHash: "funded", amountXmr: "0.10", confirmations: 2 });
  const spend = await createSpendTransaction(funded, { spendType: "release" });
  await assert.rejects(() => signSpendTransaction(spend, ["client"]), /at least 2 unique signers/);
});

test("builds a testnet wallet-rpc plan and exact XMR atomic conversions", () => {
  const plan = buildTestnetWalletRpcPlan({ walletPrefix: "robot-escrow", basePort: 39083 });

  assert.equal(plan.length, 3);
  assert.equal(plan[0].walletRpcEndpoint, "http://127.0.0.1:39083/json_rpc");
  assert.ok(plan[0].requiredMethods.includes("submit_multisig"));
  assert.equal(xmrToAtomicUnits("0.000000000001"), 1n);
  assert.equal(atomicUnitsToXmr(100000000000n), "0.1");
});

test("wallet rpc client sends JSON-RPC requests and surfaces wallet errors", async () => {
  const seen = [];
  const client = createMoneroWalletRpcClient({
    endpoint: "http://127.0.0.1:38083",
    fetchImpl: async (url, request) => {
      seen.push({ url, request: JSON.parse(request.body), headers: request.headers });
      return {
        ok: true,
        json: async () => ({ result: { multisig: true, ready: true } }),
      };
    },
  });

  const result = await client.call("is_multisig");
  assert.deepEqual(result, { multisig: true, ready: true });
  assert.equal(seen[0].url, "http://127.0.0.1:38083/json_rpc");
  assert.equal(seen[0].request.method, "is_multisig");

  const failing = createMoneroWalletRpcClient({
    endpoint: "http://127.0.0.1:38083/json_rpc",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ error: { message: "wallet locked" } }),
    }),
  });

  await assert.rejects(() => failing.call("prepare_multisig"), /wallet locked/);
});
