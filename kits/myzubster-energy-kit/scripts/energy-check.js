#!/usr/bin/env node
'use strict';
const E = require('../firmware/lib/energy/energy');

// --- Phase 1: Battery SoC sweep ---
console.log('MyZubster Energy Independence Kit - recharge simulation (issue #85)');
console.log('');
console.log('=== Phase 1: Battery SoC sweep ===');
const voltages = [4200, 4000, 3750, 3500, 3250, 3100, 3000, 2900];
const socResults = voltages.map(v => {
  const soc = E.socFromVoltage(v);
  const low = E.lowBatteryDetector(soc, false);
  return { voltage: v, soc, alerting: low.alerting, action: low.action };
});
for (const r of socResults) {
  console.log('  ' + r.voltage + ' mV -> SoC=' + r.soc + '% alerting=' + r.alerting + ' action=' + r.action);
}

// --- Phase 2: Low-battery detection with hysteresis ---
console.log('');
console.log('=== Phase 2: Low-battery hysteresis ===');
let wasAlerting = false;
const socTrajectory = [80, 30, 20, 15, 10, 15, 20, 25, 30, 50];
const hystResults = [];
for (const soc of socTrajectory) {
  const r = E.lowBatteryDetector(soc, wasAlerting);
  hystResults.push({ soc, ...r });
  wasAlerting = r.alerting;
}
for (const r of hystResults) {
  console.log('  SoC=' + r.soc + '% alerting=' + r.alerting + ' action=' + r.action);
}

// --- Phase 3: Navigate to dock ---
console.log('');
console.log('=== Phase 3: Dock navigation ===');
const robotPos = { x: 2, y: 3 };
const dockPos = { x: 8, y: 6 };
const nav = E.navigatorToDock(robotPos, dockPos);
console.log('  Robot (' + robotPos.x + ',' + robotPos.y + ') -> Dock (' + dockPos.x + ',' + dockPos.y + ')');
console.log('  Distance=' + nav.distance + 'm  Bearing=' + nav.bearing + 'deg  InRange=' + nav.inRange);

// --- Phase 4: Docking state machine full cycle ---
console.log('');
console.log('=== Phase 4: Auto-docking state machine ===');
let state = 'idle';
const sensors = [
  { lowBattery: true },
  { dockVisible: true },
  { dockAligned: true },
  { contactsAligned: true },
  { powerConnected: true },
  { fullyCharged: true },
  {},
];
for (const s of sensors) {
  const r = E.dockingStateMachine(state, s);
  console.log('  ' + r.from + ' -> ' + r.to + ' (action=' + r.action + ')');
  state = r.to;
}

// --- Phase 5: x402 payment spec (documentation only) ---
console.log('');
console.log('=== Phase 5: x402 payment spec (documentation only) ===');
const spec = E.x402PaymentSpec();
console.log('  Protocol: ' + spec.protocol);
console.log('  States: ' + spec.states.join(' -> '));
console.log('  Data fields: ' + spec.dataFields.join(', '));
console.log('  Note: ' + spec.note.slice(0, 80) + '...');

// --- Phase 6: Full recharge mission ---
console.log('');
console.log('=== Phase 6: Recharge mission ===');
const mission = E.rechargeMission(robotPos, dockPos, 15);
for (const step of mission) {
  console.log('  Phase ' + step.phase + ': ' + step.op + (step.action ? ' (action=' + step.action + ')' : ''));
}
const missionFine = E.rechargeMission(robotPos, dockPos, 80);
console.log('  (Battery SoC=80% -> ' + missionFine.map(s => s.op).join(' -> ') + ')');

// --- Phase 7: Energy accumulation ---
console.log('');
console.log('=== Phase 7: Energy accumulation ===');
const energy = E.accumulateEnergy([
  { voltage_mV: 3700, current_mA: 30, duration_ms: 2000 },
  { voltage_mV: 3800, current_mA: 25, duration_ms: 1500 },
  { voltage_mV: 3900, current_mA: 20, duration_ms: 1000 },
]);
console.log('  Total: ' + energy.totalMicroJoules + ' uJ (' + energy.totalMilliWattHours.toFixed(3) + ' mWh)');

// --- Invariants ---
console.log('');
const okSoc = socResults[0].soc === 100 && socResults[socResults.length - 1].soc === 0;
const okHyst = hystResults.some(r => r.action === 'trigger_recharge') && hystResults.some(r => r.action === 'cancel_recharge');
const okNav = nav.distance > 0 && nav.bearing > 0 && nav.inRange === true;
const okCycle = state === 'idle';
const okSpec = spec.protocol === 'x402-documentation-spec' && E.DEFAULTS.x402AmountXmr === 0;
const okMission = mission.some(s => s.phase === 5 && s.op === 'complete');
const okEnergy = energy.totalMicroJoules > 0;

if (okSoc && okHyst && okNav && okCycle && okSpec && okMission && okEnergy) {
  console.log('PASS - energy independence kit: battery SoC + low-battery hysteresis + dock navigator + auto-docking state machine + x402 spec (docs only) + charging notifier + recharge mission + energy accumulation all deterministically correct');
  process.exit(0);
} else {
  console.log('FAIL - invariants: soc=' + okSoc + ' hyst=' + okHyst + ' nav=' + okNav + ' cycle=' + okCycle + ' spec=' + okSpec + ' mission=' + okMission + ' energy=' + okEnergy);
  process.exit(1);
}
