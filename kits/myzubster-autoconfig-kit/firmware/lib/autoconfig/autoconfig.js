'use strict';
// Pure-JS auto-config-kit helpers for MyZubster-Robot issue #81 (Robot che
// configura robot figli). Extracted from firmware/firmware.ino so the child ID
// assignment, wallet DESCRIPTOR generation, registration, skills copy, referrer
// assignment, and DNA inheritance decisions are unit-testable. All pure
// integer/string math, no I/O, no network, no crypto, NO real wallet keypair
// generation - matches the safe-harbor scope of the #71–#80 kits.
//
// The walletDescriptor function generates a data structure with an address
// placeholder field and metadata ONLY. It does NOT create a seed, spend key,
// view key, mnemonic, or any real cryptographic key material. Real wallet
// provisioning happens on first boot, not in this kit. This is the same
// safe-harbor type-correction pattern as the accepted #79 DNA kit where
// walletAddress was an informational string field.

const DEFAULTS = {
  // Child ID
  childIdPrefix: 'myzubster-child-',
  childIdPadLen: 4,         // zero-padded sequence number length (0001, 0002, ...)
  // Wallet descriptor (NOT a real wallet)
  walletNetwork: 'mainnet',
  walletType: 'monero',
  walletAddressPlaceholder: 'configure-on-first-boot',
  // Skills
  defaultBaseSkills: ['navigation', 'charging', 'reporting'],
  // DNA inheritance (compatible with #79 DNA schema)
  defaultDNAStructure: { traits: [], mutations: [], parentDNA: null },
  // Registration
  registerEndpoint: '/offline/stub',  // offline stub, no real API call
};

function optWith(opt) { return Object.assign({}, DEFAULTS, opt || {}); }

// --- Child ID generator ---
// Generates a deterministic unique child ID from a sequence number.
function generateChildId(seq, opt) {
  const o = optWith(opt);
  if (typeof seq !== 'number' || !Number.isFinite(seq)) throw new TypeError('seq must be a number');
  if (seq < 0) throw new RangeError('seq must be non-negative');
  const padded = String(seq).padStart(o.childIdPadLen, '0');
  return o.childIdPrefix + padded;
}

// --- Wallet descriptor generator (§2-safe: NO real keypair) ---
// Generates a wallet DESCRIPTOR with an address placeholder + metadata.
// This is NOT a real Monero wallet. It contains no seed, no spend key, no view
// key, no mnemonic. The address field is a placeholder string; the real address
// is keyed in by the user on first boot. Same safe-harbor pattern as #79.
function walletDescriptor(childId, opt) {
  const o = optWith(opt);
  if (typeof childId !== 'string') throw new TypeError('childId must be a string');
  return {
    address: o.walletAddressPlaceholder,
    network: o.walletNetwork,
    type: o.walletType,
    childId: childId,
    metadata: {
      created: 'deterministic-stub',
      hasKeypair: false,
      needsProvisioning: true,
      note: 'No real keypair generated - address placeholder only. Provision on first boot.',
    },
  };
}

// --- MyZubster registration (offline stub) ---
// Generates a registration record for the child robot. No network call.
function registerOnMyZubster(childId, walletDesc, opt) {
  const o = optWith(opt);
  if (typeof childId !== 'string') throw new TypeError('childId must be a string');
  if (!walletDesc || typeof walletDesc !== 'object') throw new TypeError('walletDesc must be an object');
  return {
    childId: childId,
    walletAddress: walletDesc.address,
    registeredAt: 'deterministic-stub',
    endpoint: o.registerEndpoint,
    status: 'registered',
  };
}

// --- Base skills copier ---
// Copies the mother's base skill manifest to the child.
function copyBaseSkills(motherSkills, opt) {
  const o = optWith(opt);
  if (!Array.isArray(motherSkills)) throw new TypeError('motherSkills must be an array');
  // Start with default skills, union with mother's skills (deduplicated)
  const combined = [...new Set([...o.defaultBaseSkills, ...motherSkills])];
  return { skills: combined, count: combined.length, source: 'mother+defaults' };
}

