'use strict';
// Pure-JS self-replication-kit helpers for MyZubster-Robot issue #73 (Auto-
// replicazione: robot che costruisce copie di sé). Extracted so the modular
// part registry, assembly-sequence planning, clonable-firmware manifest, and the
// self-replication controller state machine are unit-testable without ESP32
// hardware. All pure integer/string math, no I/O, no network, no real flash,
// no crypto - same safe-harbor scope as the #71 eco, #74 agri, #78 mother-robot,
// and #85 energy kits.

const DEFAULTS = {
  // Modular part types referenced by issue #73 task list.
  requiredModules: [
    'chassis', 'motor', 'wheel', 'controller', 'sensor',
  ],
  // Socket vocabulary: a part "plugs" into a part that exposes the matching "socket".
  socketVocab: ['M3', 'DIN-rail', 'USB-C', 'GPIO-header', 'snap-fit', 'magnetic'],
  // BOM budget envelope for one replication build (informational).
  bomBudgetEur: 250,
  // Default copy target: how many of each module a complete self-copy needs.
  copyComposition: {
    chassis: 1, motor: 2, wheel: 2, controller: 1, sensor: 3,
  },
};

function optWith(opts) { return Object.assign({}, DEFAULTS, opts || {}); }

// ---------------------------------------------------------------------------
// modularPartRegistry(parts)
// Register a catalog of interchangeable modular parts (telaio intercambiabile,
// motori, ruote, scheda madre ESP32, sensori modulari). Each part declares the
// sockets it exposes and the plugs it accepts so compatibility is auditable.
// Returns the catalog grouped by type + a per-type inventory count.
// ---------------------------------------------------------------------------
function modularPartRegistry(parts, opts) {
  const cfg = optWith(opts);
  if (!Array.isArray(parts)) throw new Error('parts must be an array');
  const catalog = [];
  const byType = {};
  for (const p of parts) {
    if (!p || typeof p !== 'object') throw new Error('each part must be an object');
    const id = String(p.id || '').trim();
    const type = String(p.type || '').trim();
    if (!id || !type) throw new Error('part missing id or type');
    if (!cfg.requiredModules.includes(type) && !cfg.socketVocab.includes(type)) {
      // allow custom types but flag them as non-standard
    }
    const entry = {
      id,
      type,
      variant: String(p.variant || 'std'),
      sockets: Array.isArray(p.sockets) ? p.sockets.slice() : [],
      plugs: Array.isArray(p.plugs) ? p.plugs.slice() : [],
      qty: Math.max(0, Math.floor(Number(p.qty) || 1)),
    };
    catalog.push(entry);
    if (!byType[type]) byType[type] = [];
    byType[type].push(entry);
  }
  // inventory = total available units per type (sum qty)
  const inventory = {};
  for (const type of Object.keys(byType)) {
    inventory[type] = byType[type].reduce((s, e) => s + e.qty, 0);
  }
  return { catalog, byType, inventory, count: catalog.length };
}

// ---------------------------------------------------------------------------
// partCompatibility(a, b)
// Pure check: does part 'a' plug into part 'b' (a's plugs match b's sockets)
// OR does 'b' plug into 'a'. Returns the matched connectors or null.
// ---------------------------------------------------------------------------
function partCompatibility(a, b) {
  if (!a || !b) return null;
  const aIntoB = (a.plugs || []).filter((p) => (b.sockets || []).includes(p));
  if (aIntoB.length > 0) return { direction: 'a->b', connectors: aIntoB };
  const bIntoA = (b.plugs || []).filter((p) => (a.sockets || []).includes(p));
  if (bIntoA.length > 0) return { direction: 'b->a', connectors: bIntoA };
  return null;
}

