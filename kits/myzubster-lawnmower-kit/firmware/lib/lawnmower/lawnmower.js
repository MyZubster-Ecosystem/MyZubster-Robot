'use strict';
// Pure-JS modular-lawnmower-kit helpers for MyZubster-Robot issue #70 (Tagliaerba
// modulare sotto 200 EUR). Extracted out so the differential-drive steering, motor
// speed PI, obstacle/tilt safety, cutting-deck ramp, BOM budget validation, and
// x402 payment integration decisions are unit-testable without ESP32 hardware.
// All pure integer/float math, no I/O, no network, no crypto - same safe-harbor
// scope as the #71 eco, #74 agri, #76 garden, and #85 energy kits.

const DEFAULTS = {
  // Differential drive (skid-steer 4-wheel chassis)
  wheelbaseMm: 220,             // distance between left/right wheel pairs (skid steer)
  maxDriveDutyPct: 100,          // PWM duty cycle ceiling at full turn request
  headingDeadbandDeg: 2.0,       // below this heading error -> drive straight
  // Motor speed PI controller (per wheel)
  speedKp: 0.18,                 // proportional gain (dutyCyclePct / (cm/s error))
  speedKi: 0.010,                // integral gain
  speedIntegralMax: 60,          // anti-windup clamp on the integral term (duty %)
  dutySaturatePct: 100,          // PWM duty ceiling
  // Obstacle / tilt safety interlock
  obstacleStopMm: 150,           // stop drive motors when obstacle closer than this
  obstacleCautionMm: 400,        // slow drive beyond this boundary
  tiltStopDeckDeg: 25,           // stop the cutting blade when chassis tilt exceeds this
  // Cutting deck controller
  bladeMaxRpm: 3200,             // brushless blade motor ceiling
  bladeRampRpmPerSec: 600,       // max spin-up / spin-down rate
  bladeIdleRpm: 0,                // parkedbladeRpm floor
  // BOM budget validator
  bomBudgetEur: 200,              // the <200 EUR envelope from the issue
  requiredCategories: [
    'motors', 'cutting', 'controller', 'sensors', 'battery', 'chassis',
  ],
};

function optWith(opt) { return Object.assign({}, DEFAULTS, opt || {}); }

// --- BOM budget validator ---
// Accept a list of components { category, name, priceEur } and verify the total
// stays under the <200 EUR envelope laid out by issue #70. Returns a structured
// report instead of just a boolean so the operator can see what is missing or
// over budget. Duplicate categories are summed; negative prices throw.
function bomBudgetValidator(items, opt) {
  const o = optWith(opt);
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  if (items.length === 0) throw new RangeError('items must not be empty');
  const report = {
    totalEur: 0,
    count: items.length,
    byCategory: {},
    mostExpensive: null,
    cheapest: null,
    missingCategories: [],
    overBudget: false,
    valid: false,
  };
  for (const it of items) {
    if (!it || typeof it !== 'object') throw new TypeError('each item must be an object');
    const cat = String(it.category || '');
    const name = String(it.name || '');
    const price = Number(it.priceEur);
    if (!cat) throw new TypeError('item.category is required');
    if (!name) throw new TypeError('item.name is required');
    if (!Number.isFinite(price)) throw new TypeError('item.priceEur must be a number');
    if (price < 0) throw new RangeError('item.priceEur must be >= 0');
    report.totalEur += price;
    report.byCategory[cat] = (report.byCategory[cat] || 0) + price;
    if (!report.mostExpensive || price > report.mostExpensive.priceEur) report.mostExpensive = { name, category: cat, priceEur: price };
    if (!report.cheapest || price < report.cheapest.priceEur) report.cheapest = { name, category: cat, priceEur: price };
  }
  report.totalEur = Math.round(report.totalEur * 100) / 100;
  report.overBudget = report.totalEur > o.bomBudgetEur;
  for (const c of o.requiredCategories) {
    if (report.byCategory[c] === undefined) report.missingCategories.push(c);
  }
  report.valid = !report.overBudget && report.missingCategories.length === 0;
  return report;
}

