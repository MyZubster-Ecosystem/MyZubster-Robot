"use strict";

const WORKFLOW_STATES = Object.freeze({
  PAYMENT_REQUIRED: "payment_required",
  ESCROW_LOCKED: "escrow_locked",
  WORK_STARTED: "work_started",
  WORK_SUBMITTED: "work_submitted",
  CLIENT_SIGNED: "client_signed",
  ROBOT_SIGNED: "robot_signed",
  DISPUTED: "disputed",
  RELEASED: "released",
  REFUNDED: "refunded",
  EXPIRED: "expired"
});

const TERMINAL_STATES = new Set([
  WORKFLOW_STATES.RELEASED,
  WORKFLOW_STATES.REFUNDED,
  WORKFLOW_STATES.EXPIRED
]);

const DEFAULT_FEE_RATES = Object.freeze({
  platform: 0.02,
  network: 0.08,
  referrer: 0.05
});

function createPaymentRequest(input = {}, options = {}) {
  const amountXmr = requirePositiveNumber(input.amountXmr, "amountXmr");
  const createdAt = normalizeIso(input.createdAt) || new Date(0).toISOString();
  const expiresAt = normalizeIso(input.expiresAt) || addSeconds(createdAt, options.requestTtlSeconds || 900);
  const requestId = input.requestId || stableId("x402", input.clientId, input.robotId, amountXmr, createdAt);

  return {
    state: WORKFLOW_STATES.PAYMENT_REQUIRED,
    requestId,
    escrowId: input.escrowId || stableId("escrow", requestId),
    clientId: requireText(input.clientId, "clientId"),
    robotId: requireText(input.robotId, "robotId"),
    aiArbiterId: input.aiArbiterId || "ai-arbiter",
    referrerId: input.referrerId || null,
    amountXmr,
    currency: input.currency || "XMR",
    service: {
      description: input.description || input.service?.description || "robot-service",
      endpoint: input.endpoint || input.service?.endpoint || "/api/x402/escrow",
      metadata: { ...(input.metadata || input.service?.metadata || {}) }
    },
    x402: {
      statusCode: 402,
      scheme: "x402",
      network: input.network || "monero",
      paymentAddress: input.paymentAddress || null,
      resource: input.resource || input.service?.endpoint || "/api/x402/escrow",
      maxAmountRequired: `${amountXmr} XMR`,
      expiresAt
    },
    signatures: {},
    evidence: [],
    events: [event("payment_required", createdAt, { requestId, amountXmr })],
    createdAt,
    updatedAt: createdAt
  };
}

function lockEscrow(paymentRequestInput, input = {}) {
  const paymentRequest = normalizeWorkflow(paymentRequestInput);
  assertState(paymentRequest, WORKFLOW_STATES.PAYMENT_REQUIRED);
  const lockedAt = normalizeIso(input.lockedAt) || normalizeIso(input.createdAt) || paymentRequest.createdAt;
  assertNotExpired(paymentRequest.x402.expiresAt, lockedAt);

  return {
    ...paymentRequest,
    state: WORKFLOW_STATES.ESCROW_LOCKED,
    payment: {
      txId: requireText(input.txId || input.paymentTxId, "txId"),
      lockedAmountXmr: paymentRequest.amountXmr,
      lockedAt,
      confirmations: normalizeInteger(input.confirmations, 0)
    },
    fees: calculateFeeSplit(paymentRequest.amountXmr, input.feeRates || DEFAULT_FEE_RATES),
    timeout: {
      workTimeoutAt: normalizeIso(input.workTimeoutAt) || addSeconds(lockedAt, input.workTtlSeconds || 3600),
      disputeTimeoutAt: normalizeIso(input.disputeTimeoutAt) || addSeconds(lockedAt, input.disputeTtlSeconds || 7200)
    },
    updatedAt: lockedAt,
    events: appendEvent(paymentRequest, "escrow_locked", lockedAt, {
      txId: input.txId || input.paymentTxId,
      lockedAmountXmr: paymentRequest.amountXmr
    })
  };
}

