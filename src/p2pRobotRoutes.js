"use strict";

const { P2PPaymentStore, buildP2PEndpoints } = require("./p2pRobotPayments");

function createP2PRouter({ store = new P2PPaymentStore() } = {}) {
  return {
    endpoints: buildP2PEndpoints(),
    handle(request) {
      return handleP2PRequest(request, store);
    }
  };
}

function handleP2PRequest({ method, path, body = {} }, store) {
  const route = matchRoute(method, path);
  if (!route) {
    return response(404, { error: "P2P route not found" });
  }

  try {
    if (route.action === "createRequest") {
      const request = store.createRequest(body);
      return response(402, { request, paymentRequired: request.x402 });
    }

    if (route.action === "getRequest") {
      return response(200, { request: store.getRequest(route.id) });
    }

    if (route.action === "lockPayment") {
      return response(200, { request: store.lockPayment(route.id, body) });
    }

    if (route.action === "acceptService") {
      return response(200, { request: store.acceptService(route.id, body) });
    }

    if (route.action === "submitEvidence") {
      return response(200, { request: store.submitEvidence(route.id, body) });
    }

    if (route.action === "approveRelease") {
      return response(200, { request: store.approveRelease(route.id, body.role, body.evidence || {}) });
    }

    if (route.action === "applyAiDecision") {
      return response(200, { request: store.applyAiDecision(route.id, body) });
    }

    if (route.action === "refund") {
      return response(200, { request: store.refund(route.id, body.reason) });
    }

    return response(404, { error: "P2P route not found" });
  } catch (error) {
    return response(error.statusCode || 500, { error: error.message });
  }
}

function matchRoute(method, path) {
  const normalizedMethod = String(method || "").toUpperCase();
  const parts = String(path || "").split("/").filter(Boolean);

  if (normalizedMethod === "POST" && path === "/api/p2p/requests") {
    return { action: "createRequest" };
  }

  if (parts[0] !== "api" || parts[1] !== "p2p" || parts[2] !== "requests" || !parts[3]) {
    return null;
  }

  if (normalizedMethod === "GET" && parts.length === 4) {
    return { action: "getRequest", id: parts[3] };
  }

  if (normalizedMethod !== "POST" || parts.length !== 5) {
    return null;
  }

  const actionBySegment = {
    pay: "lockPayment",
    accept: "acceptService",
    evidence: "submitEvidence",
    release: "approveRelease",
    "ai-decision": "applyAiDecision",
    refund: "refund"
  };

  const action = actionBySegment[parts[4]];
  return action ? { action, id: parts[3] } : null;
}

function response(statusCode, body) {
  return { statusCode, body };
}

module.exports = {
  createP2PRouter,
  handleP2PRequest,
  matchRoute
};