// --- Differential-drive steering ---
// Compute left/right motor duty cycles from the heading error (deg) toward a
// target. Inside the deadband the chassis drives straight; outside it turns
// with a differential thattapers from full turn (max error) to straight (zero
// error) using a linear curve, so small corrections are gentle. 'turnDirection'
// is 'left' / 'right' / 'straight' and 'insideDisabled' is true when the wheel
// on the inside of a turn is asked to go backward (zero-out for a mower).
function differentialDrive(headingErrorDeg, opt) {
  const o = optWith(opt);
  if (typeof headingErrorDeg !== 'number' || !Number.isFinite(headingErrorDeg)) {
    throw new TypeError('headingErrorDeg must be a number');
  }
  // Wrap to [-180, 180]
  let err = headingErrorDeg;
  while (err > 180) err -= 360;
  while (err < -180) err += 360;
  const absErr = Math.abs(err);
  const turnDirection = err > o.headingDeadbandDeg ? 'right' :
                       err < -o.headingDeadbandDeg ? 'left' : 'straight';
  if (turnDirection === 'straight') {
    return { leftDuty: o.maxDriveDutyPct, rightDuty: o.maxDriveDutyPct, turnDirection, insideDisabled: false, headingErrorDeg: err };
  }
  // Linear taper: zero error -> straight (0 diff); 90 deg error -> max turn.
  const turnRatio = Math.min(absErr / 90, 1);
  const diff = turnRatio * o.maxDriveDutyPct;
  const base = o.maxDriveDutyPct - diff / 2;
  let leftDuty, rightDuty, insideDisabled;
  if (turnDirection === 'right') {
    leftDuty = base + diff / 2;
    rightDuty = base - diff / 2;
    insideDisabled = rightDuty <= 0;
    if (insideDisabled) rightDuty = 0;
  } else {
    rightDuty = base + diff / 2;
    leftDuty = base - diff / 2;
    insideDisabled = leftDuty <= 0;
    if (insideDisabled) leftDuty = 0;
  }
  leftDuty = Math.max(0, Math.min(o.maxDriveDutyPct, Math.round(leftDuty)));
  rightDuty = Math.max(0, Math.min(o.maxDriveDutyPct, Math.round(rightDuty)));
  return { leftDuty, rightDuty, turnDirection, insideDisabled, headingErrorDeg: err };
}

// --- Motor speed PI controller ---
// Per-wheel PI loop: returns the duty cycle % demanded for the next tick and
// the updated integral accumulator. Persist 'integral' across ticks in the
// caller; this helper is pure so the same inputs always produce the same
// output and integrate statelessness is the caller's responsibility.
function motorSpeedController(targetCmPerSec, measuredCmPerSec, integral, opt) {
  const o = optWith(opt);
  if (typeof targetCmPerSec !== 'number' || !Number.isFinite(targetCmPerSec)) {
    throw new TypeError('targetCmPerSec must be a number');
  }
  if (typeof measuredCmPerSec !== 'number' || !Number.isFinite(measuredCmPerSec)) {
    throw new TypeError('measuredCmPerSec must be a number');
  }
  const integ = Number.isFinite(integral) ? integral : 0;
  if (integ < -o.speedIntegralMax * 4 || integ > o.speedIntegralMax * 4) {
    throw new RangeError('integral accumulator out of plausible range');
  }
  const error = targetCmPerSec - measuredCmPerSec;
  const newIntegral = Math.max(-o.speedIntegralMax, Math.min(o.speedIntegralMax, integ + error));
  const clamped = newIntegral === integ; // true if anti-windup clamped (i.e. would have grown further)
  const raw = o.speedKp * error + o.speedKi * newIntegral;
  const dutyCyclePct = Math.max(-o.dutySaturatePct, Math.min(o.dutySaturatePct, raw));
  return { dutyCyclePct: Math.round(dutyCyclePct * 100) / 100, error: Math.round(error * 100) / 100, integral: Math.round(newIntegral * 1000) / 1000, antiWindupActive: clamped && Math.abs(newIntegral) >= o.speedIntegralMax - 1e-6 };
}

// --- Obstacle / tilt safety interlock ---
// Combine a forward-looking proximity reading (mm) and a chassis tilt (deg)
// to decide whether the drive motors may move and whether the cutting blade
// may spin. Returns the reason string when either axis is disarmed so the
// caller can log the interlock cause deterministically.
function obstacleGuard(proximityMm, tiltDeg, opt) {
  const o = optWith(opt);
  if (typeof proximityMm !== 'number' || !Number.isFinite(proximityMm)) {
    throw new TypeError('proximityMm must be a number');
  }
  if (typeof tiltDeg !== 'number' || !Number.isFinite(tiltDeg)) {
    throw new TypeError('tiltDeg must be a number');
  }
  const absTilt = Math.abs(tiltDeg);
  const motorAllowed = proximityMm >= o.obstacleStopMm && absTilt < o.tiltStopDeckDeg;
  const bladeAllowed = absTilt < o.tiltStopDeckDeg && proximityMm >= o.obstacleStopMm;
  let speed = 'normal';
  if (proximityMm < o.obstacleStopMm) speed = 'stop';
  else if (proximityMm < o.obstacleCautionMm) speed = 'caution';
  else if (absTilt >= o.tiltStopDeckDeg) speed = 'stop';
  const reasons = [];
  if (proximityMm < o.obstacleStopMm) reasons.push('obstacle_too_close');
  else if (proximityMm < o.obstacleCautionMm) reasons.push('obstacle_close');
  if (absTilt >= o.tiltStopDeckDeg) reasons.push('tilt_excessive');
  return { motorAllowed, bladeAllowed, speed, reasons: reasons.join(',') || 'clear' };
}