function startRobotWork(workflowInput, input = {}) {
  const workflow = normalizeWorkflow(workflowInput);
  assertState(workflow, WORKFLOW_STATES.ESCROW_LOCKED);
  assertActor(workflow.robotId, input.robotId, "robotId");
  const startedAt = normalizeIso(input.startedAt) || workflow.updatedAt;
  assertNotExpired(workflow.timeout.workTimeoutAt, startedAt);

  return {
    ...workflow,
    state: WORKFLOW_STATES.WORK_STARTED,
    work: {
      startedAt,
      robotId: workflow.robotId,
      status: "in_progress"
    },
    updatedAt: startedAt,
    events: appendEvent(workflow, "work_started", startedAt, {
      robotId: workflow.robotId
    })
  };
}

function submitWorkEvidence(workflowInput, input = {}) {
  const workflow = normalizeWorkflow(workflowInput);
  assertOneOfStates(workflow, [WORKFLOW_STATES.WORK_STARTED, WORKFLOW_STATES.WORK_SUBMITTED]);
  assertActor(workflow.robotId, input.robotId, "robotId");
  const submittedAt = normalizeIso(input.submittedAt) || workflow.updatedAt;

  const evidence = {
    id: input.id || stableId("evidence", workflow.escrowId, submittedAt, workflow.evidence.length),
    type: input.type || "completion",
    uri: input.uri || null,
    hash: input.hash || null,
    summary: input.summary || "",
    submittedAt
  };

  return {
    ...workflow,
    state: WORKFLOW_STATES.WORK_SUBMITTED,
    work: {
      ...(workflow.work || {}),
      status: "submitted",
      submittedAt
    },
    evidence: [...workflow.evidence, evidence],
    updatedAt: submittedAt,
    events: appendEvent(workflow, "work_submitted", submittedAt, {
      evidenceId: evidence.id,
      type: evidence.type
    })
  };
}

function signWorkflow(workflowInput, input = {}) {
  const workflow = normalizeWorkflow(workflowInput);
  assertOneOfStates(workflow, [
    WORKFLOW_STATES.WORK_SUBMITTED,
    WORKFLOW_STATES.CLIENT_SIGNED,
    WORKFLOW_STATES.ROBOT_SIGNED
  ]);
  const role = normalizeRole(input.role);
  const signerId = requireText(input.signerId, "signerId");
  const signedAt = normalizeIso(input.signedAt) || workflow.updatedAt;
  assertExpectedSigner(workflow, role, signerId);

  const signatures = {
    ...workflow.signatures,
    [role]: {
      signerId,
      signature: input.signature || stableId("sig", workflow.escrowId, role, signerId),
      signedAt
    }
  };
  const nextState = getSignatureState(signatures);
  const signedWorkflow = {
    ...workflow,
    state: nextState,
    signatures,
    updatedAt: signedAt,
    events: appendEvent(workflow, `${role}_signed`, signedAt, { signerId })
  };

  if (hasReleaseQuorum(signatures)) {
    return releaseEscrow(signedWorkflow, { releasedAt: signedAt, reason: "client_robot_quorum" });
  }

  return signedWorkflow;
}

function raiseDispute(workflowInput, input = {}) {
  const workflow = normalizeWorkflow(workflowInput);
  assertNotTerminal(workflow);
  const raisedAt = normalizeIso(input.raisedAt) || workflow.updatedAt;
  const actorId = requireText(input.actorId, "actorId");

  if (![workflow.clientId, workflow.robotId, workflow.aiArbiterId].includes(actorId)) {
    throw new Error("actorId must be a workflow participant");
  }

  return {
    ...workflow,
    state: WORKFLOW_STATES.DISPUTED,
    dispute: {
      actorId,
      reason: input.reason || "manual_dispute",
      raisedAt,
      evidenceIds: workflow.evidence.map((item) => item.id)
    },
    updatedAt: raisedAt,
    events: appendEvent(workflow, "dispute_raised", raisedAt, {
      actorId,
      reason: input.reason || "manual_dispute"
    })
  };
}

function resolveDispute(workflowInput, input = {}) {
  const workflow = normalizeWorkflow(workflowInput);
  assertState(workflow, WORKFLOW_STATES.DISPUTED);
  assertActor(workflow.aiArbiterId, input.aiArbiterId || input.signerId, "aiArbiterId");
  const resolvedAt = normalizeIso(input.resolvedAt) || workflow.updatedAt;
  const decision = input.decision || input.winner || "robot";

  if (decision === "robot" || decision === "release") {
    return releaseEscrow(workflow, {
      releasedAt: resolvedAt,
      reason: input.reason || "ai_dispute_release",
      aiArbiterId: workflow.aiArbiterId
    });
  }

  if (decision === "client" || decision === "refund") {
    return refundEscrow(workflow, {
      refundedAt: resolvedAt,
      reason: input.reason || "ai_dispute_refund",
      aiArbiterId: workflow.aiArbiterId
    });
  }

  throw new Error("decision must be robot/release or client/refund");
}

