"use strict";

const crypto = require("node:crypto");

const ATOMIC_UNITS_PER_XMR = 1_000_000_000_000n;
const REQUIRED_ROLES = ["client", "robot", "arbiter"];
const TERMINAL_STATUSES = new Set(["released", "refunded"]);

function xmrToAtomicUnits(value) {
  if (typeof value === "bigint") {
    if (value <= 0n) throw new Error("amount must be positive");
    return value;
  }

  const text = String(value).trim();
  if (!/^\d+(\.\d{1,12})?$/.test(text)) {
    throw new Error("amount must be a positive XMR decimal with at most 12 places");
  }

  const [whole, fraction = ""] = text.split(".");
  const atomic = BigInt(whole) * ATOMIC_UNITS_PER_XMR + BigInt((fraction + "0".repeat(12)).slice(0, 12));
  if (atomic <= 0n) throw new Error("amount must be positive");
  return atomic;
}

function atomicUnitsToXmr(atomicValue) {
  const atomic = BigInt(atomicValue);
  const whole = atomic / ATOMIC_UNITS_PER_XMR;
  const fraction = (atomic % ATOMIC_UNITS_PER_XMR).toString().padStart(12, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

class MoneroWalletRpcClient {
  constructor(options = {}) {
    const { endpoint, fetchImpl = globalThis.fetch, headers = {}, requestIdPrefix = "myzubster" } = options;
    if (!endpoint) throw new Error("wallet rpc endpoint is required");
    if (typeof fetchImpl !== "function") throw new Error("fetch implementation is required");

    this.endpoint = endpoint.endsWith("/json_rpc") ? endpoint : `${endpoint.replace(/\/$/, "")}/json_rpc`;
    this.fetchImpl = fetchImpl;
    this.headers = { ...headers };
    this.requestIdPrefix = requestIdPrefix;
  }

  async call(method, params = {}) {
    if (!method || typeof method !== "string") throw new Error("rpc method is required");

    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `${this.requestIdPrefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        method,
        params,
      }),
    });

    if (!response || typeof response.ok !== "boolean") {
      throw new Error("wallet rpc transport returned an invalid response");
    }
    if (!response.ok) {
      throw new Error(`wallet rpc ${method} failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload.error) {
      const message = payload.error.message || "unknown wallet rpc error";
      throw new Error(`wallet rpc ${method} failed: ${message}`);
    }

    return payload.result || {};
  }
}

function createMoneroWalletRpcClient(options) {
  return new MoneroWalletRpcClient(options);
}

function createEscrowId(seed = {}) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(seed))
    .update(String(Date.now()))
    .digest("hex")
    .slice(0, 24);
}

function normalizeParticipant(role, input) {
  if (!input || typeof input !== "object") throw new Error(`${role} participant is required`);
  if (!input.id) throw new Error(`${role} participant id is required`);
  if (!input.rpc || typeof input.rpc.call !== "function") throw new Error(`${role} wallet rpc client is required`);

  return {
    role,
    id: input.id,
    rpc: input.rpc,
    payoutAddress: input.payoutAddress || null,
    multisigInfo: null,
    makeMultisigInfo: null,
    exportInfo: null,
    lastImportCount: 0,
  };
}

function createMoneroMultisigEscrow(input = {}) {
  const amountAtomic = input.amountAtomic ? BigInt(input.amountAtomic) : xmrToAtomicUnits(input.amountXmr);
  const escrowId = input.escrowId || createEscrowId(input);
  const participants = {};

  for (const role of REQUIRED_ROLES) {
    participants[role] = normalizeParticipant(role, input[role]);
  }

  if (!input.releaseAddress) throw new Error("releaseAddress is required");
  if (!input.refundAddress) throw new Error("refundAddress is required");

  return {
    escrowId,
    network: input.network || "testnet",
    threshold: 2,
    totalSigners: 3,
    amountAtomic: amountAtomic.toString(),
    amountXmr: atomicUnitsToXmr(amountAtomic),
    releaseAddress: input.releaseAddress,
    refundAddress: input.refundAddress,
    confirmationsRequired: Number(input.confirmationsRequired ?? 10),
    status: "created",
    multisigAddress: null,
    participants,
    funding: null,
    pendingSpend: null,
    events: [
      {
        type: "escrow_created",
        at: new Date().toISOString(),
        status: "created",
      },
    ],
  };
}

