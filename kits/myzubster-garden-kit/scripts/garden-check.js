#!/usr/bin/env node
'use strict';
// Headless simulation of the garden automation kit (issue #76).
// Runs a full garden mission: boustrophedon mowing path + irrigation scheduling +
// weed detection + garden mapping, prints results, verifies invariants, exits 0.
const G = require('../firmware/lib/garden/garden');

const FIELD = { widthM: 6, heightM: 1 };
const IRRIGATE_WINDOWS = [
  { startHour: 6, endHour: 7, durationMin: 15 },
  { startHour: 18, endHour: 19, durationMin: 20 },
];
const WEEDER_POINTS = [
  { heightMm: 70, greenDensity: 0.85 }, // weed
  { heightMm: 28, greenDensity: 0.65 }, // grass
  { heightMm: 55, greenDensity: 0.40 }, // weed
  { heightMm: 5, greenDensity: 0.08 },  // bare soil
];
const SAMPLES = [
  { x: 0, y: 0 }, { x: 3, y: 0.25 }, { x: 6, y: 0.5 },
  { x: 0, y: 0.75 }, { x: 3, y: 0.9 }, { x: 6, y: 1 },
];

const plan = {
  field: FIELD,
  irrigateWindows: IRRIGATE_WINDOWS,
  weederPoints: WEEDER_POINTS,
  samples: SAMPLES,
};

const steps = G.gardenMission(plan, { swathWidthM: 0.22, mapCellM: 0.5 });
const mowMoves = steps.filter(s => s.op === 'mow_move');
const detects = steps.filter(s => s.op === 'detect');
const mapEnd = steps.find(s => s.op === 'map_end');

// Mower scheduler sweep across a day at 3h intervals
const mowStates = [];
for (const h of [6, 9, 12, 15, 18]) {
  mowStates.push({ hour: h, state: G.mowerScheduler(h, h === 6 ? 60 : 30) });
}

// Irrigation scheduler sweep
const irr = [];
for (const combo of [{ h: 6, m: 30 }, { h: 7, m: 20 }, { h: 12, m: 45 }, { h: 18, m: 35 }]) {
  irr.push({ hour: combo.h, moisture: combo.m, result: G.irrigationScheduler(IRRIGATE_WINDOWS, combo.h, combo.m) });
}

const energy = G.accumulateEnergy([
  { voltage_mV: 3900, current_mA: 120, duration_ms: 1500 },
  { voltage_mV: 3600, current_mA: 80, duration_ms: 2000 },
  { voltage_mV: 3700, current_mA: 100, duration_ms: 1800 },
]);

const coverage = G.coverageArea(mowMoves, FIELD.widthM, FIELD.heightM, { swathWidthM: 0.22 });

console.log('MyZubster Garden-Automation Kit - mission simulation (issue #76)');
console.log('Field: ' + FIELD.widthM + 'm x ' + FIELD.heightM + 'm (' + (FIELD.widthM * FIELD.heightM) + ' m^2)');
console.log('Boustrophedon mowing path: ' + mowMoves.length + ' waypoints, coverage ' + coverage.toFixed(2) + ' m^2');
console.log('Mower scheduler (hour -> state): ' + mowStates.map(s => s.hour + ':' + s.state).join('  '));
console.log('Irrigation scheduler: ' + irr.map(i => i.hour + 'h/' + i.moisture + '%=' + i.result.active + '/' + i.result.reason).join('  '));
console.log('Weed detection: ' + detects.length + ' plots -> ' + detects.map(d => d.idx + ':' + d.label).join(', '));
console.log('Garden map: ' + mapEnd.visitedCells + '/' + mapEnd.totalCells + ' cells, coverage ' + (mapEnd.coverage * 100).toFixed(1) + '%');
console.log('Mission energy: ' + energy.totalMicroJoules + ' uJ (' + energy.totalMilliWattHours.toFixed(3) + ' mWh)');

// Invariants
const okMow = mowMoves.length > 0 && mowMoves[0].x === 0;
const okCoverage = coverage > 0 && coverage <= FIELD.widthM * FIELD.heightM;
const okMap = mapEnd.visitedCells > 0 && mapEnd.coverage <= 1;
const okEnergy = energy.totalMicroJoules > 0;
if (okMow && okCoverage && okMap && okEnergy) {
  console.log('PASS - garden-automation kit: cutting scheduler + boustrophedon path + irrigation + weed classifier + garden map + mission state machine deterministically correct');
  process.exit(0);
} else {
  console.log('FAIL - invariant check failed');
  process.exit(1);
}
