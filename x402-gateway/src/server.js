"use strict";

const http = require("node:http");
const { URL } = require("node:url");
const { EscrowStore } = require("./escrowStore");
const { reviewWorkEvidence } = require("./aiArbiter");
const { EvmChainReader } = require("./evmChainReader");

function createServer({ store = createDefaultStore() } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname.split("/").filter(Boolean);

      if (req.method === "GET" && url.pathname === "/health") {
        return sendJson(res, 200, { ok: true, service: "myzubster-robot-gateway" });
      }

      if (req.method === "POST" && url.pathname === "/api/escrow/create") {
        const payload = await readJson(req);
        return sendJson(res, 201, { escrow: store.createEscrow(payload) });
      }

      if (path[0] === "api" && path[1] === "escrow" && path[2]) {
        const escrowId = path[2];

        if (req.method === "GET" && path.length === 3) {
          return sendJson(res, 200, { escrow: store.getEscrow(escrowId) });
        }

        if (req.method === "POST" && path[3] === "confirm-release") {
          const payload = await readJson(req);
          return sendJson(res, 200, {
            escrow: store.approveRelease(escrowId, payload.actorId, payload.evidence || {})
          });
        }

        if (req.method === "POST" && path[3] === "confirm-refund") {
          const payload = await readJson(req);
          return sendJson(res, 200, {
            escrow: store.approveRefund(escrowId, payload.actorId, payload.evidence || {})
          });
        }

        if (req.method === "POST" && path[3] === "dispute") {
          const payload = await readJson(req);
          return sendJson(res, 200, {
            escrow: store.raiseDispute(escrowId, payload.actorId, payload.reason)
          });
        }

        if (req.method === "POST" && path[3] === "ai-arbitrate") {
          const payload = await readJson(req);
          const review = reviewWorkEvidence(payload);
          return sendJson(res, 200, {
            review,
            escrow: store.recordAiReview(escrowId, review)
          });
        }

        if (req.method === "POST" && path[3] === "reconcile") {
          return sendJson(res, 200, { escrow: await store.reconcile(escrowId) });
        }
      }

      if (req.method === "GET" && path[0] === "api" && path[1] === "robot" && path[2] && path[3] === "escrows") {
        return sendJson(res, 200, { escrows: store.listByRobot(path[2]) });
      }

      sendJson(res, 404, { error: "route not found" });
    } catch (error) {
      sendJson(res, error.statusCode || 500, { error: error.message || "internal error" });
    }
  });
}

function createDefaultStore() {
  if (!process.env.EVM_RPC_URL) return new EscrowStore();
  return new EscrowStore({
    chainReader: new EvmChainReader({
      rpcUrl: process.env.EVM_RPC_URL,
      fromBlock: Number(process.env.EVM_ESCROW_DEPLOYMENT_BLOCK || 0)
    })
  });
}

function sendJson(res, statusCode, body) {
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(json)
  });
  res.end(json);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    error.statusCode = 400;
    error.message = "invalid JSON body";
    throw error;
  }
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => {
    process.stdout.write(`MyZubster Robot gateway listening on ${port}\n`);
  });
}

module.exports = { createDefaultStore, createServer, readJson };