function handleTimeout(workflowInput, input = {}) {
  const workflow = normalizeWorkflow(workflowInput);
  assertNotTerminal(workflow);
  const now = normalizeIso(input.now) || workflow.updatedAt;

  if (
    [WORKFLOW_STATES.PAYMENT_REQUIRED, WORKFLOW_STATES.ESCROW_LOCKED].includes(workflow.state) &&
    workflow.timeout?.workTimeoutAt &&
    now > workflow.timeout.workTimeoutAt
  ) {
    return refundEscrow(workflow, {
      refundedAt: now,
      reason: input.reason || "work_timeout"
    });
  }

  if (
    [WORKFLOW_STATES.WORK_STARTED, WORKFLOW_STATES.WORK_SUBMITTED, WORKFLOW_STATES.CLIENT_SIGNED, WORKFLOW_STATES.ROBOT_SIGNED].includes(workflow.state) &&
    workflow.timeout?.disputeTimeoutAt &&
    now > workflow.timeout.disputeTimeoutAt
  ) {
    return raiseDispute(workflow, {
      actorId: workflow.aiArbiterId,
      raisedAt: now,
      reason: input.reason || "dispute_timeout"
    });
  }

  return workflow;
}

function releaseEscrow(workflowInput, input = {}) {
  const workflow = normalizeWorkflow(workflowInput);
  assertNotTerminal(workflow);
  const releasedAt = normalizeIso(input.releasedAt) || workflow.updatedAt;
  const fees = workflow.fees || calculateFeeSplit(workflow.amountXmr, DEFAULT_FEE_RATES);

  return {
    ...workflow,
    state: WORKFLOW_STATES.RELEASED,
    settlement: {
      type: "release",
      releasedAt,
      reason: input.reason || "release",
      robotReceivesXmr: fees.robotReceivesXmr,
      fees
    },
    updatedAt: releasedAt,
    events: appendEvent(workflow, "escrow_released", releasedAt, {
      reason: input.reason || "release",
      robotReceivesXmr: fees.robotReceivesXmr
    })
  };
}

function refundEscrow(workflowInput, input = {}) {
  const workflow = normalizeWorkflow(workflowInput);
  assertNotTerminal(workflow);
  const refundedAt = normalizeIso(input.refundedAt) || workflow.updatedAt;

  return {
    ...workflow,
    state: WORKFLOW_STATES.REFUNDED,
    settlement: {
      type: "refund",
      refundedAt,
      reason: input.reason || "refund",
      clientReceivesXmr: workflow.amountXmr
    },
    updatedAt: refundedAt,
    events: appendEvent(workflow, "escrow_refunded", refundedAt, {
      reason: input.reason || "refund",
      clientReceivesXmr: workflow.amountXmr
    })
  };
}

function calculateFeeSplit(amountXmr, rates = DEFAULT_FEE_RATES) {
  const amount = requirePositiveNumber(amountXmr, "amountXmr");
  const feeRates = {
    platform: normalizeNumber(rates.platform, DEFAULT_FEE_RATES.platform),
    network: normalizeNumber(rates.network, DEFAULT_FEE_RATES.network),
    referrer: normalizeNumber(rates.referrer, DEFAULT_FEE_RATES.referrer)
  };
  const totalFeeRate = feeRates.platform + feeRates.network + feeRates.referrer;

  if (totalFeeRate >= 1) {
    throw new Error("Total fee rate must be below 100%");
  }

  const platformFeeXmr = round(amount * feeRates.platform, 12);
  const networkFeeXmr = round(amount * feeRates.network, 12);
  const referrerFeeXmr = round(amount * feeRates.referrer, 12);
  const totalFeesXmr = round(platformFeeXmr + networkFeeXmr + referrerFeeXmr, 12);

  return {
    feeRates,
    platformFeeXmr,
    networkFeeXmr,
    referrerFeeXmr,
    totalFeesXmr,
    robotReceivesXmr: round(amount - totalFeesXmr, 12)
  };
}