function cloneEscrow(escrow) {
  return {
    ...escrow,
    participants: Object.fromEntries(Object.entries(escrow.participants).map(([role, participant]) => [role, { ...participant }])),
    funding: escrow.funding ? { ...escrow.funding } : null,
    pendingSpend: escrow.pendingSpend
      ? {
          ...escrow.pendingSpend,
          signatures: [...escrow.pendingSpend.signatures],
          txHashList: [...escrow.pendingSpend.txHashList],
        }
      : null,
    events: [...escrow.events],
  };
}

function appendEvent(escrow, event) {
  escrow.events.push({
    at: new Date().toISOString(),
    ...event,
  });
}

function getPassword(passwords, role) {
  if (typeof passwords === "string") return passwords;
  return passwords?.[role] || "";
}

function ensureActive(escrow) {
  if (TERMINAL_STATUSES.has(escrow.status)) throw new Error(`escrow is already ${escrow.status}`);
}

function ensureFunded(escrow) {
  if (escrow.status !== "funded") throw new Error("escrow must be funded before creating a spend transaction");
}

function peerValues(participants, role, field) {
  return REQUIRED_ROLES.filter((peerRole) => peerRole !== role)
    .map((peerRole) => participants[peerRole][field])
    .filter(Boolean);
}

async function setupMoneroMultisig(escrow, options = {}) {
  ensureActive(escrow);
  const next = cloneEscrow(escrow);
  const { walletPasswords = {} } = options;

  for (const role of REQUIRED_ROLES) {
    const result = await next.participants[role].rpc.call("prepare_multisig");
    if (!result.multisig_info) throw new Error(`${role} wallet did not return multisig_info`);
    next.participants[role].multisigInfo = result.multisig_info;
  }

  for (const role of REQUIRED_ROLES) {
    const result = await next.participants[role].rpc.call("make_multisig", {
      multisig_info: peerValues(next.participants, role, "multisigInfo"),
      threshold: next.threshold,
      password: getPassword(walletPasswords, role),
    });
    if (!result.address) throw new Error(`${role} wallet did not return a multisig address`);
    next.participants[role].makeMultisigInfo = result.multisig_info || "";
    next.multisigAddress = next.multisigAddress || result.address;
    if (next.multisigAddress !== result.address) {
      throw new Error("wallets returned different multisig addresses");
    }
  }

  const needsFinalize = REQUIRED_ROLES.some((role) => Boolean(next.participants[role].makeMultisigInfo));
  if (needsFinalize) {
    for (const role of REQUIRED_ROLES) {
      const result = await next.participants[role].rpc.call("finalize_multisig", {
        multisig_info: peerValues(next.participants, role, "makeMultisigInfo"),
        password: getPassword(walletPasswords, role),
      });
      if (result.address && result.address !== next.multisigAddress) {
        throw new Error("finalize_multisig returned a different multisig address");
      }
    }
  }

  for (const role of REQUIRED_ROLES) {
    const result = await next.participants[role].rpc.call("is_multisig");
    if (!result.multisig || !result.ready || Number(result.threshold) !== next.threshold || Number(result.total) !== next.totalSigners) {
      throw new Error(`${role} wallet is not ready as ${next.threshold}-of-${next.totalSigners} multisig`);
    }
  }

  next.status = "multisig_ready";
  appendEvent(next, { type: "monero_multisig_ready", status: next.status, multisigAddress: next.multisigAddress });
  return next;
}

