'use strict';
// Pure-JS agriculture-kit helpers for MyZubster-Robot issue #74 (water-saving
// irrigation robot). Extracted from firmware/firmware.ino so the moisture / valve /
// energy decisions are unit-testable. All integer/float math, no I/O, no network, no
// crypto - matches the safe-harbor scope of the #71 eco kit and the #75 DIY kit.

const DEFAULTS = {
  dryThreshold: 30,        // moisture % strictly below => irrigate
  wetThreshold: 60,        // moisture % at/above => soil is "OK"; documented band edge
  dryRaw: 3500,            // raw 12-bit ADC when soil is bone dry (cap sensor reads HIGH voltage when dry)
  wetRaw: 1300,            // raw 12-bit ADC when soil is saturated (LOW voltage when wet)
  maxValveDurationMs: 60_000,  // cap one irrigate cycle to 60 s so a flood never happens from one tick
  perPercentMs: 1_000,        // 1 s / pct-of-deficit at default discharge (rainFactor 1)
  rainFactor: 0.5,            // rain-expected forecast halves valve duration
  valveOffDelayMs: 60_000,    // recommended soak delay between consecutive cycles (docs suggest)
};

function optWith(opt) { return Object.assign({}, DEFAULTS, opt || {}); }

// Convert a raw 12-bit ADC reading from a capacitive soil-moisture sensor into a
// moisture percentage 0-100. Capacitive sensors are inverted: higher voltage = drier
// soil, lower voltage = wetter soil, so the formula maps dryRaw -> 0% and wetRaw -> 100%.
// Readings outside the calibrated band are clamped - callibrate dryRaw/wetRaw for your soil.
function moistureToPercent(rawAdc, opt) {
  const o = optWith(opt);
  if (!Number.isFinite(rawAdc)) throw new TypeError('rawAdc must be a finite number');
  if (rawAdc >= o.dryRaw) return 0;
  if (rawAdc <= o.wetRaw) return 100;
  return Math.round(((o.dryRaw - rawAdc) / (o.dryRaw - o.wetRaw)) * 100);
}

// Weather factor applied to irrigation duration. `forecast` is a local input supplied
// by an integrator (see docs/weather-integration.md); in this PR it is a documented
// no-op stub. rainExpected=true => rainFactor (default 0.5). Otherwise => 1.0.
function weatherFactor(forecast, opt) {
  if (forecast && forecast.rainExpected) {
    const o = optWith(opt);
    return o.rainFactor;
  }
  return 1.0;
}

// Irrigation decision: 'irrigate' if soil is below the dry threshold, otherwise 'wait'.
// The wet threshold is documented separately (hysteresis: once soil reaches wetThreshold,
// decideIrrigation already returns 'wait' all the way down to dryThreshold, so the valve
// stays shut through the full post-rain soak band).
function decideIrrigation(moisturePct, forecast, opt) {
  const o = optWith(opt);
  if (moisturePct < o.dryThreshold) return 'irrigate';
  return 'wait';
}

// Valve actuation command derived from the moisture reading + weather forecast.
// Returns { open, duration_ms, decision, moisture_pct, rainFactor }.
// duration_ms = deficit (dryThreshold - moisturePct) * perPercentMs * rainFactor,
// capped to maxValveDurationMs.
function valveControl(moisturePct, forecast, opt) {
  const o = optWith(opt);
  const decision = decideIrrigation(moisturePct, forecast, o);
  if (decision !== 'irrigate') {
    return { open: false, duration_ms: 0, decision, moisture_pct: moisturePct, rainFactor: 1.0 };
  }
  const factor = weatherFactor(forecast, o);
  const deficit = o.dryThreshold - moisturePct;  // positive
  let duration = Math.round(deficit * o.perPercentMs * factor);
  if (duration > o.maxValveDurationMs) duration = o.maxValveDurationMs;
  if (duration < 0) duration = 0;
  return { open: true, duration_ms: duration, decision, moisture_pct: moisturePct, rainFactor: factor };
}

// Energy accumulation from current-sense samples (matches #71 eco.js formula).
// sample = { voltage_mV, current_mA, duration_ms }.
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

module.exports = {
  DEFAULTS,
  moistureToPercent,
  weatherFactor,
  decideIrrigation,
  valveControl,
  accumulateEnergy,
};