// --- Cutting deck controller ---
// Convert a target blade RPM into a duty cycle % while honouring the spin-up /
// spin-down ramp. 'currentRpm' is the blade motor state at the start of the
// tick; the returned 'nextRpm' is what the firmware should command for the
// next tick so a too-large jump is split across ticks.
function cuttingDeckController(bladeRpmTarget, currentRpm, opt) {
  const o = optWith(opt);
  if (typeof bladeRpmTarget !== 'number' || !Number.isFinite(bladeRpmTarget)) {
    throw new TypeError('bladeRpmTarget must be a number');
  }
  if (typeof currentRpm !== 'number' || !Number.isFinite(currentRpm)) {
    throw new TypeError('currentRpm must be a number');
  }
  if (bladeRpmTarget < o.bladeIdleRpm) throw new RangeError('bladeRpmTarget must be >= idle floor');
  if (bladeRpmTarget > o.bladeMaxRpm) bladeRpmTarget = o.bladeMaxRpm;
  if (currentRpm < 0) currentRpm = 0;
  if (currentRpm > o.bladeMaxRpm) currentRpm = o.bladeMaxRpm;
  let delta = bladeRpmTarget - currentRpm;
  const caps = o.bladeRampRpmPerSec;
  if (delta > caps) delta = caps;
  if (delta < -caps) delta = -caps;
  const nextRpm = currentRpm + delta;
  const dutyPct = Math.round((nextRpm / o.bladeMaxRpm) * 100);
  return { nextRpm: Math.max(0, Math.round(nextRpm)), dutyPct, ramped: Math.abs(delta) === o.bladeRampRpmPerSec };
}

// --- x402 payment protocol spec (documentation only) ---
// Returns the protocol specification (states, transitions, data fields) so the
// MyZubster gateway integration can be documented in firmware without any real
// Monero signing or transfer. This is the same docs-only pattern used by the
// #85 energy kit and #76 garden kit.
function x402PaymentSpec(opt) {
  const o = optWith(opt);
  let paymentEur = o.suggestedPaymentEur;
  if (paymentEur === undefined) paymentEur = 0.5;
  return {
    protocol: 'x402',
    description: 'HTTP 402 machine-payable payment flow. Documentation-only spec; the'
      + ' firmware omits real wallet signing, Monero transfer, key material, and network calls.',
    suggestedPaymentEur: Number(paymentEur),
    states: ['idle', 'quote_requested', 'quoted', 'paying', 'paid', 'released', 'refunded'],
    transitions: [
      { from: 'idle', event: 'request_quote', to: 'quote_requested' },
      { from: 'quote_requested', event: 'gateway_returns_quote', to: 'quoted' },
      { from: 'quoted', event: 'client_initiates_payment', to: 'paying' },
      { from: 'paying', event: 'gateway_confirms_payment', to: 'paid' },
      { from: 'paid', event: 'work_completed', to: 'released' },
      { from: 'paying', event: 'gateway_timeout', to: 'refunded' },
    ],
    dataFields: ['invoice_id', 'amount_xmr', 'amount_eur', 'payment_address', 'txid', 'expires_at'],
    safetyNote: 'No wallet signing, no Monero broadcast, no key generation. The spec data fields are informational placeholders only.',
  };
}

// --- Mowing mission orchestrator ---
// Build a deterministic 5-phase mowing sequence for a rectangular garden:
// standby -> start -> mow (with row count from width/swath) -> pause -> park.
// The x402 spec is referenced (not executed) so the integration is documented.
function mowingMission(garden, opt) {
  const o = optWith(opt);
  if (!garden || typeof garden !== 'object') throw new TypeError('garden must be an object');
  const w = Number(garden.widthM);
  const h = Number(garden.heightM);
  if (!Number.isFinite(w) || !Number.isFinite(h)) throw new TypeError('garden.widthM/heightM must be numbers');
  if (w <= 0 || h <= 0) throw new RangeError('garden dimensions must be positive');
  const swath = Number(garden.swathM) || 0.22;
  if (swath <= 0) throw new RangeError('swathM must be positive');
  const rows = Math.max(1, Math.ceil(w / swath));
  const phases = [
    { phase: 'standby', action: 'arm_safety_interlock', summary: 'obstacle + tilt interlocks armed; blade idle' },
    { phase: 'start', action: 'deploy_cutting_deck', summary: `blade ramps from 0 to ${o.bladeMaxRpm} rpm (${o.bladeRampRpmPerSec} rpm/s)` },
    { phase: 'mow', action: `mow_${rows}_rows`, summary: `${rows} boustrophedon rows across ${w}m x ${h}m @ ${swath}m swath` },
    { phase: 'pause', action: 'release_cutting_deck', summary: 'blade ramps to 0; motors idle' },
    { phase: 'park', action: 'x402_settle_documentation_only', summary: 'x402 spec referenced (no real Monero signing) - returned to dock' },
  ];
  return { phases, rowCount: rows, garden: { widthM: w, heightM: h, swathM: swath }, x402: x402PaymentSpec(opt) };
}

module.exports = {
  DEFAULTS,
  bomBudgetValidator,
  differentialDrive,
  motorSpeedController,
  obstacleGuard,
  cuttingDeckController,
  x402PaymentSpec,
  mowingMission,
};
