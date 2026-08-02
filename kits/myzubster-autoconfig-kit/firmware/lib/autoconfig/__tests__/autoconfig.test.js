'use strict';
const A = require('../autoconfig');

describe('generateChildId', () => {
  test('generates padded sequential ID', () => {
    expect(A.generateChildId(1)).toBe('myzubster-child-0001');
    expect(A.generateChildId(42)).toBe('myzubster-child-0042');
    expect(A.generateChildId(999)).toBe('myzubster-child-0999');
  });
  test('respects custom prefix', () => {
    expect(A.generateChildId(1, { childIdPrefix: 'robot-' })).toBe('robot-0001');
  });
  test('respects custom pad length', () => {
    expect(A.generateChildId(1, { childIdPadLen: 6 })).toBe('myzubster-child-000001');
  });
  test('zero sequence yields all-zeros ID', () => {
    expect(A.generateChildId(0)).toBe('myzubster-child-0000');
  });
  test('throws on non-number', () => {
    expect(() => A.generateChildId('1')).toThrow(TypeError);
    expect(() => A.generateChildId(undefined)).toThrow(TypeError);
  });
  test('throws on negative', () => {
    expect(() => A.generateChildId(-1)).toThrow(RangeError);
  });
});

describe('walletDescriptor', () => {
  test('generates descriptor with address placeholder, NO keypair', () => {
    const w = A.walletDescriptor('myzubster-child-0001');
    expect(w.address).toBe('configure-on-first-boot');
    expect(w.network).toBe('mainnet');
    expect(w.type).toBe('monero');
    expect(w.childId).toBe('myzubster-child-0001');
    expect(w.metadata.hasKeypair).toBe(false);
    expect(w.metadata.needsProvisioning).toBe(true);
  });
  test('descriptor contains NO seed/mnemonic/key fields', () => {
    const w = A.walletDescriptor('child-005');
    expect(w.seed).toBeUndefined();
    expect(w.mnemonic).toBeUndefined();
    expect(w.spendKey).toBeUndefined();
    expect(w.viewKey).toBeUndefined();
  });
  test('respects custom placeholder via opt', () => {
    const w = A.walletDescriptor('child-006', { walletAddressPlaceholder: 'TBD' });
    expect(w.address).toBe('TBD');
  });
  test('is deterministic (same input -> same output)', () => {
    const w1 = A.walletDescriptor('child-007');
    const w2 = A.walletDescriptor('child-007');
    expect(w1).toEqual(w2);
  });
  test('throws on non-string childId', () => {
    expect(() => A.walletDescriptor(123)).toThrow(TypeError);
  });
});

describe('registerOnMyZubster', () => {
  test('creates offline registration record', () => {
    const w = A.walletDescriptor('child-001');
    const r = A.registerOnMyZubster('child-001', w);
    expect(r.childId).toBe('child-001');
    expect(r.walletAddress).toBe('configure-on-first-boot');
    expect(r.status).toBe('registered');
    expect(r.endpoint).toBe('/offline/stub');
  });
  test('uses wallet address from descriptor', () => {
    const w = A.walletDescriptor('child-002', { walletAddressPlaceholder: 'placeholder-addr' });
    const r = A.registerOnMyZubster('child-002', w);
    expect(r.walletAddress).toBe('placeholder-addr');
  });
  test('throws on missing walletDesc', () => {
    expect(() => A.registerOnMyZubster('child-001', null)).toThrow(TypeError);
  });
});

describe('copyBaseSkills', () => {
  test('unions default skills with mother skills', () => {
    const r = A.copyBaseSkills(['sensor-reading']);
    expect(r.skills).toContain('navigation');
    expect(r.skills).toContain('charging');
    expect(r.skills).toContain('reporting');
    expect(r.skills).toContain('sensor-reading');
    expect(r.count).toBe(4);
  });
  test('deduplicates overlapping skills', () => {
    const r = A.copyBaseSkills(['navigation', 'navigation', 'custom']);
    expect(r.skills).toContain('navigation');
    expect(r.skills.filter(s => s === 'navigation').length).toBe(1);
    expect(r.count).toBe(4);  // 3 default + custom
  });
  test('uses defaults when mother has no skills', () => {
    const r = A.copyBaseSkills([]);
    expect(r.skills).toEqual(['navigation', 'charging', 'reporting']);
    expect(r.count).toBe(3);
  });
  test('throws on non-array', () => {
    expect(() => A.copyBaseSkills('nope')).toThrow(TypeError);
  });
});

describe('setReferrer', () => {
  test('links child to mother', () => {
    const r = A.setReferrer('child-001', 'mother-001');
    expect(r.childId).toBe('child-001');
    expect(r.referrer).toBe('mother-001');
    expect(r.linkType).toBe('mother-child');
  });
  test('throws on non-string IDs', () => {
    expect(() => A.setReferrer(123, 'mother')).toThrow(TypeError);
    expect(() => A.setReferrer('child', null)).toThrow(TypeError);
  });
});

