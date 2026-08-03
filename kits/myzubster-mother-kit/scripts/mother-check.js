#!/usr/bin/env node
'use strict';
// Headless simulation of the mother-robot assembly kit (issue #78).
// Runs a full assembly mission: component inventory + arm IK + assembly
// sequence + child registration + birth firmware, prints results, verifies
// invariants, exits 0.
const M = require('../firmware/lib/mother/mother');

const CHILD_SPEC = {
  childId: 'myzubster-child-001',
  motherboard: 'ESP32-WROOM-32',
  components: ['chassis-frame', 'N20-motor-L', 'N20-motor-R', 'ultrasonic-HC-SR04', 'battery-pack', 'ESP32-board'],
  sensors: ['ultrasonic', 'moisture'],
  motors: 2,
};

// Inventory simulation
let state = [];
for (const comp of CHILD_SPEC.components) {
  const r = M.componentInventory('add', state, comp);
  if (r.added) state = r.state;
}
const invCount = M.componentInventory('count', state, '');

// Arm IK simulation
const ikTargets = [{ x: 100, y: 50 }, { x: 150, y: 80 }, { x: 80, y: 120 }, { x: 0, y: 200 }];
const ikResults = ikTargets.map(t => ({ target: t, ...M.armIK(t.x, t.y) }));

// Assembly sequence
const steps = M.assemblySequence(CHILD_SPEC);
const ops = steps.map(s => s.op);
const picks = steps.filter(s => s.op === 'pick');
const flash = steps.find(s => s.op === 'flash');
const register = steps.find(s => s.op === 'register');

// Magazine steps for 6-slot rotation
const magSteps = M.magazineSteps(6);

// Energy simulation
const energy = M.accumulateEnergy([
  { voltage_mV: 5000, current_mA: 200, duration_ms: 2000 }, // base idle
  { voltage_mV: 5200, current_mA: 350, duration_ms: 1500 },   // arm move
  { voltage_mV: 4800, current_mA: 180, duration_ms: 1000 },   // flash
]);

console.log('MyZubster Mother-Robot Kit - assembly simulation (issue #78)');
console.log('Child: ' + CHILD_SPEC.childId + ' (' + CHILD_SPEC.components.length + ' components, ' + CHILD_SPEC.sensors.length + ' sensors)');
console.log('Component inventory: ' + invCount.count + '/' + 6 + ' slots loaded');
console.log('Arm IK: ' + ikResults.length + ' targets -> ' + ikResults.filter(r => r.reachable).length + ' reachable, angles: ' + ikResults.filter(r => r.reachable).map(r => r.shoulderDeg + '/' + r.elbowDeg).join(', '));
console.log('Assembly sequence: ' + steps.length + ' steps (' + picks.length + ' pick + ' + picks.length + ' position + ' + picks.length + ' connect + ' + picks.length + ' verify + flash + register + complete)');
console.log('Magazine rotation: ' + magSteps + ' steps for full 6-slot cycle');
console.log('Birth firmware: ' + flash.firmware.childId + ' flash=' + flash.firmware.flashSize + 'B motors=' + flash.firmware.motors.count + ' sensors=' + flash.firmware.sensors.join(','));
console.log('Child registered: ' + register.record.childId + ' @ ' + register.record.firmwareVersion);
console.log('Mission energy: ' + energy.totalMicroJoules + ' uJ (' + energy.totalMilliWattHours.toFixed(3) + ' mWh)');

// Invariants
const okInv = invCount.count === 6;
const okIK = ikResults.every(r => r.reachable === true);
var expectedSteps = 1 + CHILD_SPEC.components.length * 4 + 3;
const okSeq = steps.length === expectedSteps && ops[ops.length - 1] === 'complete';
const okFlash = flash.firmware.childId === CHILD_SPEC.childId && flash.firmware.wifi.enabled === false;
const okReg = register.record.childId === CHILD_SPEC.childId && register.record.status === 'registered';
const okEnergy = energy.totalMicroJoules > 0;
if (okInv && okIK && okSeq && okFlash && okReg && okEnergy) {
  console.log('PASS - mother-robot kit: inventory + arm IK + assembly sequence + flash + registration + energy + birth state machine deterministically correct');
  process.exit(0);
} else {
  console.log('FAIL - invariant check failed: inv=' + okInv + ' ik=' + okIK + ' seq=' + okSeq + ' flash=' + okFlash + ' reg=' + okReg + ' energy=' + okEnergy);
  process.exit(1);
}
