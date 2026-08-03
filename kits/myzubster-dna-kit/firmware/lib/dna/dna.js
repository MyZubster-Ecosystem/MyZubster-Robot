'use strict';
// Hereditary robot-DNA helpers for MyZubster-Robot issue #79 (robot DNA / inheritance).
// Pure JS, no I/O, no network, no crypto - matches the §2-safe-harbor scope of the
// #71 eco kit and #74 agri kit. The `walletAddress` field is INFORMATIONAL ONLY: it is
// modeled as an optional string in the schema and is NEVER generated, signed, or
// broadcast by anything in this kit (see docs/wallet-field-note.md).

// ---- Schema reference (mirrored in schema/dna.schema.json for tooling) ----
const ROBOT_TYPES = ['lawn-mower', 'irrigator', 'drone', 'agri', 'eco', 'recycled', 'diy', 'mother', 'custom'];
const DNA_FIELDS = [
  'id', 'robotType', 'skills', 'reputation', 'jobsCompleted',
  'walletAddress', 'hardwareConfig', 'learningLog', 'genealogy', 'createdAt'
];
const REPUTATION_MIN = 0, REPUTATION_MAX = 100;
const NEW_GEN_BASE = 0; // mother robot is generation 0

function optWith(base, opt) { return Object.assign({}, base, opt || {}); }
function isStr(v) { return typeof v === 'string'; }
function isNum(v) { return typeof v === 'number' && Number.isFinite(v); }
function isArr(v) { return Array.isArray(v); }
function genId(seed) {
  // Deterministic-ish id: caller passes a counter or timestamp; we never rely on RNG so
  // unit tests are reproducible. Returns a string.
  const s = isStr(seed) ? seed : String(seed == null ? '' : seed);
  return 'robot-' + (s || 'x');
}

// ---- createDNA: factory + minimal inline schema validation ----
// Required fields: robotType. Optional: id, skills, reputation, jobsCompleted,
// walletAddress, hardwareConfig, learningLog, genealogy (parentRef/generation), createdAt.
function createDNA(opts) {
  if (!opts || typeof opts !== 'object') throw new TypeError('createDNA needs an options object');
  if (!isStr(opts.robotType)) throw new TypeError('robotType must be a string');
  if (ROBOT_TYPES.indexOf(opts.robotType) < 0) throw new TypeError('unknown robotType: ' + opts.robotType);
  const skills = isArr(opts.skills) ? opts.skills.map(normalizeSkill).filter(Boolean) : [];
  const reputation = isNum(opts.reputation) ? clampReputation(opts.reputation) : opts.reputation == null ? REPUTATION_MIN : (() => { throw new TypeError('reputation must be a number'); })();
  const jobsCompleted = isNum(opts.jobsCompleted) ? Math.max(0, Math.trunc(opts.jobsCompleted)) : opts.jobsCompleted == null ? 0 : (() => { throw new TypeError('jobsCompleted must be an integer'); })();
  if (opts.walletAddress != null && !isStr(opts.walletAddress)) throw new TypeError('walletAddress must be a string or null');
  const walletAddress = opts.walletAddress == null ? null : opts.walletAddress;
  const hardwareConfig = opts.hardwareConfig && typeof opts.hardwareConfig === 'object' ? Object.assign({}, opts.hardwareConfig) : {};
  const learningLog = isArr(opts.learningLog) ? opts.learningLog.map(normalizeLesson).filter(Boolean) : [];
  const genealogy = normalizeGenealogy(opts.genealogy);
  return {
    id: opts.id != null ? String(opts.id) : genId(genealogy.parentRef || genealogy.generation || 0),
    robotType: opts.robotType,
    skills,
    reputation,
    jobsCompleted,
    walletAddress,
    hardwareConfig,
    learningLog,
    genealogy,
    createdAt: opts.createdAt != null ? String(opts.createdAt) : null,
  };
}

