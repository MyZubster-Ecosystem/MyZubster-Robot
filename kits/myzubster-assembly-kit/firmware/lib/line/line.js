'use strict';
// Pure-JS assembly-line-kit helpers for MyZubster-Robot issue #80 (catena di
// montaggio robotica). Extracted from firmware/firmware.ino so the line
// scheduler, station state machine, WIP tracker, throughput estimator, quality
// gate, and line balancer decisions are unit-testable. All pure integer/float
// math, no I/O, no network, no crypto - matches the safe-harbor scope of the
// #71 eco, #74 agri, #75 DIY, #76 garden, #77 seed, and #78 mother kits.

const DEFAULTS = {
  // Assembly stations
  stationCount: 6,               // 6 phases: pick -> chassis -> board -> motors -> flash -> register
  stationCycleMs: 5000,         // default time per station cycle (ms)
  // Conveyor
  conveyorStepsPerSeg: 200,     // stepper steps to advance one conveyor segment
  // Quality gate
  checklistTimeoutMs: 30000,    // max time a station can take before quality gate times out
  // Throughput
  targetUnitsPerHour: 12,       // target production rate
  // Energy (same formula as all kits)
};

function optWith(opt) { return Object.assign({}, DEFAULTS, opt || {}); }

// --- Assembly line sequence (6-phase from the issue) ---
// Phases: pick, chassis, board, motors, flash, register
// Each phase produces an ordered command for the assembly line.
function assemblyLineSequence(opt) {
  const o = optWith(opt);
  const phases = ['pick', 'chassis', 'board', 'motors', 'flash', 'register'];
  const steps = [];
  steps.push({ op: 'line_init', stationCount: o.stationCount, phases });
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    steps.push({ op: 'station_enter', station: i + 1, phase, cycleMs: o.stationCycleMs });
    steps.push({ op: 'execute', station: i + 1, phase, arm: stationArmControl(i + 1, phase, o) });
    steps.push({ op: 'quality', station: i + 1, phase, checks: stationChecks(phase) });
    steps.push({ op: 'conveyor_advance', station: i + 1, steps: o.conveyorStepsPerSeg });
    steps.push({ op: 'station_exit', station: i + 1, phase });
  }
  steps.push({ op: 'line_complete', units: 1, phases: phases.length });
  return steps;
}

// --- Station arm control ---
// Each station uses the mechanical arm differently based on its phase.
function stationArmControl(stationId, phase, opt) {
  const o = optWith(opt);
  if (typeof stationId !== 'number') throw new TypeError('stationId must be a number');
  if (typeof phase !== 'string') throw new TypeError('phase must be a string');
  const armActions = {
    pick:     { action: 'grip_lift', gripper: 'close', lift_mm: 40, rotate_deg: 0 },
    chassis:  { action: 'position_held', gripper: 'hold', lift_mm: 20, rotate_deg: 0 },
    board:    { action: 'insert_down', gripper: 'open', lift_mm: 5, rotate_deg: 0 },
    motors:   { action: 'connect', gripper: 'close', lift_mm: 10, rotate_deg: 45 },
    flash:    { action: 'dock', gripper: 'open', lift_mm: 0, rotate_deg: 0 },
    register: { action: 'scan', gripper: 'open', lift_mm: 30, rotate_deg: 90 },
  };
  const entry = armActions[phase];
  if (!entry) return { action: 'idle', gripper: 'open', lift_mm: 0, rotate_deg: 0 };
  return { station: stationId, phase, ...entry };
}

// --- Station quality checks ---
// Each station has a different set of quality checks based on its phase.
function stationChecks(phase) {
  if (typeof phase !== 'string') throw new TypeError('phase must be a string');
  const checks = {
    pick:     ['component_present', 'grip_secure'],
    chassis:  ['frame_aligned', 'screws_tight'],
    board:    ['esp32_seated', 'pins_aligned'],
    motors:   ['motor_direction', 'wheel_rotation'],
    flash:    ['firmware_checksum', 'boot_response'],
    register: ['id_assigned', 'schema_valid'],
  };
  return checks[phase] || [];
}

// --- Quality gate verifier ---
// Given a set of check results (pass/fail), determine if the station passes.
function qualityGate(checkResults, opt) {
  const o = optWith(opt);
  if (!Array.isArray(checkResults)) throw new TypeError('checkResults must be an array');
  if (checkResults.length === 0) return { pass: true, failures: [] };
  const failures = checkResults.filter(c => c && c.result === 'fail' && !c.optional);
  // timeout check: if any non-optional check took too long
  const timedOut = checkResults.filter(c => c && c.durationMs > o.checklistTimeoutMs && !c.optional);
  if (timedOut.length > 0) return { pass: false, failures: timedOut.map(c => c.time_check + '_timeout') };
  if (failures.length > 0) return { pass: false, failures: failures.map(c => c.check) };
  return { pass: true, failures: [] };
}

