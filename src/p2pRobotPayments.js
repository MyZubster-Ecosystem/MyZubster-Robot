"use strict";

const TERMINAL_STATUSES = new Set(["released", "refunded", "cancelled"]);

const DEFAULT_POLICY = {
  requestTtlSeconds: 900,
  minimumProviderReputation: 0.55,
  minimumRequesterReputation: 0.45,
  arbiterId: "ai-arbiter"
};

class P2PPaymentStore {
  constructor({ now = () => new Date(), policy = {} } = {}) {
    this.now = now;
    this.policy = { ...DEFAULT_POLICY, ...policy };
    this.counter = 1;
    this.requests = new Map();
  }

  createRequest(input) {
    const createdAt = this.now();
    const request = createP2PServiceRequest(input, {
      now: createdAt,
      policy: this.policy,
      id: input.id || `p2p_${createdAt.getTime()}_${this.counter++}`
    });
    this.requests.set(request.id, request);
    return clone(request);
  }

  getRequest(id) {
    const request = this.requests.get(id);
    if (!request) {
      throw createError(404, "P2P request not found");
    }
    return clone(request);
  }

  lockPayment(id, payment) {
    return this.update(id, (request) => lockP2PEscrow(request, payment, { now: this.now() }));
  }

  acceptService(id, details = {}) {
    return this.update(id, (request) => acceptP2PService(request, details, { now: this.now() }));
  }

  submitEvidence(id, evidence) {
    return this.update(id, (request) => submitP2PServiceEvidence(request, evidence, { now: this.now() }));
  }

  approveRelease(id, role, evidence = {}) {
    return this.update(id, (request) => approveP2PRelease(request, role, evidence, { now: this.now() }));
  }

  applyAiDecision(id, decision) {
    return this.update(id, (request) => applyP2PAiDecision(request, decision, { now: this.now() }));
  }

  refund(id, reason) {
    return this.update(id, (request) => refundP2PPayment(request, reason, { now: this.now() }));
  }

  update(id, mutate) {
    const current = this.requests.get(id);
    if (!current) {
      throw createError(404, "P2P request not found");
    }
    const next = mutate(clone(current));
    this.requests.set(id, next);
    return clone(next);
  }
}

function createRobotIdentity(input) {
  const robotId = requireString(input.robotId, "robotId");
  const walletAddress = requireString(input.walletAddress, "walletAddress");
  const reputation = input.reputation || {};

  return {
    robotId,
    walletAddress,
    services: Array.isArray(input.services) ? input.services.map(String) : [],
    reputation: {
      ...reputation,
      score: calculateRobotReputation(reputation)
    }
  };
}

function calculateRobotReputation({
  completedJobs = 0,
  disputedJobs = 0,
  averageRating = 5,
  successfulPayments = 0,
  failedPayments = 0
} = {}) {
  const jobTotal = completedJobs + disputedJobs;
  const paymentTotal = successfulPayments + failedPayments;
  const completionScore = jobTotal === 0 ? 0.6 : completedJobs / jobTotal;
  const paymentScore = paymentTotal === 0 ? 0.6 : successfulPayments / paymentTotal;
  const ratingScore = Math.max(0, Math.min(5, Number(averageRating))) / 5;
  const volumeScore = Math.min(completedJobs / 20, 1);

  return Number((completionScore * 0.35 + ratingScore * 0.35 + paymentScore * 0.2 + volumeScore * 0.1).toFixed(4));
}

function createP2PServiceRequest(input, { now = new Date(), policy = {}, id = null } = {}) {
  const mergedPolicy = { ...DEFAULT_POLICY, ...policy };
  const requester = createRobotIdentity(input.requester);
  const provider = createRobotIdentity(input.provider);
  const amountXmr = requirePositiveNumber(input.amountXmr, "amountXmr");
  const service = requireString(input.service, "service");

  if (requester.robotId === provider.robotId) {
    throw createError(400, "requester and provider robots must be different");
  }
  if (requester.reputation.score < mergedPolicy.minimumRequesterReputation) {
    throw createError(403, "requester reputation is too low for P2P payments");
  }
  if (provider.reputation.score < mergedPolicy.minimumProviderReputation) {
    throw createError(403, "provider reputation is too low for P2P payments");
  }

  const expiresAt = new Date(now.getTime() + mergedPolicy.requestTtlSeconds * 1000);
  const requestId = id || `p2p_${now.getTime()}`;

  return {
    id: requestId,
    requester,
    provider,
    service,
    amountXmr,
    currency: input.currency || "XMR",
    status: "payment_required",
    x402: buildPaymentRequiredPayload({
      requestId,
      requester,
      provider,
      amountXmr,
      currency: input.currency || "XMR",
      service,
      expiresAt
    }),
    escrow: null,
    serviceEvidence: null,
    releaseApprovals: {},
    aiDecision: null,
    timeline: [event("payment_required", "Provider returned x402 Payment Required", now)],
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    settledAt: null
  };
}