// ---------------------------------------------------------------------------
// assemblySequencePlanner(parts, target)
// Given an inventory of available parts and a target copy composition, produce
// an ordered list of assembly steps to build one copy of the robot. The planner
// resolves the required modules, verifies every required part is in stock, then
// emits steps in dependency order: pick chassis -> mount motors -> seat wheels
// -> install controller -> plug sensors -> flash firmware -> power-on validate.
// ---------------------------------------------------------------------------
function assemblySequencePlanner(parts, opts) {
  const cfg = optWith(opts);
  const reg = modularPartRegistry(parts, cfg);
  const composition = (opts && opts.copyComposition) || cfg.copyComposition;
  // verify availability for each required module type
  const missing = [];
  for (const type of Object.keys(composition)) {
    const need = composition[type];
    const have = reg.inventory[type] || 0;
    if (have < need) missing.push({ type, need, have, shortage: need - have });
  }
  if (missing.length > 0) {
    return { steps: [], missing, resolvable: false };
  }
  // pick representative part ids per type (first available entry)
  const pickId = (type) => (reg.byType[type] && reg.byType[type][0] && reg.byType[type][0].id) || type;
  const steps = [];
  let seq = 0;
  const push = (action, partId, note) => { steps.push({ seq: ++seq, action, partId, note }); };
  push('pick', pickId('chassis'), 'retrieve interchangeable chassis module from magazine');
  push('mount', pickId('motor'), 'mount motor module 1 onto chassis M3 socket');
  push('mount', pickId('motor'), 'mount motor module 2 onto chassis M3 socket');
  push('seat', pickId('wheel'), 'press-fit wheel 1 onto motor 1 shaft (snap-fit)');
  push('seat', pickId('wheel'), 'press-fit wheel 2 onto motor 2 shaft (snap-fit)');
  push('install', pickId('controller'), 'seat ESP32 motherboard onto GPIO-header + USB-C');
  push('plug', pickId('sensor'), 'connect sensor 1 (magnetic socket)');
  push('plug', pickId('sensor'), 'connect sensor 2 (magnetic socket)');
  push('plug', pickId('sensor'), 'connect sensor 3 (magnetic socket)');
  push('flash', 'firmware-clone', 'write clonable firmware image to spawned ESP32 (docs-only spec, no real signing)');
  push('validate', 'copy', 'power-on self-test: verify module identity + firmware checksum + wheel rotation');
  return { steps, missing: [], resolvable: true, stepCount: steps.length };
}

// ---------------------------------------------------------------------------
// firmwareCloneSpec(manifest)
// Build a documentation-only clonable-firmware manifest. The "checksum" is a
// deterministic reference hash of the image name + size (NOT a real signing or
// crypto operation - it is a plain string fold so the manifest is reproducible
// and auditable without any key material). Returns the images, flash plan, and
// a structured clone payload describing what a child robot receives.
// ---------------------------------------------------------------------------
function firmwareCloneSpec(manifest) {
  if (!manifest || !Array.isArray(manifest.images)) throw new Error('manifest.images required');
  const images = [];
  const flashPlan = [];
  for (const img of manifest.images) {
    const name = String(img.name || '');
    const sizeBytes = Math.max(0, Math.floor(Number(img.size) || 0));
    const version = String(img.version || '0.1.0');
    // deterministic reference checksum - NOT a cryptographic hash, a simple fold
    // of the image identity so the manifest is reproducible for audit purposes.
    let h = 5381;
    const seed = name + ':' + version + ':' + sizeBytes;
    for (let i = 0; i < seed.length; i++) { h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0; }
    const refChecksum = ('ref-' + h.toString(16).padStart(8, '0'));
    images.push({ name, version, sizeBytes, checksumAlgo: 'reference-fold-djb2', checksum: refChecksum, targetSlot: img.targetSlot || 'main' });
    flashPlan.push({ image: name, slot: img.targetSlot || 'main', order: flashPlan.length + 1 });
  }
  const parentVersion = String(manifest.parentVersion || '0.1.0');
  const clonePayload = {
    parentVersion,
    targetBoard: String(manifest.targetBoard || 'ESP32-DevKit'),
    imageCount: images.length,
    totalSizeBytes: images.reduce((s, i) => s + i.sizeBytes, 0),
    flashSequence: flashPlan,
  };
  return { images, flashPlan, clonePayload, cloneable: images.length > 0, docsOnly: true };
}

// ---------------------------------------------------------------------------
// selfReplicationController(state, event)
// Deterministic 7-state FSM driving one replication cycle:
//   IDLE -> SCAN -> VERIFY -> ASSEMBLE -> FLASH -> VALIDATE -> DONE
// any phase can transition to FAULT on a missing-parts / invalid-copy signal.
// Returns the new state + an output record + progress fraction.
// ---------------------------------------------------------------------------
const RP_STATES = ['IDLE', 'SCAN', 'VERIFY', 'ASSEMBLE', 'FLASH', 'VALIDATE', 'DONE', 'FAULT'];
const RP_PHASE_INDEX = { IDLE: 0, SCAN: 1, VERIFY: 2, ASSEMBLE: 3, FLASH: 4, VALIDATE: 5, DONE: 6, FAULT: 6 };

