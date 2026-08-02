"use strict";

const {
  buildEndpointDefinitions,
  createPaymentRequest,
  handleTimeout,
  lockEscrow,
  raiseDispute,
  resolveDispute,
  signWorkflow,
  startRobotWork,
  submitWorkEvidence
} = require("./automatedX402EscrowFlow");

function createInMemoryEscrowStore(seed = []) {
  const workflows = new Map(seed.map((workflow) => [workflow.escrowId, workflow]));

  return {
    get(escrowId) {
      return workflows.get(escrowId) || null;
    },
    save(workflow) {
      workflows.set(workflow.escrowId, workflow);
      return workflow;
    },
    list() {
      return [...workflows.values()];
    }
  };
}

function createAutomatedX402EscrowHandler({ store = createInMemoryEscrowStore(), now = () => new Date().toISOString() } = {}) {
  return function handleAutomatedX402EscrowRequest(request = {}) {
    const method = String(request.method || "GET").toUpperCase();
    const path = String(request.path || "");
    const body = request.body || {};
    const escrowId = extractEscrowId(path);

    if (method === "GET" && path === "/api/x402/escrow") {
      return response(200, {
        endpoints: buildEndpointDefinitions(),
        workflows: store.list()
      });
    }

    if (method === "POST" && path === "/api/x402/escrow/request") {
      const workflow = createPaymentRequest({ ...body, createdAt: body.createdAt || now() });
      store.save(workflow);
      return response(402, workflow);
    }

    if (method === "GET" && escrowId) {
      return response(200, requireWorkflow(store, escrowId));
    }

    if (!escrowId) {
      return response(404, { error: "unknown_route" });
    }

    const workflow = requireWorkflow(store, escrowId);
    const nextWorkflow = routeWorkflowAction(method, path, workflow, body, now);
    store.save(nextWorkflow);
    return response(200, nextWorkflow);
  };
}

function routeWorkflowAction(method, path, workflow, body, now) {
  if (method === "POST" && path.endsWith("/lock")) {
    return lockEscrow(workflow, { ...body, lockedAt: body.lockedAt || now() });
  }
  if (method === "POST" && path.endsWith("/start")) {
    return startRobotWork(workflow, { ...body, startedAt: body.startedAt || now() });
  }
  if (method === "POST" && path.endsWith("/evidence")) {
    return submitWorkEvidence(workflow, { ...body, submittedAt: body.submittedAt || now() });
  }
  if (method === "POST" && path.endsWith("/sign")) {
    return signWorkflow(workflow, { ...body, signedAt: body.signedAt || now() });
  }
  if (method === "POST" && path.endsWith("/dispute")) {
    return raiseDispute(workflow, { ...body, raisedAt: body.raisedAt || now() });
  }
  if (method === "POST" && path.endsWith("/resolve")) {
    return resolveDispute(workflow, { ...body, resolvedAt: body.resolvedAt || now() });
  }
  if (method === "POST" && path.endsWith("/timeout")) {
    return handleTimeout(workflow, { ...body, now: body.now || now() });
  }
  throw new Error("unknown_workflow_action");
}

function extractEscrowId(path) {
  const match = path.match(/^\/api\/x402\/escrow\/([^/]+)(?:\/[^/]+)?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function requireWorkflow(store, escrowId) {
  const workflow = store.get(escrowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${escrowId}`);
  }
  return workflow;
}

function response(statusCode, body) {
  return {
    statusCode,
    body
  };
}

module.exports = {
  createAutomatedX402EscrowHandler,
  createInMemoryEscrowStore
};
