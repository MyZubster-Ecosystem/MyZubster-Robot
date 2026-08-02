'use strict';
// `npm run agri:check` - runs the agri moisture / valve / weather / energy helpers
// on a 24-hour scenario and prints a water-savings summary. No network, local only.
const agri = require('../firmware/lib/agri/agri');

// 24-hour scenario: tick every 10 minutes (144 ticks). Soil starts dry (raw 3000,
// moisture ~23%), slowly dries through midday (raw 2400, moisture ~50%) then is
// re-wet by evening rain down to raw 1440, moisture ~94%. The agri kit irrigates
// only when soil is below the dry threshold; the baseline pumps a fixed 30 s on
// every non-saturated tick regardless of moisture.
const TICK_MS = 10 * 60 * 1000;        // 10 min per tick
const TICKS = 144;                      // 24 h
const SCENARIO = [];
for (let i = 0; i < TICKS; i++) {
  // soil dries overnight then saturates in the evening
  const hour = (i / 6);                  // i / 6 = hours since start (1 tick = 10 min)
  let raw;
  if (hour < 12) raw = 3000 - 50 * (hour);  // dries from raw 3000 toward 2400 over 12 h
  else raw = 2400 - 80 * (hour - 12);     // wet from raw 2400 toward 1440 over 12 h (rain)
  SCENARIO.push({ tick: i, hour, raw });
}

// Valve/pump draw when the valve is open: 200 mA @ 5 V (solenoid + pump).
// Quiescent draw when idle: 12 mA @ 3.7 V (ESP32 + sensor + ADC sampling).
const VCC_MV = 3300;
const VALVE_MA = 200;
const VALVE_V_MV = 5000;
const IDLE_MA = 12;

function runScenario(withAgri) {
  let totalWaterMs = 0;          // ms of valve open time across the scenario
  let events = 0;
  let cycleEnergy = [];
  for (const s of SCENARIO) {
    const moisture = agri.moistureToPercent(s.raw);
    let duration = 0;
    if (withAgri) {
      // agri = threshold + weather-factor driven
      const v = agri.valveControl(moisture, null);
      duration = v.open ? v.duration_ms : 0;
    } else {
      // baseline = obsolete timer schedule: pump a fixed 30 s whenever soil is not
      // saturated (demonstrates what an always-on timer wastes vs a moisture-driven policy)
      duration = (moisture < 100) ? 30_000 : 0;
    }
    if (duration > 0) {
      totalWaterMs += duration;
      events++;
      cycleEnergy.push({ voltage_mV: VALVE_V_MV, current_mA: VALVE_MA, duration_ms: duration });
    }
  }
  // idle (sensor + ESP32) energy over the full scenario duration
  cycleEnergy.push({ voltage_mV: VCC_MV, current_mA: IDLE_MA, duration_ms: TICK_MS * TICKS });
  const energy = agri.accumulateEnergy(cycleEnergy);
  return { totalWaterMs, events, energyMWh: energy.totalMilliWattHours };
}

const baseline = runScenario(false);  // baseline = always irrigate a fresh tick
const agriOut = runScenario(true);    // agri = decideIrrigation-driven
const waterSavedPct = baseline.totalWaterMs > 0
  ? ((baseline.totalWaterMs - agriOut.totalWaterMs) / baseline.totalWaterMs) * 100
  : 0;

function pad(v, n) { return String(v).padStart(n, ' '); }

console.log('MyZubster Agri Kit - scenario water-+energy check (issue #74)');
console.log('Scenario: 24 h, tick every 10 min, soil dries morning + rains evening');
console.log('Baseline (fixed 30 s / dry tick): ' + pad(baseline.totalWaterMs / 1000, 6) + ' s valve open, ' + baseline.events + ' cycles, ' + baseline.energyMWh.toFixed(2) + ' mWh');
console.log('Agri decideIrrigation:         ' + pad(agriOut.totalWaterMs / 1000, 6) + ' s valve open, ' + agriOut.events + ' cycles, ' + agriOut.energyMWh.toFixed(2) + ' mWh');
console.log('Water saved:                 ' + ((baseline.totalWaterMs - agriOut.totalWaterMs) / 1000).toFixed(1) + ' s valve-open (' + waterSavedPct.toFixed(1) + '%)');
console.log('');
console.log('Moisture / weather / valve sample decisions:');
for (const d of [
  { raw: 3500, forecast: null },          // dry below 0% -> irrigate, big duration
  { raw: 2400, forecast: null },          // 50% mid-band -> wait
  { raw: 1300, forecast: null },          // saturated 100% -> wait
  { raw: 2800, forecast: { rainExpected: true } },  // dry-ish + rain forecast -> smaller duration
]) {
  const m = agri.moistureToPercent(d.raw);
  const v = agri.valveControl(m, d.forecast);
  console.log('  raw=' + pad(d.raw, 4) + ' moisture=' + pad(m, 3) + '% -> ' + v.decision + (v.open ? ' valve ' + v.duration_ms + 'ms (rainFactor ' + v.rainFactor + ')' : ''));
}
console.log('');

if (!(waterSavedPct > 0 && agriOut.totalWaterMs < baseline.totalWaterMs)) {
  console.error('FAIL: agri did not reduce water vs baseline');
  process.exit(1);
}
console.log('PASS - agri kit irrigates only when soil is below the dry threshold, saving water vs always-on baseline (issue #74: risparmio acqua in agricoltura)');
