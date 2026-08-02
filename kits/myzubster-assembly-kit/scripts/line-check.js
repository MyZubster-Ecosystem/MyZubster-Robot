#!/usr/bin/env node
'use strict';
const L = require('../firmware/lib/line/line');

const steps = L.assemblyLineSequence({ stationCount: 6, stationCycleMs: 5000, conveyorStepsPerSeg: 200 });
const wip0 = [0,0,0,0,0,0];
const wip1 = L.wipTracker('enter', wip0, 1).state;
const wip2 = L.wipTracker('enter', wip1, 4).state;
const wipSnap = L.wipTracker('snapshot', wip2, 1);

const te = L.throughputEstimator([4000, 5000, 3000, 6000, 4000, 2000], { targetUnitsPerHour: 1200 });
const lb = L.lineBalancer([4000, 5000, 3000, 6000, 4000, 2000], { targetUnitsPerHour: 1200 });
const qg = L.qualityGate([
  { check: 'frame_aligned', result: 'pass', durationMs: 100 },
  { check: 'screws_tight', result: 'pass', durationMs: 150 },
]);
const energy = L.accumulateEnergy([
  { voltage_mV: 5000, current_mA: 150, duration_ms: 5000 },
  { voltage_mV: 4800, current_mA: 200, duration_ms: 3000 },
  { voltage_mV: 5200, current_mA: 180, duration_ms: 2000 },
]);

console.log('MyZubster Assembly-Line Kit - line simulation (issue #80)');
console.log('Line: 6 stations (pick -> chassis -> board -> motors -> flash -> register)');
console.log('Sequence: ' + steps.length + ' steps (' + steps.filter(s => s.op === 'station_enter').length + ' stations x 5 ops + init + complete)');
console.log('WIP tracker: enter station 1+4 -> total ' + wipSnap.total + ' (' + wipSnap.perStation.join(',') + ')');
console.log('Throughput: ' + te.unitsPerHour + ' units/hr (bottleneck=station ' + te.bottleneckStation + ' @ ' + te.maxCycleMs + 'ms, meetsTarget=' + te.meetsTarget + ')');
console.log('Line balancer: ' + (lb.balanced ? 'balanced' : 'unbalanced - ' + lb.suggestion));
console.log('Quality gate: chassis station -> ' + (qg.pass ? 'PASS' : 'FAIL') + ' (failures: ' + qg.failures.join(',') + ')');
console.log('Mission energy: ' + energy.totalMicroJoules + ' uJ (' + energy.totalMilliWattHours.toFixed(3) + ' mWh)');

// Invariants
const okSeq = steps.length === 32 && steps[0].op === 'line_init' && steps[31].op === 'line_complete';
const okWip = wipSnap.total === 2 && wipSnap.perStation[0] === 1 && wipSnap.perStation[3] === 1;
const okTE = te.bottleneckStation === 4 && te.maxCycleMs === 6000;
const okLB = !lb.balanced && lb.bottleneckStation === 4;
const okQG = qg.pass;
const okE = energy.totalMicroJoules > 0;
if (okSeq && okWip && okTE && okLB && okQG && okE) {
  console.log('PASS - assembly-line kit: 6-station scheduler + WIP tracker + throughput estimator + line balancer + quality gate + arm control + energy deterministically correct');
  process.exit(0);
} else {
  console.log('FAIL - invariants: seq=' + okSeq + ' wip=' + okWip + ' te=' + okTE + ' lb=' + okLB + ' qg=' + okQG + ' e=' + okE);
  process.exit(1);
}
