"use strict";

const VALID_ROLES = new Set(["client", "robot", "arbiter"]);
const OPEN_CHAIN_STATUSES = new Set(["funded", "disputed"]);
const FINAL_CHAIN_STATUSES = new Set(["released", "refunded"]);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

class EscrowStore {
  constructor({ now = () => new Date(), chainReader = null } = {}) {
    this.now = now;
    this.chainReader = chainReader;
    this.counter = 1;
    this.escrows = new Map();
  }

  createEscrow(input) {
    const clientId = requireString(input.clientId, "clientId");
    const robotId = requireString(input.robotId, "robotId");
    const arbiterId = requireString(input.arbiterId || "ai-arbiter", "arbiterId");
    const amount = requirePositiveIntegerString(input.amount, "amount");
    const currency = requireString(input.currency || "EVM_NATIVE", "currency");

    if (currency.toUpperCase() === "XMR") {
      throw createError(400, "XMR uses the separate Monero multisig flow, not RobotEscrow.sol");
    }
    if (new Set([clientId, robotId, arbiterId]).size !== 3) {
      throw createError(400, "clientId, robotId, and arbiterId must be distinct");
    }

    const createdAt = this.now();
    const id = `escrow_${createdAt.getTime()}_${this.counter++}`;
    const escrow = {
      id,
      clientId,
      robotId,
      arbiterId,
      clientAddress: requireAddress(input.clientAddress, "clientAddress"),
      robotAddress: requireAddress(input.robotAddress, "robotAddress"),
      arbiterAddress: requireAddress(input.arbiterAddress, "arbiterAddress"),
      tokenAddress: requireAddress(input.tokenAddress || ZERO_ADDRESS, "tokenAddress"),
      amount,
      currency,
      chain: requireString(input.chain || "base-sepolia", "chain"),
      contractAddress: requireAddress(input.contractAddress, "contractAddress"),
      chainEscrowId: requirePositiveIntegerString(input.chainEscrowId, "chainEscrowId"),
      workHash: requireBytes32(input.workHash, "workHash"),
      workOrder: input.workOrder || null,
      status: "awaiting_chain_confirmation",
      pendingSettlement: null,
      releaseApprovals: {},
      refundApprovals: {},
      dispute: null,
      aiReview: null,
      chainSnapshot: null,
      createdAt: createdAt.toISOString(),
      settledAt: null
    };

    this.escrows.set(id, escrow);
    return clone(escrow);
  }

  getEscrow(id) {
    return clone(this.requireEscrow(id));
  }

  listByRobot(robotId) {
    return [...this.escrows.values()]
      .filter((escrow) => escrow.robotId === robotId)
      .map(clone);
  }

  approveRelease(id, actorId, evidence = {}) {
    const escrow = this.requireActionableEscrow(id);
    const role = participantRole(escrow, actorId);
    if (escrow.releaseApprovals[role]) {
      throw createError(409, `${role} already approved release`);
    }
    escrow.releaseApprovals[role] = { actorId, at: this.now().toISOString(), evidence };
    if (approvalCount(escrow.releaseApprovals) >= 2) escrow.pendingSettlement = "release";
    return clone(escrow);
  }

  approveRefund(id, actorId, evidence = {}) {
    const escrow = this.requireActionableEscrow(id);
    const role = participantRole(escrow, actorId);
    if (escrow.refundApprovals[role]) {
      throw createError(409, `${role} already approved refund`);
    }
    escrow.refundApprovals[role] = { actorId, at: this.now().toISOString(), evidence };
    if (approvalCount(escrow.refundApprovals) >= 2) escrow.pendingSettlement = "refund";
    return clone(escrow);
  }

  raiseDispute(id, actorId, reason) {
    const escrow = this.requireActionableEscrow(id);
    const role = participantRole(escrow, actorId);
    escrow.dispute = {
      role,
      actorId,
      reason: requireString(reason, "reason"),
      at: this.now().toISOString()
    };
    return clone(escrow);
  }

  recordAiReview(id, review) {
    const escrow = this.requireActionableEscrow(id);
    escrow.aiReview = { ...review, at: this.now().toISOString() };
    const participantApproved = Boolean(
      escrow.releaseApprovals.client || escrow.releaseApprovals.robot
    );
    const canApprove =
      review.decision === "approve_release" &&
      review.confidence >= 0.85 &&
      !escrow.dispute &&
      participantApproved &&
      !escrow.releaseApprovals.arbiter;

    if (canApprove) {
      escrow.releaseApprovals.arbiter = {
        actorId: escrow.arbiterId,
        at: this.now().toISOString(),
        evidence: { aiReview: review }
      };
      if (approvalCount(escrow.releaseApprovals) >= 2) escrow.pendingSettlement = "release";
    }
    return clone(escrow);
  }