async function syncMultisigInfo(escrow) {
  ensureActive(escrow);
  const next = cloneEscrow(escrow);

  for (const role of REQUIRED_ROLES) {
    const result = await next.participants[role].rpc.call("export_multisig_info");
    if (!result.info) throw new Error(`${role} wallet did not export multisig info`);
    next.participants[role].exportInfo = result.info;
  }

  for (const role of REQUIRED_ROLES) {
    const result = await next.participants[role].rpc.call("import_multisig_info", {
      info: peerValues(next.participants, role, "exportInfo"),
    });
    next.participants[role].lastImportCount = Number(result.n_outputs || 0);
  }

  appendEvent(next, { type: "monero_multisig_synced", status: next.status });
  return next;
}

function recordFunding(escrow, funding = {}) {
  ensureActive(escrow);
  if (escrow.status !== "multisig_ready" && escrow.status !== "funded") {
    throw new Error("multisig wallet must be ready before funding can be recorded");
  }
  if (!funding.txHash) throw new Error("funding txHash is required");

  const amountAtomic = funding.amountAtomic ? BigInt(funding.amountAtomic) : xmrToAtomicUnits(funding.amountXmr);
  if (amountAtomic < BigInt(escrow.amountAtomic)) throw new Error("funding amount is below escrow amount");

  const confirmations = Number(funding.confirmations || 0);
  if (confirmations < escrow.confirmationsRequired) {
    throw new Error(`funding requires ${escrow.confirmationsRequired} confirmations`);
  }

  const next = cloneEscrow(escrow);
  next.status = "funded";
  next.funding = {
    txHash: funding.txHash,
    amountAtomic: amountAtomic.toString(),
    amountXmr: atomicUnitsToXmr(amountAtomic),
    confirmations,
    observedAtHeight: funding.observedAtHeight || null,
  };
  appendEvent(next, { type: "escrow_funded", status: next.status, txHash: funding.txHash });
  return next;
}

function spendDestinationFor(escrow, spendType, overrideAddress) {
  if (overrideAddress) return overrideAddress;
  if (spendType === "release") return escrow.releaseAddress;
  if (spendType === "refund") return escrow.refundAddress;
  throw new Error("spendType must be release or refund");
}

async function createSpendTransaction(escrow, input = {}) {
  ensureActive(escrow);
  ensureFunded(escrow);

  const signerRole = input.signerRole || "client";
  if (!REQUIRED_ROLES.includes(signerRole)) throw new Error("signerRole must be client, robot, or arbiter");

  const spendType = input.spendType || "release";
  const destination = spendDestinationFor(escrow, spendType, input.address);
  const amountAtomic = input.amountAtomic ? BigInt(input.amountAtomic) : BigInt(escrow.amountAtomic);

  const result = await escrow.participants[signerRole].rpc.call("transfer", {
    destinations: [{ address: destination, amount: Number(amountAtomic) }],
    account_index: input.accountIndex || 0,
    subaddr_indices: input.subaddrIndices || [0],
    priority: input.priority ?? 0,
    do_not_relay: true,
    get_tx_metadata: true,
  });

  if (!result.multisig_txset) throw new Error("wallet did not return multisig_txset for multisig signing");

  const next = cloneEscrow(escrow);
  next.status = spendType === "release" ? "release_tx_created" : "refund_tx_created";
  next.pendingSpend = {
    spendType,
    destination,
    amountAtomic: amountAtomic.toString(),
    amountXmr: atomicUnitsToXmr(amountAtomic),
    createdBy: signerRole,
    txDataHex: result.multisig_txset,
    feeAtomic: result.fee ? String(result.fee) : null,
    signatures: [],
    txHashList: result.tx_hash ? [result.tx_hash] : [],
  };
  appendEvent(next, { type: `${spendType}_tx_created`, status: next.status, signerRole, destination });
  return next;
}