function normalizeSkill(s) {
  if (!s || typeof s !== 'object') return null;
  if (!isStr(s.skill)) return null;
  const level = isNum(s.level) ? clampReputation(s.level) : 0;
  return { skill: s.skill, level };
}
function normalizeLesson(l) {
  if (!l || typeof l !== 'object') return null;
  if (!isStr(l.lesson)) return null;
  const confidence = isNum(l.confidence) ? clampReputation(l.confidence) : (l.confidence == null ? REPUTATION_MIN : null);
  if (confidence == null) return null;
  return { lesson: l.lesson, confidence, ts: l.ts == null ? null : String(l.ts) };
}
function normalizeGenealogy(g) {
  if (!g || typeof g !== 'object') return { parentRef: null, generation: NEW_GEN_BASE };
  return {
    parentRef: isStr(g.parentRef) ? g.parentRef : null,
    generation: isNum(g.generation) ? Math.max(0, Math.trunc(g.generation)) : NEW_GEN_BASE,
  };
}
function clampReputation(n) { return Math.max(REPUTATION_MIN, Math.min(REPUTATION_MAX, Math.round(n))); }

// ---- readDNA: the documented "endpoint per leggere DNA" (local, read-only) ----
// Acts as the canonical accessor for any DNA record: validates the record is a DNA
// object, checks `field` is a known schema field, and returns the value. No network,
// no side effects - mirrors a REST `GET /dna/:id/:field` without committing any server.
function readDNA(record, field) {
  if (!record || typeof record !== 'object') throw new TypeError('record must be a DNA object');
  if (!isStr(field)) throw new TypeError('field must be a string');
  if (DNA_FIELDS.indexOf(field) < 0) throw new TypeError('unknown DNA field: ' + field);
  return record[field];
}

// ---- inheritance: derive a child DNA from a parent DNA ----
// Semantics (documented in docs/inheritance-and-mutation.md):
// - robotType: inherited, overridable via childOpts.robotType
// - skills: child inherits parent.skills (deep copy), then bumped with childOpts.skills
// - reputation: child starts at 0 (new robot, must earn its own reputation)
// - jobsCompleted: child starts at 0
// - walletAddress: child inherits parent.walletAddress literally (informational only;
//   never generated or signed - maintainer wires the real upstream wallet per docs)
// - hardwareConfig: child inherits parent.hardwareConfig, then merged with childOpts.hardwareConfig
// - learningLog: child starts empty; parent.learningLog is available downstream as a
//   "knowledge seed" via readDNA but is NOT copied (each robot logs its own learning)
// - genealogy: child.parentRef = parent.id; child.generation = parent.generation + 1
function inheritance(parent, childOpts) {
  if (!parent || typeof parent !== 'object') throw new TypeError('parent must be a DNA object');
  const o = childOpts || {};
  const childId = o.id != null ? String(o.id) : genId((parent.genealogy.generation || 0) + 1);
  const childSkills = (parent.skills || []).map(s => Object.assign({}, s));
  if (isArr(o.skills)) {
    for (const ns of o.skills) {
      const norm = normalizeSkill(ns);
      if (!norm) continue;
      const existing = childSkills.find(s => s.skill === norm.skill);
      if (existing) existing.level = clampReputation(existing.level + norm.level);
      else childSkills.push(norm);
    }
  }
  return {
    id: childId,
    robotType: o.robotType || parent.robotType,
    skills: childSkills,
    reputation: 0,
    jobsCompleted: 0,
    walletAddress: parent.walletAddress != null ? parent.walletAddress : null,
    hardwareConfig: Object.assign({}, parent.hardwareConfig || {}, o.hardwareConfig || {}),
    learningLog: [],
    genealogy: { parentRef: parent.id, generation: (parent.genealogy.generation || 0) + 1 },
    createdAt: o.createdAt != null ? String(o.createdAt) : null,
  };
}

