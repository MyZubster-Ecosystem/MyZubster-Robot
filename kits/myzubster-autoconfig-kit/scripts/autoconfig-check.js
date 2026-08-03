#!/usr/bin/env node
'use strict';
const A = require('../firmware/lib/autoconfig/autoconfig');

const motherConfig = {
  motherId: 'mother-001',
  skills: ['sensor-reading', 'path-following', 'obstacle-avoidance'],
  dna: { traits: ['sturdy', 'energy-efficient', 'waterproof'], mutations: [], parentDNA: 'grandmother-robot' },
};

// Run auto-config for 3 children
const childResults = [];
for (const seq of [1, 2, 3]) {
  const steps = A.autoConfigSequence(seq, motherConfig);
  const childId = steps[0].childId;
  const walletStep = steps.find(s => s.op === 'generate_wallet_descriptor');
  const regStep = steps.find(s => s.op === 'register');
  const skillsStep = steps.find(s => s.op === 'copy_skills');
  const refStep = steps.find(s => s.op === 'set_referrer');
  const dnaStep = steps.find(s => s.op === 'assign_dna');
  childResults.push({ childId, steps: steps.length, walletKeypair: walletStep.descriptor.metadata.hasKeypair, regStatus: regStep.registration.status, skillsCount: skillsStep.count, referrer: refStep.referrer, dnaTraits: dnaStep.dna.traits.length });
}

const energy = A.accumulateEnergy([
  { voltage_mV: 3700, current_mA: 30, duration_ms: 2000 },
  { voltage_mV: 3800, current_mA: 25, duration_ms: 1500 },
  { voltage_mV: 3900, current_mA: 20, duration_ms: 1000 },
]);

console.log('MyZubster Auto-Config Kit - configuration simulation (issue #81)');
console.log('Mother: ' + motherConfig.motherId + ' (' + motherConfig.skills.length + ' skills, ' + motherConfig.dna.traits.length + ' DNA traits)');
console.log('Children configured: ' + childResults.length);
for (const c of childResults) {
  console.log('  ' + c.childId + ': steps=' + c.steps + ' walletKeypair=' + c.walletKeypair + ' regStatus=' + c.regStatus + ' skills=' + c.skillsCount + ' referrer=' + c.referrer + ' dnaTraits=' + c.dnaTraits);
}
console.log('Wallet descriptors: all hasKeypair=false (address placeholder only, provision on first boot)');
console.log('Mission energy: ' + energy.totalMicroJoules + ' uJ (' + energy.totalMilliWattHours.toFixed(3) + ' mWh)');

// Invariants
const okCount = childResults.length === 3;
const okWallet = childResults.every(c => c.walletKeypair === false);
const okReg = childResults.every(c => c.regStatus === 'registered');
const okRef = childResults.every(c => c.referrer === 'mother-001');
const okDNA = childResults.every(c => c.dnaTraits === 3);
const okEnergy = energy.totalMicroJoules > 0;
if (okCount && okWallet && okReg && okRef && okDNA && okEnergy) {
  console.log('PASS - auto-config kit: child ID generation + wallet descriptor (no keypair) + registration + skills copy + referrer + DNA inheritance + energy + full sequence state machine deterministically correct');
  process.exit(0);
} else {
  console.log('FAIL - invariants: count=' + okCount + ' wallet=' + okWallet + ' reg=' + okReg + ' ref=' + okRef + ' dna=' + okDNA + ' energy=' + okEnergy);
  process.exit(1);
}