function buildEndpointDefinitions() {
  return [
    { method: "POST", path: "/api/x402/escrow/request", description: "Create x402 Payment Required response" },
    { method: "POST", path: "/api/x402/escrow/:escrowId/lock", description: "Lock client payment into escrow" },
    { method: "POST", path: "/api/x402/escrow/:escrowId/start", description: "Robot starts work" },
    { method: "POST", path: "/api/x402/escrow/:escrowId/evidence", description: "Robot submits completion evidence" },
    { method: "POST", path: "/api/x402/escrow/:escrowId/sign", description: "Client or robot signs release" },
    { method: "POST", path: "/api/x402/escrow/:escrowId/dispute", description: "Raise dispute" },
    { method: "POST", path: "/api/x402/escrow/:escrowId/resolve", description: "AI arbiter releases or refunds" },
    { method: "POST", path: "/api/x402/escrow/:escrowId/timeout", description: "Evaluate timeout handling" },
    { method: "GET", path: "/api/x402/escrow/:escrowId", description: "Read workflow state" }
  ];
}

function normalizeWorkflow(input = {}) {
  if (!input.state) {
    throw new Error("workflow state is required");
  }

  return {
    ...input,
    amountXmr: Number(input.amountXmr),
    signatures: { ...(input.signatures || {}) },
    evidence: [...(input.evidence || [])],
    events: [...(input.events || [])]
  };
}

function getSignatureState(signatures) {
  if (signatures.client && !signatures.robot) {
    return WORKFLOW_STATES.CLIENT_SIGNED;
  }
  if (signatures.robot && !signatures.client) {
    return WORKFLOW_STATES.ROBOT_SIGNED;
  }
  return WORKFLOW_STATES.WORK_SUBMITTED;
}

function hasReleaseQuorum(signatures) {
  return Boolean(signatures.client && signatures.robot);
}

function appendEvent(workflow, type, at, details = {}) {
  return [
    ...(workflow.events || []),
    event(type, at, details)
  ];
}

function event(type, at, details = {}) {
  return {
    type,
    at,
    details
  };
}

function assertState(workflow, expectedState) {
  if (workflow.state !== expectedState) {
    throw new Error(`Expected state ${expectedState}, received ${workflow.state}`);
  }
}

function assertOneOfStates(workflow, states) {
  if (!states.includes(workflow.state)) {
    throw new Error(`Expected one of ${states.join(", ")}, received ${workflow.state}`);
  }
}

function assertNotTerminal(workflow) {
  if (TERMINAL_STATES.has(workflow.state)) {
    throw new Error(`Workflow is terminal: ${workflow.state}`);
  }
}

function assertActor(expected, received, fieldName) {
  if (expected !== received) {
    throw new Error(`${fieldName} does not match workflow participant`);
  }
}

function assertExpectedSigner(workflow, role, signerId) {
  if (role === "client") {
    assertActor(workflow.clientId, signerId, "signerId");
  } else if (role === "robot") {
    assertActor(workflow.robotId, signerId, "signerId");
  } else if (role === "ai") {
    assertActor(workflow.aiArbiterId, signerId, "signerId");
  }
}

function assertNotExpired(expiresAt, now) {
  if (expiresAt && now > expiresAt) {
    throw new Error("x402 payment request has expired");
  }
}

function normalizeRole(role) {
  const normalized = String(role || "").toLowerCase();
  if (["client", "robot", "ai"].includes(normalized)) {
    return normalized;
  }
  throw new Error("role must be client, robot, or ai");
}

function requireText(value, fieldName) {
  if (!value || !String(value).trim()) {
    throw new Error(`${fieldName} is required`);
  }
  return String(value).trim();
}

function requirePositiveNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return number;
}

function normalizeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function normalizeIso(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function addSeconds(value, seconds) {
  const date = new Date(value);
  return new Date(date.getTime() + seconds * 1000).toISOString();
}

function stableId(...parts) {
  return parts
    .map((part) => String(part === undefined || part === null ? "" : part))
    .join(":")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

module.exports = {
  DEFAULT_FEE_RATES,
  WORKFLOW_STATES,
  buildEndpointDefinitions,
  calculateFeeSplit,
  createPaymentRequest,
  handleTimeout,
  lockEscrow,
  raiseDispute,
  refundEscrow,
  releaseEscrow,
  resolveDispute,
  signWorkflow,
  startRobotWork,
  submitWorkEvidence
};
