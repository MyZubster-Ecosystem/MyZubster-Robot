"use strict";

const VALID_ROLES = new Set(["client", "robot", "arbiter"]);

class EscrowStore {
  constructor({ now = () => new Date() } = {}) {
    this.now = now;
    this.counter = 1;
    this.escrows = new Map();
  }

  createEscrow(input) {
    const clientId = requireString(input.clientId, "clientId");
    const robotId = requireString(input.robotId, "robotId");
    const arbiterId = requireString(input.arbiterId || "ai-arbiter", "arbiterId");
    const amount = requirePositiveNumber(input.amount, "amount");
    const currency = input.currency || "XMR";

    if (clientId === robotId) {
      throw createError(400, "clientId and robotId must be different");
    }

    const createdAt = this.now();
    const id = `escrow_${createdAt.getTime()}_${this.counter++}`;
    const escrow = {
      id,
      clientId,
      robotId,
      arbiterId,
      amount,
      currency,
      chain: input.chain || "base-sepolia",
      contractAddress: input.contractAddress || null,
      workOrder: input.workOrder || null,
      status: "funded",
      releaseApprovals: {},
      refundApprovals: {},
      dispute: null,
      aiReview: null,
      createdAt: createdAt.toISOString(),
      settledAt: null
    };

    this.escrows.set(id, escrow);
    return clone(escrow);
  }

  getEscrow(id) {
    const escrow = this.escrows.get(id);
    if (!escrow) {
      throw createError(404, "escrow not found");
    }
    return clone(escrow);
  }

  listByRobot(robotId) {
    return [...this.escrows.values()]
      .filter((escrow) => escrow.robotId === robotId)
      .map(clone);
  }

  approveRelease(id, role, evidence = {}) {
    const escrow = this.requireOpenEscrow(id);
    assertRole(role);
    if (escrow.releaseApprovals[role]) {
      throw createError(409, `${role} already approved release`);
    }
    escrow.releaseApprovals[role] = {
      at: this.now().toISOString(),
      evidence
    };

    if (approvalCount(escrow.releaseApprovals) >= 2) {
      escrow.status = "released";
      escrow.settledAt = this.now().toISOString();
    }

    return clone(escrow);
  }

  approveRefund(id, role, evidence = {}) {
    const escrow = this.requireOpenEscrow(id);
    assertRole(role);
    if (escrow.refundApprovals[role]) {
      throw createError(409, `${role} already approved refund`);
    }
    escrow.status = "disputed";
    escrow.refundApprovals[role] = {
      at: this.now().toISOString(),
      evidence
    };

    if (approvalCount(escrow.refundApprovals) >= 2) {
      escrow.status = "refunded";
      escrow.settledAt = this.now().toISOString();
    }

    return clone(escrow);
  }

  raiseDispute(id, role, reason) {
    const escrow = this.requireOpenEscrow(id);
    assertRole(role);
    escrow.status = "disputed";
    escrow.dispute = {
      role,
      reason: requireString(reason, "reason"),
      at: this.now().toISOString()
    };
    return clone(escrow);
  }

  recordAiReview(id, review) {
    const escrow = this.requireOpenEscrow(id);
    escrow.aiReview = {
      ...review,
      at: this.now().toISOString()
    };

    if (review.decision === "approve_release" && !escrow.releaseApprovals.arbiter) {
      escrow.releaseApprovals.arbiter = {
        at: this.now().toISOString(),
        evidence: { aiReview: review }
      };
      if (approvalCount(escrow.releaseApprovals) >= 2) {
        escrow.status = "released";
        escrow.settledAt = this.now().toISOString();
      }
    }

    return clone(escrow);
  }

  requireOpenEscrow(id) {
    const escrow = this.escrows.get(id);
    if (!escrow) {
      throw createError(404, "escrow not found");
    }
    if (!["funded", "disputed"].includes(escrow.status)) {
      throw createError(409, `escrow is already ${escrow.status}`);
    }
    return escrow;
  }
}

function approvalCount(approvals) {
  return Object.keys(approvals).filter((role) => VALID_ROLES.has(role)).length;
}

function assertRole(role) {
  if (!VALID_ROLES.has(role)) {
    throw createError(400, "role must be client, robot, or arbiter");
  }
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createError(400, `${field} is required`);
  }
  return value.trim();
}

function requirePositiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw createError(400, `${field} must be a positive number`);
  }
  return number;
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
  createError
};
