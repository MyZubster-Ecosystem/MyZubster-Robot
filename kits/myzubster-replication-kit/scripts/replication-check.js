'use strict';
// Headless self-replication simulation for MyZubster-Robot issue #73.
// Runs every firmware helper end-to-end without ESP32 hardware and exits non-zero
// on any failure. Mirrors the lawnmower:check / energy:check pattern.
const R = require('../firmware/lib/replication/replication.js');

function pass(label) { console.log('PASS - ' + label); }
function info(label, val) { console.log('  ' + label + '=' + JSON.stringify(val)); }

console.log('MyZubster Self-Replication Kit - headless simulation (issue #73)');

// Phase 1: modular part registry
console.log('=== Phase 1: Modular part registry ===');
const parts = [
  { id: 'chassis-mk2', type: 'chassis', sockets: ['M3', 'snap-fit'], plugs: [] },
  { id: 'motor-tt', type: 'motor', sockets: ['snap-fit'], plugs: ['M3'], qty: 2 },
  { id: 'wheel-65', type: 'wheel', sockets: [], plugs: ['snap-fit'], qty: 2 },
  { id: 'esp32-mb', type: 'controller', sockets: ['USB-C', 'GPIO-header'], plugs: [], qty: 1 },
  { id: 'vl53-tof', type: 'sensor', sockets: [], plugs: ['magnetic'], qty: 3 },
];
const reg = R.modularPartRegistry(parts);
info('catalog', reg.count);
info('inventory', { motor: reg.inventory.motor, wheel: reg.inventory.wheel, sensor: reg.inventory.sensor });

// Phase 2: part compatibility
console.log('=== Phase 2: Part compatibility ===');
const compat = R.partCompatibility(parts[1], parts[0]); // motor -> chassis
info('motor<->chassis', compat ? compat.direction + ' ' + compat.connectors.join(',') : 'NONE');

// Phase 3: assembly sequence planner
console.log('=== Phase 3: Assembly sequence planner ===');
const plan = R.assemblySequencePlanner(parts);
info('resolvable', plan.resolvable);
info('stepCount', plan.stepCount);
if (!plan.resolvable) { console.error('FAIL: planner not resolvable'); process.exit(1); }

// Phase 4: clonable firmware manifest
console.log('=== Phase 4: Clonable firmware manifest (documentation only) ===');
const spec = R.firmwareCloneSpec({
  parentVersion: '0.4.2',
  targetBoard: 'ESP32-DevKit',
  images: [
    { name: 'myzubster-fw', version: '0.4.2', size: 131072, targetSlot: 'main' },
    { name: 'bootstrap', version: '1.0.0', size: 4096, targetSlot: 'boot' },
  ],
});
info('images', spec.images.length);
info('checksum[main]', spec.images[0].checksum);
info('docsOnly', spec.docsOnly);

// Phase 5: self-replication controller FSM
console.log('=== Phase 5: Self-replication controller (7-state FSM) ===');
let sm = R.selfReplicationController({ state: 'IDLE', event: 'start', context: { inventory: reg.inventory } });
info('IDLE->start', sm.state);
sm = R.selfReplicationController({ state: sm.state, event: 'partsFound' }); info('SCAN->partsFound', sm.state);
sm = R.selfReplicationController({ state: sm.state, event: 'partsComplete', context: { steps: plan.steps } }); info('VERIFY->complete', sm.state);
sm = R.selfReplicationController({ state: sm.state, event: 'sequenceComplete', context: { spec } }); info('ASSEMBLE->seq', sm.state);
sm = R.selfReplicationController({ state: sm.state, event: 'flashDone' }); info('FLASH->done', sm.state);
sm = R.selfReplicationController({ state: sm.state, event: 'copyValid', context: { copies: 0 } }); info('VALIDATE->valid', sm.state + ' copies=' + sm.output.copies);

// Phase 6: progress tracker
console.log('=== Phase 6: Progress tracker ===');
const pt = R.replicationProgressTracker(plan.steps, plan.stepCount);
info('progress', pt.pct + '% phase=' + pt.phase);

// Phase 7: copy validator
console.log('=== Phase 7: Copy validator ===');
const original = { composition: { chassis: 1, motor: 2, wheel: 2, controller: 1, sensor: 3 }, firmwareVersion: '0.4.2' };
const copyOK = { composition: { chassis: 1, motor: 2, wheel: 2, controller: 1, sensor: 3 }, firmwareVersion: '0.4.2' };
const v = R.replicationValidator(copyOK, original);
info('validator', v.match ? 'copy=fidelity OK' : 'MISMATCH ' + JSON.stringify(v.differences));

if (reg.inventory.motor === 2 && plan.resolvable && spec.cloneable && sm.state === 'DONE' && pt.pct === 100 && v.match) {
  pass('self-replication kit: part registry + compatibility + assembly ordering + clonable-firmware spec + 7-state FSM + progress + copy validator all deterministically correct');
} else {
  console.error('FAIL: assertion mismatch');
  process.exit(1);
}