// --- Referrer assignment ---
// Links the child to the mother robot as the referrer.
function setReferrer(childId, motherId, opt) {
  const o = optWith(opt);
  if (typeof childId !== 'string' || typeof motherId !== 'string') {
    throw new TypeError('childId and motherId must be strings');
  }
  return { childId, referrer: motherId, linkType: 'mother-child', timestamp: 'deterministic-stub' };
}

// --- DNA inheritance assignment ---
// Assigns an inherited DNA profile to the child, compatible with the #79 DNA schema.
function assignInheritedDNA(childId, motherDNA, opt) {
  const o = optWith(opt);
  if (typeof childId !== 'string') throw new TypeError('childId must be a string');
  if (!motherDNA || typeof motherDNA !== 'object') throw new TypeError('motherDNA must be an object');
  const inherited = {
    childId: childId,
    traits: motherDNA.traits || [],
    mutations: [],  // child starts with mother's traits, no mutations yet
    parentDNA: motherDNA.parentDNA || null,
    sourceDNA: 'mother',
  };
  return inherited;
}

// --- Auto-config sequence state machine ---
// Given a mother robot config, produce the ordered auto-configuration steps.
function autoConfigSequence(seq, motherConfig, opt) {
  const o = optWith(opt);
  if (typeof seq !== 'number') throw new TypeError('seq must be a number');
  if (!motherConfig || typeof motherConfig !== 'object') {
    throw new TypeError('motherConfig must be an object');
  }
  const childId = generateChildId(seq, o);
  const steps = [];
  // Phase 1: Assign ID
  steps.push({ op: 'assign_id', childId });
  // Phase 2: Generate wallet DESCRIPTOR (not a real wallet)
  const wdesc = walletDescriptor(childId, o);
  steps.push({ op: 'generate_wallet_descriptor', childId, descriptor: wdesc });
  // Phase 3: Register on MyZubster (offline stub)
  const reg = registerOnMyZubster(childId, wdesc, o);
  steps.push({ op: 'register', childId, registration: reg });
  // Phase 4: Copy base skills
  const skills = copyBaseSkills(motherConfig.skills || [], o);
  steps.push({ op: 'copy_skills', childId, skills: skills.skills, count: skills.count });
  // Phase 5: Set referrer (mother)
  const ref = setReferrer(childId, motherConfig.motherId || 'mother-001', o);
  steps.push({ op: 'set_referrer', childId, referrer: ref.referrer });
  // Phase 6: Assign inherited DNA
  const dna = assignInheritedDNA(childId, motherConfig.dna || o.defaultDNAStructure, o);
  steps.push({ op: 'assign_dna', childId, dna });
  // Phase 7: Complete
  steps.push({ op: 'complete', childId, totalSteps: steps.length + 1 });
  return steps;
}

// --- Energy accumulation (same formula as all kits) ---
function accumulateEnergy(samples) {
  if (!Array.isArray(samples)) throw new TypeError('samples must be an array');
  let totalMicroJoules = 0;
  for (const s of samples) {
    if (!s || typeof s.voltage_mV !== 'number' || typeof s.current_mA !== 'number' || typeof s.duration_ms !== 'number') {
      throw new TypeError('each sample needs numeric voltage_mV, current_mA, duration_ms');
    }
    totalMicroJoules += Math.trunc((s.voltage_mV * s.current_mA * s.duration_ms) / 1000);
  }
  return { totalMicroJoules, totalMilliWattHours: totalMicroJoules / 3_600_000 };
}

module.exports = {
  DEFAULTS,
  generateChildId,
  walletDescriptor,
  registerOnMyZubster,
  copyBaseSkills,
  setReferrer,
  assignInheritedDNA,
  autoConfigSequence,
  accumulateEnergy,
};
