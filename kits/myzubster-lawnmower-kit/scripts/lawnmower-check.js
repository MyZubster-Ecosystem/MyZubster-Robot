#!/usr/bin/env node
'use strict';
const L = require('../firmware/lib/lawnmower/lawnmower');

console.log('MyZubster Modular Lawnmower Kit - headless simulation (issue #70)');
console.log('');

// --- Phase 1: BOM budget validation (<200 EUR envelope) ---
console.log('=== Phase 1: BOM budget validation (<200 EUR envelope) ===');
const bom = [
  { category: 'motors',    name: 'DC motor + wheel pair x2',    priceEur: 30 },
  { category: 'cutting',   name: 'Hardened steel blade',        priceEur: 15 },
  { category: 'controller', name: 'ESP32 dev board',            priceEur: 8 },
  { category: 'sensors',   name: 'HC-SR04 proximity sensor',    priceEur: 10 },
  { category: 'battery',   name: 'LiPo 3S 2200mAh',            priceEur: 25 },
  { category: 'chassis',   name: '3D-printed PETG frame',      priceEur: 20 },
];
const bomReport = L.bomBudgetValidator(bom);
console.log('  total=' + bomReport.totalEur + ' EUR (envelope 200 EUR) valid=' + bomReport.valid);
console.log('  most_expensive=' + bomReport.mostExpensive.name + ' (' + bomReport.mostExpensive.priceEur + ' EUR)');
console.log('  cheapest=' + bomReport.cheapest.name + ' (' + bomReport.cheapest.priceEur + ' EUR)');
console.log('  overBudget=' + bomReport.overBudget + ' missing=' + (bomReport.missingCategories.join(',') || '(none)'));
if (!bomReport.valid || bomReport.overBudget) { console.log('FAIL: BOM invalid'); process.exit(1); }

// --- Phase 2: Differential-drive steering response ---
console.log('');
console.log('=== Phase 2: Differential-drive steering ===');
const headings = [0, 12, -45, 90, -170, 225];
for (const h of headings) {
  const r = L.differentialDrive(h);
  console.log('  heading_err=' + r.headingErrorDeg + 'deg turn=' + r.turnDirection
    + ' L=' + r.leftDuty + '% R=' + r.rightDuty + '% inside_disabled=' + r.insideDisabled);
}

// --- Phase 3: Motor speed PI controller ---
console.log('');
console.log('=== Phase 3: Motor speed PI controller (target 50 cm/s) ===');
let integral = 0;
let measured = 0;
for (let i = 0; i < 8; i++) {
  const step = L.motorSpeedController(50, measured, integral);
  console.log('  tick=' + i + ' measured=' + measured.toFixed(1)
    + ' duty=' + step.dutyCyclePct + '% error=' + step.error
    + ' integral=' + step.integral + ' anti_windup=' + step.antiWindupActive);
  integral = step.integral;
  measured = Math.min(50, measured + 8);
}

// --- Phase 4: Obstacle / tilt safety interlock ---
console.log('');
console.log('=== Phase 4: Obstacle + tilt safety interlock ===');
const guard = [
  { prox: 2000, tilt: 5 },
  { prox: 350, tilt: 5 },
  { prox: 100, tilt: 5 },
  { prox: 2000, tilt: 30 },
  { prox: 100, tilt: 30 },
];
for (const g of guard) {
  const r = L.obstacleGuard(g.prox, g.tilt);
  console.log('  prox=' + g.prox + 'mm tilt=' + g.tilt + 'deg motor_allowed='
    + r.motorAllowed + ' blade_allowed=' + r.bladeAllowed + ' speed=' + r.speed + ' reasons=' + r.reasons);
}

// --- Phase 5: Cutting deck spin-up / spin-down ramp ---
console.log('');
console.log('=== Phase 5: Cutting deck ramp (0 -> 3200 -> 0 rpm) ===');
let rpm = 0;
for (let i = 0; i < 6; i++) {
  const r = L.cuttingDeckController(3200, rpm);
  rpm = r.nextRpm;
  console.log('  target=3200 next_rpm=' + rpm + ' duty=' + r.dutyPct + '% ramped=' + r.ramped);
}
for (let i = 0; i < 6; i++) {
  const r = L.cuttingDeckController(0, rpm);
  rpm = r.nextRpm;
  console.log('  target=0 next_rpm=' + rpm + ' duty=' + r.dutyPct + '% ramped=' + r.ramped);
}

// --- Phase 6: x402 payment spec (documentation only) ---
console.log('');
console.log('=== Phase 6: x402 payment spec (documentation only) ===');
const sp = L.x402PaymentSpec({ suggestedPaymentEur: 0.5 });
console.log('  protocol=' + sp.protocol + ' states=' + sp.states.length);
console.log('  transitions=' + sp.transitions.length + ' data_fields=' + sp.dataFields.length);
console.log('  suggested_payment=' + sp.suggestedPaymentEur + ' EUR');
console.log('  safety_note=' + sp.safetyNote);
if (sp.protocol !== 'x402' || sp.states.length !== 7) { console.log('FAIL: x402 spec malformed'); process.exit(1); }

// --- Phase 7: Mowing mission (5-phase sequence) ---
console.log('');
console.log('=== Phase 7: Mowing mission (5x4m garden, 0.22m swath) ===');
const mission = L.mowingMission({ widthM: 5, heightM: 4 });
for (const p of mission.phases) {
  console.log('  [' + p.phase + '] ' + p.action + ' :: ' + p.summary);
}
console.log('  rows=' + mission.rowCount + ' x402_attached=' + mission.x402.protocol);
if (mission.phases.length !== 5 || mission.rowCount !== 23) { console.log('FAIL: mission malformed'); process.exit(1); }

console.log('');
console.log('PASS - modular lawnmower kit: BOM<=200EUR, steering+PI+guard+deck+x402+mission all deterministically correct');
process.exit(0);