describe('assignInheritedDNA', () => {
  test('inherits mother traits, no mutations', () => {
    const motherDNA = { traits: ['sturdy', 'energy-efficient'], mutations: ['mod-1'], parentDNA: 'grandmother' };
    const r = A.assignInheritedDNA('child-001', motherDNA);
    expect(r.childId).toBe('child-001');
    expect(r.traits).toEqual(['sturdy', 'energy-efficient']);
    expect(r.mutations).toEqual([]);  // no mutations on child
    expect(r.parentDNA).toBe('grandmother');
    expect(r.sourceDNA).toBe('mother');
  });
  test('uses defaults when motherDNA empty', () => {
    const r = A.assignInheritedDNA('child-002', { traits: [], mutations: [] });
    expect(r.traits).toEqual([]);
    expect(r.mutations).toEqual([]);
  });
  test('throws on non-string childId', () => {
    expect(() => A.assignInheritedDNA(123, {})).toThrow(TypeError);
  });
  test('throws on non-object motherDNA', () => {
    expect(() => A.assignInheritedDNA('child', null)).toThrow(TypeError);
  });
});

describe('autoConfigSequence', () => {
  const motherConfig = {
    motherId: 'mother-001',
    skills: ['sensor-reading', 'path-following'],
    dna: { traits: ['sturdy', 'efficient'], mutations: [], parentDNA: 'grandmother' },
  };
  test('produces ordered phases: assign_id -> wallet_descriptor -> register -> copy_skills -> set_referrer -> assign_dna -> complete', () => {
    const steps = A.autoConfigSequence(1, motherConfig);
    expect(steps[0].op).toBe('assign_id');
    expect(steps[steps.length - 1].op).toBe('complete');
    const ops = steps.map(s => s.op);
    expect(ops).toContain('assign_id');
    expect(ops).toContain('generate_wallet_descriptor');
    expect(ops).toContain('register');
    expect(ops).toContain('copy_skills');
    expect(ops).toContain('set_referrer');
    expect(ops).toContain('assign_dna');
    expect(ops).toContain('complete');
  });
  test('generates correct child ID from seq', () => {
    const steps = A.autoConfigSequence(42, motherConfig);
    expect(steps[0].childId).toBe('myzubster-child-0042');
  });
  test('wallet descriptor has no keypair', () => {
    const steps = A.autoConfigSequence(1, motherConfig);
    const walletStep = steps.find(s => s.op === 'generate_wallet_descriptor');
    expect(walletStep.descriptor.metadata.hasKeypair).toBe(false);
  });
  test('referrer matches motherId', () => {
    const steps = A.autoConfigSequence(1, motherConfig);
    const refStep = steps.find(s => s.op === 'set_referrer');
    expect(refStep.referrer).toBe('mother-001');
  });
  test('DNA inheritance includes mother traits', () => {
    const steps = A.autoConfigSequence(1, motherConfig);
    const dnaStep = steps.find(s => s.op === 'assign_dna');
    expect(dnaStep.dna.traits).toContain('sturdy');
    expect(dnaStep.dna.sourceDNA).toBe('mother');
  });
  test('skills combine defaults + mother skills', () => {
    const steps = A.autoConfigSequence(1, motherConfig);
    const skillsStep = steps.find(s => s.op === 'copy_skills');
    expect(skillsStep.skills).toContain('navigation');
    expect(skillsStep.skills).toContain('sensor-reading');
  });
  test('throws on missing motherConfig', () => {
    expect(() => A.autoConfigSequence(1, null)).toThrow(TypeError);
    expect(() => A.autoConfigSequence('1', {})).toThrow(TypeError);
  });
});

describe('accumulateEnergy', () => {
  test('sums microjoules and converts to mWh', () => {
    const r = A.accumulateEnergy([{ voltage_mV: 3300, current_mA: 50, duration_ms: 1000 }]);
    expect(r.totalMicroJoules).toBe(165000);
    expect(r.totalMilliWattHours).toBeCloseTo(165000 / 3600000, 6);
  });
  test('accumulates multiple samples', () => {
    const r = A.accumulateEnergy([
      { voltage_mV: 3000, current_mA: 40, duration_ms: 500 },
      { voltage_mV: 3600, current_mA: 60, duration_ms: 1000 },
    ]);
    expect(r.totalMicroJoules).toBe(3000 * 40 * 500 / 1000 + 3600 * 60 * 1000 / 1000);
  });
  test('throws on bad samples', () => {
    expect(() => A.accumulateEnergy([{voltage_mV:1}])).toThrow(TypeError);
    expect(() => A.accumulateEnergy('nope')).toThrow(TypeError);
  });
});