  async reconcile(id) {
    const escrow = this.requireEscrow(id);
    if (!this.chainReader || typeof this.chainReader.getEscrow !== "function") {
      throw createError(503, "chain reader is not configured");
    }
    const snapshot = await this.chainReader.getEscrow({
      chain: escrow.chain,
      contractAddress: escrow.contractAddress,
      escrowId: escrow.chainEscrowId
    });
    validateChainIdentity(escrow, snapshot);
    validateTransition(escrow.status, snapshot.status);

    escrow.status = snapshot.status;
    escrow.chainSnapshot = {
      status: snapshot.status,
      releaseApprovals: Number(snapshot.releaseApprovals || 0),
      refundApprovals: Number(snapshot.refundApprovals || 0),
      transactionHash: snapshot.transactionHash || null,
      blockNumber: snapshot.blockNumber || null,
      observedAt: this.now().toISOString()
    };
    if (FINAL_CHAIN_STATUSES.has(snapshot.status)) {
      escrow.settledAt = snapshot.blockTimestamp || this.now().toISOString();
      escrow.pendingSettlement = null;
    }
    return clone(escrow);
  }

  requireEscrow(id) {
    const escrow = this.escrows.get(id);
    if (!escrow) throw createError(404, "escrow not found");
    return escrow;
  }

  requireActionableEscrow(id) {
    const escrow = this.requireEscrow(id);
    if (!OPEN_CHAIN_STATUSES.has(escrow.status)) {
      throw createError(409, `escrow is ${escrow.status}; reconcile confirmed chain state first`);
    }
    return escrow;
  }
}

function validateChainIdentity(escrow, snapshot) {
  if (
    !snapshot ||
    (!OPEN_CHAIN_STATUSES.has(snapshot.status) && !FINAL_CHAIN_STATUSES.has(snapshot.status))
  ) {
    throw createError(502, "chain reader returned an invalid escrow status");
  }
  const fields = [
    ["clientAddress", escrow.clientAddress],
    ["robotAddress", escrow.robotAddress],
    ["arbiterAddress", escrow.arbiterAddress],
    ["tokenAddress", escrow.tokenAddress]
  ];
  for (const [field, expected] of fields) {
    if (normalizeAddress(snapshot[field]) !== expected) {
      throw createError(409, `gateway/on-chain divergence: ${field} mismatch`);
    }
  }
  if (
    String(snapshot.amount) !== escrow.amount ||
    String(snapshot.workHash).toLowerCase() !== escrow.workHash
  ) {
    throw createError(409, "gateway/on-chain divergence: amount or workHash mismatch");
  }
}

function validateTransition(current, next) {
  const allowed = {
    awaiting_chain_confirmation: new Set(["funded", "disputed", "released", "refunded"]),
    funded: new Set(["funded", "disputed", "released", "refunded"]),
    disputed: new Set(["disputed", "released", "refunded"]),
    released: new Set(["released"]),
    refunded: new Set(["refunded"])
  };
  if (!allowed[current]?.has(next)) {
    throw createError(409, `invalid chain status transition: ${current} -> ${next}`);
  }
}

function participantRole(escrow, actorId) {
  const actor = requireString(actorId, "actorId");
  for (const role of VALID_ROLES) {
    if (escrow[`${role}Id`] === actor) return role;
  }
  throw createError(403, "actor is not an escrow participant");
}

function approvalCount(approvals) {
  return Object.keys(approvals).filter((role) => VALID_ROLES.has(role)).length;
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createError(400, `${field} is required`);
  }
  return value.trim();
}

function requirePositiveIntegerString(value, field) {
  const normalized = String(value ?? "");
  if (!/^[1-9]\d*$/.test(normalized)) {
    throw createError(400, `${field} must be a positive integer string`);
  }
  return normalized;
}

function normalizeAddress(value) {
  const address = String(value || "").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) throw createError(400, "invalid EVM address");
  return address;
}

function requireAddress(value, field) {
  try {
    return normalizeAddress(value);
  } catch {
    throw createError(400, `${field} must be a valid EVM address`);
  }
}

function requireBytes32(value, field) {
  const normalized = String(value || "").toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(normalized)) {
    throw createError(400, `${field} must be a bytes32 hex value`);
  }
  return normalized;
}

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  EscrowStore,
  approvalCount,
  createError,
  validateChainIdentity,
  ZERO_ADDRESS
};
