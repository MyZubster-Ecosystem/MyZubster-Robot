'use strict';
// Pure-JS eco-mode helpers for MyZubster-Robot issue #71 (energy-saving mode).
// Extracted from firmware/firmware.ino so the sleep/motor/energy decisions are
// unit-testable. All integer/float math, no I/O, no network, no crypto.

const DEFAULTS = {
  lightMs: 10_000,      // enter light sleep after 10 s inactivity
  deepMs: 60_000,      // enter deep sleep after 60 s inactivity
  motorIdleMs: 3_000,  // standby motors after 3 s inactivity
  rampSteps: 8,        // default motor ramp-down ladder length
  floor: 0,
};

function optWith(opt, base) {
  return Object.assign({}, base, opt || {});
}

// CPU sleep decision from an inactivity duration (ms).
// Returns 'active' | 'light' | 'deep'.
function decideSleep(inactivityMs, opt) {
  const o = optWith(opt, { lightMs: DEFAULTS.lightMs, deepMs: DEFAULTS.deepMs });
  if (inactivityMs >= o.deepMs) return 'deep';
  if (inactivityMs >= o.lightMs) return 'light';
  return 'active';
}

// Motor standby decision from an inactivity duration (ms).
// Returns true when the motors should ramp down and the driver EN pulled low.
function motorStandby(inactivityMs, opt) {
  const o = optWith(opt, { motorIdleMs: DEFAULTS.motorIdleMs });
  return inactivityMs >= o.motorIdleMs;
}

// Linear duty-cycle ramp-down ladder from `fromDuty` to `floor` over `steps` values.
// `opt` may be a floor number (rampDown(255, 5, 0)) or an options object.
// rampDown(255, 5, 0) -> [255, 191, 128, 64, 0]
function rampDown(fromDuty, steps, opt) {
  const o = (typeof opt === 'number')
    ? { rampSteps: DEFAULTS.rampSteps, floor: opt }
    : optWith(opt, { rampSteps: DEFAULTS.rampSteps, floor: DEFAULTS.floor });
  const n = Math.max(2, steps || o.rampSteps);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(Math.round(fromDuty - (i * (fromDuty - o.floor)) / (n - 1)));
  }
  return out;
}

// Energy accumulation from current-sense samples.
// sample = { voltage_mV, current_mA, duration_ms }.
// Returns { totalMicroJoules (int), totalMilliWattHours (float) }.
// uJ per sample = (mV * mA * ms) / 1000 ; mWh = uJ / 3_600_000.
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

// Convenience wrapper.
function totalMilliWattHours(samples) {
  return accumulateEnergy(samples).totalMilliWattHours;
}

module.exports = { DEFAULTS, decideSleep, motorStandby, rampDown, accumulateEnergy, totalMilliWattHours };