async function signSpendTransaction(escrow, signerRoles = []) {
  ensureActive(escrow);
  if (!escrow.pendingSpend) throw new Error("no pending spend transaction exists");

  const uniqueSigners = [...new Set(signerRoles)];
  if (uniqueSigners.length < escrow.threshold) throw new Error(`at least ${escrow.threshold} unique signers are required`);

  const next = cloneEscrow(escrow);
  let txDataHex = next.pendingSpend.txDataHex;
  const txHashes = new Set(next.pendingSpend.txHashList);

  for (const role of uniqueSigners) {
    if (!REQUIRED_ROLES.includes(role)) throw new Error(`unknown signer role: ${role}`);
    const result = await next.participants[role].rpc.call("sign_multisig", { tx_data_hex: txDataHex });
    if (!result.tx_data_hex) throw new Error(`${role} signer did not return tx_data_hex`);
    txDataHex = result.tx_data_hex;
    for (const hash of result.tx_hash_list || []) txHashes.add(hash);
    next.pendingSpend.signatures.push(role);
  }

  next.pendingSpend.txDataHex = txDataHex;
  next.pendingSpend.txHashList = [...txHashes];
  next.status = next.pendingSpend.spendType === "release" ? "release_signed" : "refund_signed";
  appendEvent(next, {
    type: `${next.pendingSpend.spendType}_tx_signed`,
    status: next.status,
    signerRoles: next.pendingSpend.signatures,
  });
  return next;
}

async function submitSpendTransaction(escrow, submitterRole = "client") {
  ensureActive(escrow);
  if (!escrow.pendingSpend) throw new Error("no pending spend transaction exists");
  if (!["release_signed", "refund_signed"].includes(escrow.status)) {
    throw new Error("spend transaction must be signed before submit");
  }
  if (!REQUIRED_ROLES.includes(submitterRole)) throw new Error("submitterRole must be client, robot, or arbiter");

  const result = await escrow.participants[submitterRole].rpc.call("submit_multisig", {
    tx_data_hex: escrow.pendingSpend.txDataHex,
  });
  if (!Array.isArray(result.tx_hash_list) || result.tx_hash_list.length === 0) {
    throw new Error("submit_multisig did not return tx_hash_list");
  }

  const next = cloneEscrow(escrow);
  next.pendingSpend.txHashList = result.tx_hash_list;
  next.status = next.pendingSpend.spendType === "release" ? "released" : "refunded";
  appendEvent(next, {
    type: `${next.pendingSpend.spendType}_tx_submitted`,
    status: next.status,
    submitterRole,
    txHashList: result.tx_hash_list,
  });
  return next;
}

function buildTestnetWalletRpcPlan(options = {}) {
  const basePort = Number(options.basePort || 38083);
  const host = options.host || "127.0.0.1";
  const daemonAddress = options.daemonAddress || "http://127.0.0.1:38081";

  return REQUIRED_ROLES.map((role, index) => ({
    role,
    walletRpcEndpoint: `http://${host}:${basePort + index}/json_rpc`,
    walletFile: options.walletPrefix ? `${options.walletPrefix}-${role}` : `myzubster-${role}-multisig`,
    daemonAddress,
    network: "testnet",
    requiredMethods: [
      "prepare_multisig",
      "make_multisig",
      "finalize_multisig",
      "export_multisig_info",
      "import_multisig_info",
      "transfer",
      "sign_multisig",
      "submit_multisig",
    ],
  }));
}

module.exports = {
  ATOMIC_UNITS_PER_XMR,
  REQUIRED_ROLES,
  MoneroWalletRpcClient,
  createMoneroWalletRpcClient,
  createMoneroMultisigEscrow,
  setupMoneroMultisig,
  syncMultisigInfo,
  recordFunding,
  createSpendTransaction,
  signSpendTransaction,
  submitSpendTransaction,
  buildTestnetWalletRpcPlan,
  xmrToAtomicUnits,
  atomicUnitsToXmr,
};