// --- WIP (work-in-progress) tracker ---
// Track how many child robots are at each station in the line.
function wipTracker(action, wipState, stationId, opt) {
  const o = optWith(opt);
  if (!Array.isArray(wipState)) throw new TypeError('wipState must be an array');
  if (typeof stationId !== 'number') throw new TypeError('stationId must be a number');
  if (action === 'enter') {
    if (stationId < 1 || stationId > o.stationCount) throw new RangeError('stationId out of range');
    const newState = [...wipState];
    newState[stationId - 1] = (newState[stationId - 1] || 0) + 1;
    return { state: newState, total: newState.reduce((a, b) => a + b, 0) };
  }
  if (action === 'exit') {
    if (stationId < 1 || stationId > o.stationCount) throw new RangeError('stationId out of range');
    const current = wipState[stationId - 1] || 0;
    if (current === 0) return { state: wipState, total: wipState.reduce((a, b) => a + b, 0), removed: false };
    const newState = [...wipState];
    newState[stationId - 1] = current - 1;
    return { state: newState, total: newState.reduce((a, b) => a + b, 0), removed: true };
  }
  if (action === 'snapshot') {
    return { state: wipState, total: wipState.reduce((a, b) => a + b, 0), perStation: wipState };
  }
  throw new TypeError('action must be enter, exit, or snapshot');
}

// --- Throughput estimator ---
// Given station cycle times, estimate units per hour.
// Throughput = 3600000 / max(stationCycleMs) (bottleneck station determines rate)
function throughputEstimator(stationCycleMs, opt) {
  const o = optWith(opt);
  if (!Array.isArray(stationCycleMs)) throw new TypeError('stationCycleMs must be an array');
  if (stationCycleMs.length === 0) return { unitsPerHour: 0, bottleneckStation: 0, maxCycleMs: 0 };
  let maxIdx = 0;
  let maxVal = 0;
  for (let i = 0; i < stationCycleMs.length; i++) {
    if (typeof stationCycleMs[i] !== 'number') throw new TypeError('each cycle time must be a number');
    if (stationCycleMs[i] > maxVal) { maxVal = stationCycleMs[i]; maxIdx = i; }
  }
  const unitsPerHour = maxVal > 0 ? Math.round(3600000 / maxVal * 100) / 100 : 0;
  return {
    unitsPerHour,
    targetUnitsPerHour: o.targetUnitsPerHour,
    meetsTarget: unitsPerHour >= o.targetUnitsPerHour,
    bottleneckStation: maxIdx + 1,
    maxCycleMs: maxVal,
  };
}

// --- Line balancer ---
// Given station cycle times, suggest which station to rebalance to hit target.
function lineBalancer(stationCycleMs, opt) {
  const o = optWith(opt);
  if (!Array.isArray(stationCycleMs)) throw new TypeError('stationCycleMs must be an array');
  const est = throughputEstimator(stationCycleMs, o);
  if (est.meetsTarget) {
    return { balanced: true, currentRate: est.unitsPerHour, target: o.targetUnitsPerHour, suggestion: 'none' };
  }
  // The bottleneck station needs to be sped up to target rate.
  // targetCycleMs = 3600000 / targetUnitsPerHour
  const targetCycleMs = Math.round(3600000 / o.targetUnitsPerHour);
  return {
    balanced: false,
    currentRate: est.unitsPerHour,
    target: o.targetUnitsPerHour,
    bottleneckStation: est.bottleneckStation,
    maxCycleMs: est.maxCycleMs,
    suggestedCycleMs: targetCycleMs,
    suggestion: 'Reduce station ' + est.bottleneckStation + ' cycle from ' + est.maxCycleMs + 'ms to ' + targetCycleMs + 'ms',
  };
}

// --- Energy accumulation (same formula as all kits) ---
function accumulateEnergy(samples) {
  if (!Array.isArray(samples)) throw new TypeError('samples must be an array');
  let totalMicroJoules = 0;
  for (const s of samples) {
    if (!s || typeof s.voltage_mV !== 'number' || typeof s.current_mA !== 'number' || typeof s.duration_ms !== 'number') {
      throw new TypeError('each sample needs numeric voltage_mV, current_mA, duration_ms');
    }
    totalMicroJoules += Math.trunc((s.voltage_mV * s.current_mA * s.duration_ms) / 1000);
  }
  return { totalMicroJoules, totalMilliWattHours: totalMicroJoules / 3_600_000 };
}

module.exports = {
  DEFAULTS,
  assemblyLineSequence,
  stationArmControl,
  stationChecks,
  qualityGate,
  wipTracker,
  throughputEstimator,
  lineBalancer,
  accumulateEnergy,
};
