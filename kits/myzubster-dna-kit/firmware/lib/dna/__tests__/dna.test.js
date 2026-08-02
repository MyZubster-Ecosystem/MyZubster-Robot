'use strict';
const dna = require('../dna');

describe('dna.createDNA', () => {
  test('factory fills defaults for a mother robot (generation 0, no parentRef)', () => {
    const r = dna.createDNA({ id: 'mother-0', robotType: 'mother' });
    expect(r.id).toBe('mother-0');
    expect(r.robotType).toBe('mother');
    expect(r.skills).toEqual([]);
    expect(r.reputation).toBe(0);
    expect(r.jobsCompleted).toBe(0);
    expect(r.walletAddress).toBeNull();
    expect(r.hardwareConfig).toEqual({});
    expect(r.learningLog).toEqual([]);
    expect(r.genealogy).toEqual({ parentRef: null, generation: 0 });
  });
  test('accepts skills with level clamped to [0,100]', () => {
    const r = dna.createDNA({ robotType: 'agri', skills: [{ skill: 'irrigate', level: 250 }] });
    expect(r.skills[0]).toEqual({ skill: 'irrigate', level: 100 });
  });
  test('rejects unknown robotType', () => {
    expect(() => dna.createDNA({ robotType: 'spaceship' })).toThrow(TypeError);
  });
  test('rejects non-string robotType', () => {
    expect(() => dna.createDNA({ robotType: 42 })).toThrow(TypeError);
  });
  test('walletAddress is modeled as nullable string (never generated here)', () => {
    const r = dna.createDNA({ robotType: 'agri', walletAddress: '4B3v5k44...' });
    expect(r.walletAddress).toBe('4B3v5k44...');
    const r2 = dna.createDNA({ robotType: 'agri' });
    expect(r2.walletAddress).toBeNull();
  });
});

describe('dna.readDNA', () => {
  test('returns the requested field value (documented local accessor)', () => {
    const r = dna.createDNA({ id: 'r1', robotType: 'agri', reputation: 42 });
    expect(dna.readDNA(r, 'robotType')).toBe('agri');
    expect(dna.readDNA(r, 'reputation')).toBe(42);
  });
  test('rejects unknown field names', () => {
    const r = dna.createDNA({ id: 'r1', robotType: 'eco' });
    expect(() => dna.readDNA(r, 'secret')).toThrow(TypeError);
  });
  test('rejects non-record input', () => {
    expect(() => dna.readDNA(null, 'robotType')).toThrow(TypeError);
  });
});

describe('dna.inheritance', () => {
  test('child inherits robotType, parents hardwareConfig, genealogy depth+1, fresh reputation', () => {
    const mother = dna.createDNA({
      id: 'mother-0', robotType: 'agri',
      reputation: 80, jobsCompleted: 12,
      hardwareConfig: { mcu: 'esp32', motor: 'drv8833' },
      genealogy: { parentRef: null, generation: 0 },
    });
    const child = dna.inheritance(mother, { id: 'child-1' });
    expect(child.id).toBe('child-1');
    expect(child.robotType).toBe('agri');
    expect(child.reputation).toBe(0);
    expect(child.jobsCompleted).toBe(0);
    expect(child.genealogy).toEqual({ parentRef: 'mother-0', generation: 1 });
    expect(child.hardwareConfig.mcu).toBe('esp32');
    expect(child.learningLog).toEqual([]);
  });
  test('child inherits parent.skills deep + new skills bumped onto existing', () => {
    const mother = dna.createDNA({ id: 'm', robotType: 'agri', skills: [{ skill: 'irrigate', level: 30 }] });
    const child = dna.inheritance(mother, { id: 'c', skills: [{ skill: 'irrigate', level: 20 }, { skill: 'sense', level: 50 }] });
    expect(child.skills.find(s => s.skill === 'irrigate').level).toBe(50);
    expect(child.skills.find(s => s.skill === 'sense').level).toBe(50);
  });
  test('child inherits walletAddress literally (no generation, no signing)', () => {
    const mother = dna.createDNA({ id: 'm', robotType: 'agri', walletAddress: '4ABCparent' });
    const child = dna.inheritance(mother, { id: 'c' });
    expect(child.walletAddress).toBe('4ABCparent');
  });
  test('child can override robotType and merge hardwareConfig', () => {
    const mother = dna.createDNA({ id: 'm', robotType: 'agri', hardwareConfig: { mcu: 'esp32' } });
    const child = dna.inheritance(mother, { id: 'c', robotType: 'drone', hardwareConfig: { rotor: 'brushed' } });
    expect(child.robotType).toBe('drone');
    expect(child.hardwareConfig).toEqual({ mcu: 'esp32', rotor: 'brushed' });
  });
});