function lockP2PEscrow(request, payment, { now = new Date() } = {}) {
  const next = requireOpenRequest(request);
  if (next.status !== "payment_required") {
    throw createError(409, "request is not waiting for payment");
  }
  if (parseDate(next.expiresAt, "expiresAt") <= now) {
    throw createError(410, "payment request expired");
  }

  const payerRobotId = requireString(payment.payerRobotId, "payerRobotId");
  const escrowId = requireString(payment.escrowId, "escrowId");
  const amountXmr = requirePositiveNumber(payment.amountXmr, "amountXmr");

  if (payerRobotId !== next.requester.robotId) {
    throw createError(403, "only the requester robot can lock payment");
  }
  if (amountXmr < next.amountXmr) {
    throw createError(400, "locked amount is lower than requested amount");
  }

  next.status = "escrow_locked";
  next.escrow = {
    escrowId,
    lockedAmountXmr: amountXmr,
    currency: next.currency,
    requesterRobotId: next.requester.robotId,
    providerRobotId: next.provider.robotId,
    arbiterId: payment.arbiterId || DEFAULT_POLICY.arbiterId,
    lockedAt: now.toISOString()
  };
  next.timeline.push(event("escrow_locked", "Requester locked funds for P2P service", now, next.escrow));
  return next;
}

function acceptP2PService(request, details = {}, { now = new Date() } = {}) {
  const next = requireOpenRequest(request);
  if (next.status !== "escrow_locked") {
    throw createError(409, "escrow must be locked before service starts");
  }
  next.status = "service_in_progress";
  next.timeline.push(event("service_started", details.note || "Provider started the requested service", now, details));
  return next;
}

function submitP2PServiceEvidence(request, evidence, { now = new Date() } = {}) {
  const next = requireOpenRequest(request);
  if (!["escrow_locked", "service_in_progress"].includes(next.status)) {
    throw createError(409, "service evidence cannot be submitted in this state");
  }

  next.serviceEvidence = normalizeEvidence(evidence);
  next.releaseApprovals.provider = {
    at: now.toISOString(),
    evidence: next.serviceEvidence
  };
  next.status = next.serviceEvidence.completed && !next.serviceEvidence.error ? "awaiting_requester_release" : "disputed";
  next.timeline.push(event("service_evidence_submitted", "Provider submitted service evidence", now, next.serviceEvidence));
  return next;
}

function approveP2PRelease(request, role, evidence = {}, { now = new Date() } = {}) {
  const next = requireOpenRequest(request);
  const normalizedRole = requireReleaseRole(role);

  if (!next.serviceEvidence) {
    throw createError(409, "service evidence is required before release approval");
  }
  if (next.releaseApprovals[normalizedRole]) {
    throw createError(409, `${normalizedRole} already approved release`);
  }

  next.releaseApprovals[normalizedRole] = {
    at: now.toISOString(),
    evidence
  };
  next.timeline.push(event("release_approved", `${normalizedRole} approved release`, now, { role: normalizedRole }));

  if (canRelease(next)) {
    next.status = "released";
    next.settledAt = now.toISOString();
    next.timeline.push(event("funds_released", "P2P escrow released to provider robot", now));
  }

  return next;
}

function applyP2PAiDecision(request, decision, { now = new Date() } = {}) {
  const next = requireOpenRequest(request);
  const normalized = normalizeAiDecision(decision);
  next.aiDecision = normalized;
  next.timeline.push(event("ai_decision", normalized.reason, now, normalized));

  if (normalized.decision === "release") {
    next.releaseApprovals.arbiter = {
      at: now.toISOString(),
      evidence: normalized
    };
    if (canRelease(next)) {
      next.status = "released";
      next.settledAt = now.toISOString();
      next.timeline.push(event("funds_released", "AI approved P2P escrow release", now));
    }
    return next;
  }

  if (normalized.decision === "refund") {
    next.status = "refunded";
    next.settledAt = now.toISOString();
    next.timeline.push(event("funds_refunded", "AI refunded P2P escrow to requester robot", now));
    return next;
  }

  next.status = "disputed";
  return next;
}

