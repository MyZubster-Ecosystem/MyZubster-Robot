"use strict";

const TERMINAL_STATUSES = new Set(["released", "refunded", "cancelled"]);

function createConditionalPayment(input, { now = new Date() } = {}) {
  const amountXmr = requirePositiveNumber(input.amountXmr, "amountXmr");
  const clientId = requireString(input.clientId, "clientId");
  const robotId = requireString(input.robotId, "robotId");

  if (clientId === robotId) {
    throw createError(400, "clientId and robotId must be different");
  }

  return {
    id: input.id || `conditional_${now.getTime()}`,
    escrowId: input.escrowId || null,
    clientId,
    robotId,
    amountXmr,
    currency: input.currency || "XMR",
    workOrder: input.workOrder || null,
    status: "escrow_locked",
    successCriteria: {
      requireRobotCompletion: true,
      requireClientApproval: true,
      minimumConfidence: 0.65,
      ...(input.successCriteria || {})
    },
    robotEvidence: null,
    clientDecision: null,
    aiDecision: null,
    refundReason: null,
    releaseReason: null,
    timeline: [
      event("escrow_locked", "Funds locked until success conditions are met", now)
    ],
    createdAt: now.toISOString(),
    settledAt: null
  };
}

function markWorkStarted(payment, details = {}, { now = new Date() } = {}) {
  const next = requireOpenPayment(payment);
  next.status = "work_in_progress";
  next.timeline.push(event("work_started", details.note || "Robot started work", now, details));
  return next;
}

function submitRobotEvidence(payment, evidence, { now = new Date() } = {}) {
  const next = requireOpenPayment(payment);
  next.robotEvidence = normalizeEvidence(evidence);
  next.status = "awaiting_client_confirmation";
  next.timeline.push(event("robot_evidence_submitted", "Robot submitted completion evidence", now, next.robotEvidence));
  return autoSettleIfReady(next, now);
}

function recordClientDecision(payment, decision, { now = new Date() } = {}) {
  const next = requireOpenPayment(payment);
  const approved = Boolean(decision && decision.approved);

  next.clientDecision = {
    approved,
    note: decision && decision.note ? String(decision.note) : "",
    at: now.toISOString()
  };

  next.timeline.push(
    event(approved ? "client_approved" : "client_rejected", next.clientDecision.note || "Client decision recorded", now)
  );

  if (!approved) {
    next.status = "disputed";
    next.refundReason = next.clientDecision.note || "client_rejected";
    return next;
  }

  return autoSettleIfReady(next, now);
}

function recordRobotFailure(payment, reason, { now = new Date() } = {}) {
  const next = requireOpenPayment(payment);
  next.status = "refunded";
  next.refundReason = requireString(reason, "reason");
  next.settledAt = now.toISOString();
  next.timeline.push(event("robot_failed", next.refundReason, now));
  next.timeline.push(event("funds_refunded", "Work failed; funds returned to client", now));
  return next;
}

function applyAiDecision(payment, review, { now = new Date() } = {}) {
  const next = requireOpenPayment(payment);
  const normalized = normalizeAiReview(review, next.successCriteria.minimumConfidence);
  next.aiDecision = normalized;
  next.timeline.push(event("ai_reviewed", normalized.reason, now, normalized));

  if (normalized.decision === "release") {
    next.status = "released";
    next.releaseReason = normalized.reason;
    next.settledAt = now.toISOString();
    next.timeline.push(event("funds_released", "AI approved successful completion", now));
    return next;
  }

  if (normalized.decision === "refund") {
    next.status = "refunded";
    next.refundReason = normalized.reason;
    next.settledAt = now.toISOString();
    next.timeline.push(event("funds_refunded", "AI rejected completion evidence", now));
    return next;
  }

  next.status = "disputed";
  return next;
}

function simulateAiReview(payment) {
  const evidence = payment.robotEvidence || {};
  let confidence = 0.45;
  const reasons = [];

  if (evidence.completed === true) {
    confidence += 0.25;
    reasons.push("robot marked work complete");
  }
  if (Number(evidence.workUnits) > 0) {
    confidence += Math.min(Number(evidence.workUnits) / 100, 0.15);
    reasons.push("robot reported work units");
  }
  if (Number(evidence.photoCount) > 0) {
    confidence += 0.05;
    reasons.push("completion photos submitted");
  }
  if (evidence.error || evidence.failed) {
    confidence -= 0.45;
    reasons.push("failure signal present");
  }
  if (payment.clientDecision && payment.clientDecision.approved === false) {
    confidence -= 0.25;
    reasons.push("client rejected the work");
  }

  confidence = Math.max(0, Math.min(1, Number(confidence.toFixed(2))));

  if (confidence >= payment.successCriteria.minimumConfidence) {
    return {
      decision: "release",
      confidence,
      reason: reasons.join("; ") || "success criteria satisfied",
      simulated: true
    };
  }

  if (evidence.error || evidence.failed) {
    return {
      decision: "refund",
      confidence,
      reason: reasons.join("; ") || "failure evidence detected",
      simulated: true
    };
  }

  return {
    decision: "manual_review",
    confidence,
    reason: reasons.join("; ") || "insufficient evidence",
    simulated: true
  };
}

function autoSettleIfReady(payment, now) {
  const robotSatisfied =
    !payment.successCriteria.requireRobotCompletion ||
    Boolean(payment.robotEvidence && payment.robotEvidence.completed === true && !payment.robotEvidence.error);
  const clientSatisfied =
    !payment.successCriteria.requireClientApproval ||
    Boolean(payment.clientDecision && payment.clientDecision.approved === true);

  if (robotSatisfied && clientSatisfied) {
    payment.status = "released";
    payment.releaseReason = "success_conditions_met";
    payment.settledAt = now.toISOString();
    payment.timeline.push(event("funds_released", "Success conditions met; funds released to robot", now));
  }

  return payment;
}

function requireOpenPayment(payment) {
  if (!payment || typeof payment !== "object") {
    throw createError(400, "payment is required");
  }
  if (TERMINAL_STATUSES.has(payment.status)) {
    throw createError(409, `payment is already ${payment.status}`);
  }
  return clone(payment);
}

function normalizeEvidence(evidence) {
  if (!evidence || typeof evidence !== "object") {
    throw createError(400, "evidence is required");
  }

  return {
    completed: Boolean(evidence.completed),
    workUnits: Number(evidence.workUnits || 0),
    photoCount: Number(evidence.photoCount || 0),
    failed: Boolean(evidence.failed),
    error: evidence.error ? String(evidence.error) : "",
    note: evidence.note ? String(evidence.note) : ""
  };
}

function normalizeAiReview(review, minimumConfidence) {
  if (!review || typeof review !== "object") {
    throw createError(400, "review is required");
  }

  const confidence = Number(review.confidence || 0);
  const decision = review.decision === "release" && confidence >= minimumConfidence
    ? "release"
    : review.decision === "refund"
      ? "refund"
      : "manual_review";

  return {
    decision,
    confidence,
    reason: review.reason ? String(review.reason) : "AI decision recorded",
    simulated: review.simulated !== false
  };
}

function event(type, message, at, details = {}) {
  return {
    type,
    message,
    details,
    at: at.toISOString()
  };
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
  applyAiDecision,
  createConditionalPayment,
  markWorkStarted,
  recordClientDecision,
  recordRobotFailure,
  simulateAiReview,
  submitRobotEvidence
};