describe('dna.mutate', () => {
  test('applying a skill bump raises the level (clamped) and appends a learning lesson', () => {
    const r = dna.createDNA({ id: 'r', robotType: 'agri', skills: [{ skill: 'irrigate', level: 30 }] });
    const m = dna.mutate(r, { skill: 'irrigate', levelDelta: 20, learningLesson: 'learned drip scheduling' });
    expect(m.skills.find(s => s.skill === 'irrigate').level).toBe(50);
    expect(m.learningLog.length).toBe(1);
    expect(m.learningLog[0].lesson).toBe('learned drip scheduling');
  });
  test('new skill is added if it did not exist', () => {
    const r = dna.createDNA({ id: 'r', robotType: 'agri' });
    const m = dna.mutate(r, { skill: 'sense', levelDelta: 40 });
    expect(m.skills.find(s => s.skill === 'sense').level).toBe(40);
  });
  test('level caps at 100 (bounded, deterministic)', () => {
    const r = dna.createDNA({ id: 'r', robotType: 'agri', skills: [{ skill: 'irrigate', level: 95 }] });
    const m = dna.mutate(r, { skill: 'irrigate', levelDelta: 20 });
    expect(m.skills.find(s => s.skill === 'irrigate').level).toBe(100);
  });
  test('mutate does not mutate the input DNA in place', () => {
    const r = dna.createDNA({ id: 'r', robotType: 'agri', skills: [{ skill: 'x', level: 10 }] });
    const snapshot = JSON.parse(JSON.stringify(r));
    dna.mutate(r, { skill: 'x', levelDelta: 5 });
    expect(r).toEqual(snapshot);
  });
});

describe('dna.genealogyTree', () => {
  test('builds the parent->children map from a record list (mother + 2 children + 1 grandchild)', () => {
    const mother = dna.createDNA({ id: 'm', robotType: 'mother', genealogy: { parentRef: null, generation: 0 } });
    const c1 = dna.createDNA({ id: 'c1', robotType: 'agri', genealogy: { parentRef: 'm', generation: 1 } });
    const c2 = dna.createDNA({ id: 'c2', robotType: 'eco', genealogy: { parentRef: 'm', generation: 1 } });
    const g1 = dna.createDNA({ id: 'g1', robotType: 'agri', genealogy: { parentRef: 'c1', generation: 2 } });
    const t = dna.genealogyTree([mother, c1, c2, g1]);
    expect(t.rootIds).toEqual(['m']);
    expect(t.nodes.get('m')).toEqual(['c1', 'c2']);
    expect(t.nodes.get('c1')).toEqual(['g1']);
    expect(t.nodes.get('c2')).toEqual([]);
    expect(t.nodes.get('g1')).toEqual([]);
  });
  test('records whose parentRef is null become roots', () => {
    const mother = dna.createDNA({ id: 'm', robotType: 'mother' });
    const t = dna.genealogyTree([mother]);
    expect(t.rootIds).toEqual(['m']);
  });
  test('orphan-safe: a record whose parent is missing is a root', () => {
    const g = dna.createDNA({ id: 'g', robotType: 'agri', genealogy: { parentRef: 'ghost', generation: 5 } });
    const t = dna.genealogyTree([g]);
    expect(t.rootIds).toEqual(['g']);
  });
  test('rejects duplicate ids', () => {
    const a = dna.createDNA({ id: 'dup', robotType: 'agri' });
    const b = dna.createDNA({ id: 'dup', robotType: 'eco' });
    expect(() => dna.genealogyTree([a, b])).toThrow(Error);
  });
});

describe('dna.genealogySummary', () => {
  test('walks depth-first with generation + counts', () => {
    const m = dna.createDNA({ id: 'm', robotType: 'mother' });
    const c = dna.inheritance(m, { id: 'c' });
    const g = dna.inheritance(c, { id: 'g' });
    const s = dna.genealogySummary([m, c, g]);
    expect(s.length).toBe(3);
    expect(s[0]).toMatchObject({ id: 'm', depth: 0, generation: 0, children: 1 });
    expect(s[1]).toMatchObject({ id: 'c', depth: 1, generation: 1, children: 1 });
    expect(s[2]).toMatchObject({ id: 'g', depth: 2, generation: 2, children: 0 });
  });
});
