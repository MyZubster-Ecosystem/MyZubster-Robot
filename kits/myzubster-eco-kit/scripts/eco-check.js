'use strict';
// `npm run eco:check` - runs the eco sleep/motor/energy helpers on a sample scenario
// and prints an energy-savings summary. No network, local file reads only.
const eco = require('../firmware/lib/eco/eco');

// One-hour scenario: robot is actively driven 6 min, then idle for the remaining 54 min.
// Baseline = nominal current the whole hour.  Eco = nominal (active) + quiescent (idle).
const TIMELINE_MS = 3_600_000;            // 1 h
const ACTIVE_MS = 6 * 60 * 1000;          // 6 min active
const IDLE_MS = TIMELINE_MS - ACTIVE_MS;   // 54 min idle
const VCC_MV = 3300;
const NOMINAL_MA = 380;                   // motors + ESP32 active
const QUIESCENT_MA = 0.8;                 // ESP32 deep sleep + driver EN low

const baseline = eco.accumulateEnergy([
  { voltage_mV: VCC_MV, current_mA: NOMINAL_MA, duration_ms: TIMELINE_MS },
]);
const ecoEnergy = eco.accumulateEnergy([
  { voltage_mV: VCC_MV, current_mA: NOMINAL_MA, duration_ms: ACTIVE_MS },
  { voltage_mV: VCC_MV, current_mA: QUIESCENT_MA, duration_ms: IDLE_MS },
]);

const saved = baseline.totalMilliWattHours - ecoEnergy.totalMilliWattHours;
const savedPct = (saved / baseline.totalMilliWattHours) * 100;

function pad(v, n) { return String(v).padStart(n, ' '); }

console.log('MyZubster Eco Kit - scenario energy check (issue #71)');
console.log('Timeline: 1 h total, 6 min active + 54 min idle');
console.log('Baseline (always-on): ' + baseline.totalMilliWattHours.toFixed(2) + ' mWh');
console.log('Eco mode:             ' + ecoEnergy.totalMilliWattHours.toFixed(2) + ' mWh');
console.log('Energy saved:         ' + saved.toFixed(2) + ' mWh (' + savedPct.toFixed(1) + '%)');
console.log('');
console.log('Sleep decisions (inactivity):');
for (const d of [
  { ms: 1000, s: eco.decideSleep(1000) },
  { ms: 10000, s: eco.decideSleep(10000) },
  { ms: 60000, s: eco.decideSleep(60000) },
]) console.log('  ' + pad(d.ms, 7) + ' ms -> ' + d.s);
console.log('Motor standby decisions:');
for (const m of [
  { ms: 1000, standby: eco.motorStandby(1000) },
  { ms: 3000, standby: eco.motorStandby(3000) },
]) console.log('  ' + pad(m.ms, 7) + ' ms -> standby=' + m.standby);
console.log('');

if (!(saved > 0 && savedPct > 0)) {
  console.error('FAIL: energy savings not positive');
  process.exit(1);
}
console.log('PASS - eco kit reduces idle energy consumption (issue #71: risparmio energetico)');