// ---- mutate: apply a documented improvement capsule to a DNA ----
// capsule = { skill, levelDelta, hardwareOverride, learningLesson }
// - skill + levelDelta adjust the matching skill (or add it); clamped to [0,100]
// - hardwareOverride merges into hardwareConfig (additive)
// - learningLesson is appended to learningLog with confidence = levelDelta (capped)
// Mutations are deterministic: passing the same capsule twice has bounded effect
// (level curves toward 100, never doubles additively beyond the cap).
function mutate(dna, capsule) {
  if (!dna || typeof dna !== 'object') throw new TypeError('dna must be a DNA object');
  if (!capsule || typeof capsule !== 'object') throw new TypeError('capsule must be an object');
  const out = {
    id: dna.id,
    robotType: dna.robotType,
    skills: (dna.skills || []).map(s => Object.assign({}, s)),
    reputation: dna.reputation,
    jobsCompleted: dna.jobsCompleted,
    walletAddress: dna.walletAddress != null ? dna.walletAddress : null,
    hardwareConfig: Object.assign({}, dna.hardwareConfig || {}),
    learningLog: (dna.learningLog || []).map(l => Object.assign({}, l)),
    genealogy: Object.assign({}, dna.genealogy || {}),
    createdAt: dna.createdAt,
  };
  if (isStr(capsule.skill)) {
    const existing = out.skills.find(s => s.skill === capsule.skill);
    const delta = isNum(capsule.levelDelta) ? capsule.levelDelta : 0;
    if (existing) existing.level = clampReputation(existing.level + delta);
    else out.skills.push({ skill: capsule.skill, level: clampReputation(delta) });
  }
  if (capsule.hardwareOverride && typeof capsule.hardwareOverride === 'object') {
    Object.assign(out.hardwareConfig, capsule.hardwareOverride);
  }
  if (isStr(capsule.learningLesson)) {
    const conf = isNum(capsule.learningConfidence) ? clampReputation(capsule.learningConfidence)
               : (capsule.levelDelta != null ? clampReputation(capsule.levelDelta) : 50);
    out.learningLog.push({ lesson: capsule.learningLesson, confidence: conf, ts: capsule.ts == null ? null : String(capsule.ts) });
  }
  return out;
}

// ---- genealogyTree: build + traverse the parent->children ancestor tree ----
// Records: array of DNA objects. Returns { rootIds, nodes } where nodes is a map
// `recordId -> childrenIds[]`. Roots are records whose parentRef is null or whose
// parentRef does not match any record id (orphan-safe). Bounded traversal; no mutation.
function genealogyTree(records) {
  if (!isArr(records)) throw new TypeError('records must be an array');
  const byId = new Map();
  const childrenOf = new Map();
  for (const r of records) {
    if (!r || !isStr(r.id)) throw new TypeError('each record must have a string id');
    if (byId.has(r.id)) throw new Error('duplicate DNA id: ' + r.id);
    byId.set(r.id, r);
  }
  const rootIds = [];
  for (const r of records) {
    const parentRef = r.genealogy && r.genealogy.parentRef;
    if (parentRef == null || !byId.has(parentRef)) {
      rootIds.push(r.id);
    } else {
      if (!childrenOf.has(parentRef)) childrenOf.set(parentRef, []);
      childrenOf.get(parentRef).push(r.id);
    }
  }
  const nodes = new Map(); // id -> sorted childrenId array
  for (const id of byId.keys()) {
    nodes.set(id, (childrenOf.get(id) || []).slice().sort());
  }
  // deterministic ordering of roots
  rootIds.sort();
  return { rootIds, nodes };
}

// Convenience: depth-first summary (id -> generation, parent) for a deterministic report.
function genealogySummary(records) {
  const { rootIds, nodes } = genealogyTree(records);
  const byId = new Map(records.map(r => [r.id, r]));
  const out = [];
  function walk(id, depth) {
    const r = byId.get(id);
    out.push({ id, depth, generation: r && r.genealogy ? r.genealogy.generation : null, children: nodes.get(id).length });
    for (const childId of nodes.get(id)) walk(childId, depth + 1);
  }
  for (const root of rootIds) walk(root, 0);
  return out;
}

module.exports = {
  ROBOT_TYPES,
  DNA_FIELDS,
  REPUTATION_MIN,
  REPUTATION_MAX,
  createDNA,
  readDNA,
  inheritance,
  mutate,
  genealogyTree,
  genealogySummary,
};