function refundP2PPayment(request, reason, { now = new Date() } = {}) {
  const next = requireOpenRequest(request);
  next.status = "refunded";
  next.settledAt = now.toISOString();
  next.timeline.push(event("funds_refunded", requireString(reason, "reason"), now));
  return next;
}

function buildP2PEndpoints() {
  return [
    { method: "POST", path: "/api/p2p/requests", action: "createRequest" },
    { method: "GET", path: "/api/p2p/requests/:id", action: "getRequest" },
    { method: "POST", path: "/api/p2p/requests/:id/pay", action: "lockPayment" },
    { method: "POST", path: "/api/p2p/requests/:id/accept", action: "acceptService" },
    { method: "POST", path: "/api/p2p/requests/:id/evidence", action: "submitEvidence" },
    { method: "POST", path: "/api/p2p/requests/:id/release", action: "approveRelease" },
    { method: "POST", path: "/api/p2p/requests/:id/ai-decision", action: "applyAiDecision" },
    { method: "POST", path: "/api/p2p/requests/:id/refund", action: "refund" }
  ];
}

function buildPaymentRequiredPayload({ requestId, requester, provider, amountXmr, currency, service, expiresAt }) {
  return {
    statusCode: 402,
    protocol: "x402",
    requestId,
    service,
    amountXmr,
    currency,
    payTo: provider.walletAddress,
    payer: requester.walletAddress,
    expiresAt: expiresAt.toISOString(),
    metadata: {
      requesterRobotId: requester.robotId,
      providerRobotId: provider.robotId,
      requesterReputation: requester.reputation.score,
      providerReputation: provider.reputation.score
    }
  };
}

function canRelease(request) {
  return Boolean(
    request.serviceEvidence &&
    request.serviceEvidence.completed === true &&
    !request.serviceEvidence.error &&
    request.releaseApprovals.provider &&
    (request.releaseApprovals.requester || request.releaseApprovals.arbiter)
  );
}

function normalizeEvidence(evidence) {
  if (!evidence || typeof evidence !== "object") {
    throw createError(400, "evidence is required");
  }
  return {
    completed: Boolean(evidence.completed),
    workUnits: Number(evidence.workUnits || 0),
    photoCount: Number(evidence.photoCount || 0),
    note: evidence.note ? String(evidence.note) : "",
    error: evidence.error ? String(evidence.error) : ""
  };
}

function normalizeAiDecision(decision) {
  if (!decision || typeof decision !== "object") {
    throw createError(400, "decision is required");
  }
  if (!["release", "refund", "manual_review"].includes(decision.decision)) {
    throw createError(400, "decision must be release, refund, or manual_review");
  }
  return {
    decision: decision.decision,
    confidence: Number(decision.confidence || 0),
    reason: decision.reason ? String(decision.reason) : "AI decision recorded",
    simulated: decision.simulated !== false
  };
}

function requireOpenRequest(request) {
  if (!request || typeof request !== "object") {
    throw createError(400, "request is required");
  }
  if (TERMINAL_STATUSES.has(request.status)) {
    throw createError(409, `request is already ${request.status}`);
  }
  return clone(request);
}

function requireReleaseRole(role) {
  const normalized = requireString(role, "role");
  if (!["requester", "provider", "arbiter"].includes(normalized)) {
    throw createError(400, "role must be requester, provider, or arbiter");
  }
  return normalized;
}

function parseDate(value, field) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError(400, `${field} must be a valid date`);
  }
  return date;
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

function event(type, message, at, details = {}) {
  return {
    type,
    message,
    details,
    at: at.toISOString()
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  P2PPaymentStore,
  buildP2PEndpoints,
  calculateRobotReputation,
  createP2PServiceRequest,
  createRobotIdentity,
  lockP2PEscrow,
  acceptP2PService,
  submitP2PServiceEvidence,
  approveP2PRelease,
  applyP2PAiDecision,
  refundP2PPayment
};
