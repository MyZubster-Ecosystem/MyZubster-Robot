"use strict";

const {
  buildDashboardEndpointDefinitions,
  normalizeDashboardSnapshot
} = require("./escrowDashboardData");

function createEscrowDashboardApi({ baseUrl = "", fetchImpl = globalThis.fetch, headers = {} } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch implementation is required");
  }

  return {
    endpoints: buildDashboardEndpointDefinitions(),

    async getDashboard(filters = {}) {
      const response = await fetchJson(fetchImpl, buildUrl(baseUrl, "/api/dashboard/x402-escrow", filters), headers);
      return normalizeDashboardSnapshot(response.data || response);
    },

    async listPayments(filters = {}) {
      const response = await fetchJson(
        fetchImpl,
        buildUrl(baseUrl, "/api/dashboard/x402-escrow/payments", filters),
        headers
      );
      return Array.isArray(response.data) ? response.data : response.payments || [];
    },

    async listTransactions(filters = {}) {
      const response = await fetchJson(
        fetchImpl,
        buildUrl(baseUrl, "/api/dashboard/x402-escrow/transactions", filters),
        headers
      );
      return Array.isArray(response.data) ? response.data : response.transactions || [];
    },

    async listDisputes(filters = {}) {
      const response = await fetchJson(
        fetchImpl,
        buildUrl(baseUrl, "/api/dashboard/x402-escrow/disputes", filters),
        headers
      );
      return Array.isArray(response.data) ? response.data : response.disputes || [];
    }
  };
}

function buildUrl(baseUrl, path, filters = {}) {
  const root = String(baseUrl || "").replace(/\/$/, "");
  const url = new URL(`${root}${path}`, root ? undefined : "http://localhost");

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  if (!root) {
    return `${url.pathname}${url.search}`;
  }
  return url.toString();
}

async function fetchJson(fetchImpl, url, headers) {
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...headers
    }
  });

  const payload = typeof response.json === "function" ? await response.json() : response;
  if (response.ok === false) {
    const message = payload && payload.error ? payload.error : "Dashboard API request failed";
    const error = new Error(message);
    error.statusCode = response.status || 500;
    throw error;
  }
  return payload;
}

module.exports = {
  buildUrl,
  createEscrowDashboardApi
};
