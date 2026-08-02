"use strict";

function reviewWorkEvidence({ telemetry = {}, evidence = {}, disputeReason = "" } = {}) {
  const reasons = [];
  let score = 0.5;

  if (telemetry.completed === true || evidence.completed === true) {
    score += 0.25;
    reasons.push("Completion flag was provided");
  }

  if (typeof telemetry.workUnits === "number" && telemetry.workUnits > 0) {
    score += Math.min(telemetry.workUnits / 100, 0.15);
    reasons.push("Robot reported completed work units");
  }

  if (typeof evidence.photoCount === "number" && evidence.photoCount > 0) {
    score += 0.05;
    reasons.push("Completion evidence includes photos");
  }

  if (typeof disputeReason === "string" && /fail|error|fraud|damage|incomplete/i.test(disputeReason)) {
    score -= 0.35;
    reasons.push("Dispute reason indicates incomplete or failed work");
  }

  if (telemetry.error || evidence.error) {
    score -= 0.25;
    reasons.push("Robot telemetry or evidence contains an error");
  }

  const confidence = Math.max(0, Math.min(1, Number(score.toFixed(2))));
  const decision = confidence >= 0.65 ? "approve_release" : "needs_human_review";

  return {
    decision,
    confidence,
    reasons: reasons.length ? reasons : ["No strong positive or negative signal was provided"],
    simulated: true
  };
}

module.exports = { reviewWorkEvidence };
