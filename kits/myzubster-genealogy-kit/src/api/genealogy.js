'use strict';
// Documented local accessor that mirrors the REST shape of the #79 dna.js helpers
// (GET /dna/:id/genealogy) WITHOUT committing any server. This is the "API per albero
// genealogico" deliverable from issue #82 - a pure JavaScript function that builds the
// parent -> children tree for a fleet of DNA records and exposes scoped lookups a UI
// can call. No network, no signing, no wallet.

// Build a { byId, rootIds, childrenOf } index from a list of DNA records.
function buildIndex(records) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  const byId = new Map();
  const childrenOf = new Map();
  for (const r of records) {
    if (!r || typeof r.id !== 'string') throw new TypeError('each record must have a string id');
    if (byId.has(r.id)) throw new Error('duplicate robot id: ' + r.id);
    byId.set(r.id, r);
  }
  const rootIds = [];
  for (const r of records) {
    const parentRef = (r.genealogy && r.genealogy.parentRef) || null;
    if (parentRef === null || !byId.has(parentRef)) {
      rootIds.push(r.id);
    } else {
      if (!childrenOf.has(parentRef)) childrenOf.set(parentRef, []);
      childrenOf.get(parentRef).push(r.id);
    }
  }
  // Deterministic ordering.
  rootIds.sort();
  for (const key of childrenOf.keys()) childrenOf.get(key).sort();
  return { byId, rootIds, childrenOf };
}

// getGenealogyTree(records): REST-shaped top-level endpoint, returns { rootIds, nodes }
// where `nodes` is a plain object (not a Map) so React state can spread it directly.
function getGenealogyTree(records) {
  const { rootIds, childrenOf } = buildIndex(records);
  const nodes = {};
  for (const id of new Set([...rootIds, ...childrenOf.keys(), ...records.map(r => r.id)])) {
    nodes[id] = (childrenOf.get(id) || []).slice();
  }
  return { rootIds: rootIds.slice(), nodes };
}

// getRobotGenealogy(records, id): scoped per-robot endpoint
// GET /dna/:id/genealogy - returns the immediate children + ancestor path.
function getRobotGenealogy(records, id) {
  const { byId, childrenOf } = buildIndex(records);
  if (!byId.has(id)) throw new Error('unknown robot id: ' + id);
  const ancestorPath = [];
  let cursor = id;
  let guard = 0;
  while (cursor !== null && byId.has(cursor) && guard < 1000) {
    ancestorPath.push(cursor);
    cursor = (byId.get(cursor).genealogy && byId.get(cursor).genealogy.parentRef) || null;
    guard += 1;
  }
  ancestorPath.reverse();
  return { id, children: (childrenOf.get(id) || []).slice(), ancestorPath };
}

// getMetrics(records): aggregate metrics (count robots / total jobs / total fee)
// for the dashboard Metrics panel. `fee` is a genealogy-record side metric only;
// no wallet / chain lookup happens here (see docs/dashboard-architecture.md).
function getMetrics(records) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  let totalRobots = records.length;
  let totalJobs = 0;
  let totalFee = 0;
  let activeCount = 0;
  for (const r of records) {
    totalJobs += Number.isFinite(r.jobsCompleted) ? Math.trunc(r.jobsCompleted) : 0;
    totalFee += Number.isFinite(r.fee) ? r.fee : 0;
    if (r.status === 'active' || r.status === 'learning') activeCount += 1;
  }
  return { totalRobots, totalJobs, totalFee, activeCount };
}

// Search + filter (used by the Filters component + the dashboard state machine).
function searchAndFilter(records, { robotType = null, queryText = '' } = {}) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  const q = String(queryText || '').toLowerCase();
  // 'all' is the UI sentinel for "no type filter" - treat it the same as null.
  const typeFilter = robotType && robotType !== 'all' ? robotType : null;
  return records.filter(r => {
    if (typeFilter && r.robotType !== typeFilter) return false;
    if (q) {
      const hay = String(r.id + ' ' + r.robotType + ' ' + (r.skills || []).map(s => s.skill).join(' ')).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });
}

module.exports = {
  buildIndex,
  getGenealogyTree,
  getRobotGenealogy,
  getMetrics,
  searchAndFilter,
};