function selfReplicationController(input) {
  const state = (input && input.state) || 'IDLE';
  const event = (input && input.event) || 'tick';
  const ctx = (input && input.context) || {};
  if (!RP_STATES.includes(state)) throw new Error('invalid state ' + state);
  let next = state, out = {}, progress = RP_PHASE_INDEX[state] / 6;
  switch (state) {
    case 'IDLE':
      if (event === 'start') { next = 'SCAN'; out = { scanned: true, inventory: ctx.inventory || {} }; }
      break;
    case 'SCAN':
      if (event === 'partsFound') { next = 'VERIFY'; out = { verifying: true }; }
      else if (event === 'scanEmpty') { next = 'FAULT'; out = { reason: 'no parts detected', missing: ctx.missing || [] }; }
      break;
    case 'VERIFY':
      if (event === 'partsComplete') { next = 'ASSEMBLE'; out = { assemblyStart: true, steps: ctx.steps || [] }; }
      else if (event === 'partsMissing') { next = 'FAULT'; out = { reason: 'missing required modules', missing: ctx.missing || [] }; }
      break;
    case 'ASSEMBLE':
      if (event === 'sequenceComplete') { next = 'FLASH'; out = { cloning: true, spec: ctx.spec || {} }; }
      else if (event === 'assemblyFault') { next = 'FAULT'; out = { reason: 'assembly step failed', step: ctx.failedStep }; }
      break;
    case 'FLASH':
      if (event === 'flashDone') { next = 'VALIDATE'; out = { validating: true }; }
      else if (event === 'flashError') { next = 'FAULT'; out = { reason: 'firmware write failed' }; }
      break;
    case 'VALIDATE':
      if (event === 'copyValid') { next = 'DONE'; out = { replicationComplete: true, copies: (ctx.copies || 0) + 1 }; }
      else if (event === 'copyInvalid') { next = 'FAULT'; out = { reason: 'copy validation mismatch', differences: ctx.differences || [] }; }
      break;
    case 'DONE':
      if (event === 'reset') { next = 'IDLE'; out = { reset: true }; }
      break;
    case 'FAULT':
      if (event === 'reset') { next = 'IDLE'; out = { reset: true }; }
      break;
  }
  progress = RP_PHASE_INDEX[next] / 6;
  return { state: next, output: out, progress: Math.round(progress * 100) / 100 };
}

// ---------------------------------------------------------------------------
// replicationProgressTracker(steps, completedCount)
// Map completed steps to a progress fraction + current phase label.
// ---------------------------------------------------------------------------
function replicationProgressTracker(steps, completedCount) {
  const total = Array.isArray(steps) ? steps.length : Math.max(0, Math.floor(steps) || 0);
  const completed = Math.max(0, Math.min(total, Math.floor(completedCount) || 0));
  const remaining = total - completed;
  const remainingSteps = Array.isArray(steps) ? steps.slice(completed) : [];
  let phase = 'idle';
  if (total > 0) {
    const pct = completed / total;
    if (pct <= 0.0) phase = 'idle';
    else if (pct <= 0.15) phase = 'pick';
    else if (pct <= 0.45) phase = 'mount';
    else if (pct <= 0.55) phase = 'install';
    else if (pct <= 0.78) phase = 'plug';
    else if (pct <= 0.88) phase = 'flash';
    else if (pct < 1.0) phase = 'validate';
    else phase = 'done';
  }
  return {
    completed, total, remaining, remainingSteps,
    pct: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
    phase,
    complete: completed >= total && total > 0,
  };
}

// ---------------------------------------------------------------------------
// replicationValidator(copy, original)
// Compare a finished copy against the original robot composition. Deterministic
// difference report - no hardware sensing required.
// ---------------------------------------------------------------------------
function replicationValidator(copy, original) {
  const cComp = (copy && copy.composition) || {};
  const oComp = (original && original.composition) || {};
  const allTypes = Array.from(new Set(Object.keys(cComp).concat(Object.keys(oComp))));
  const differences = [];
  let match = true;
  for (const type of allTypes) {
    const c = cComp[type] || 0;
    const o = oComp[type] || 0;
    if (c !== o) { match = false; differences.push({ type, original: o, copy: c, delta: c - o }); }
  }
  const fwMatch = String((copy && copy.firmwareVersion) || '') === String((original && copy && original.firmwareVersion) || '');
  if (!fwMatch && original && original.firmwareVersion) { match = false; differences.push({ type: 'firmware', original: original.firmwareVersion, copy: copy && copy.firmwareVersion, delta: 'version' }); }
  return { match, differences, copyComplete: match && differences.length === 0 };
}

module.exports = {
  DEFAULTS,
  modularPartRegistry,
  partCompatibility,
  assemblySequencePlanner,
  firmwareCloneSpec,
  selfReplicationController,
  replicationProgressTracker,
  replicationValidator,
  RP_STATES,
};
