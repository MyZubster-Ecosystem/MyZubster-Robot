'use strict';
const api = require('../api/genealogy');
const { RECORDS } = require('../data/sample-lineage');

describe('api.getGenealogyTree', () => {
  test('builds { rootIds, nodes } from the sample-lineage fixture', () => {
    const t = api.getGenealogyTree(RECORDS);
    expect(t.rootIds).toEqual(['mother-0']);
    expect(t.nodes['mother-0']).toEqual(['child-1']);
    expect(t.nodes['child-1']).toEqual(['grandchild-1']);
    expect(t.nodes['grandchild-1']).toEqual([]);
  });
  test('rejects duplicate ids', () => {
    const dup = [{ id: 'x', robotType: 'agri', genealogy: { parentRef: null } }, { id: 'x', robotType: 'eco' }];
    expect(() => api.getGenealogyTree(dup)).toThrow(/duplicate/);
  });
  test('orphan-safe: missing parent becomes a root', () => {
    const orphan = [{ id: 'orphan-1', robotType: 'agri', genealogy: { parentRef: 'ghost' } }];
    const t = api.getGenealogyTree(orphan);
    expect(t.rootIds).toEqual(['orphan-1']);
  });
});

describe('api.getRobotGenealogy', () => {
  test('returns ancestor path + children for the grandchild', () => {
    const g = api.getRobotGenealogy(RECORDS, 'grandchild-1');
    expect(g.id).toBe('grandchild-1');
    expect(g.children).toEqual([]);
    expect(g.ancestorPath).toEqual(['mother-0', 'child-1', 'grandchild-1']);
  });
  test('throws on unknown id', () => {
    expect(() => api.getRobotGenealogy(RECORDS, 'does-not-exist')).toThrow(/unknown robot/);
  });
});

describe('api.getMetrics', () => {
  test('aggregates totalRobots / totalJobs / totalFee / activeCount', () => {
    const m = api.getMetrics(RECORDS);
    expect(m.totalRobots).toBe(3);
    expect(m.totalJobs).toBe(30);     // mother 30 + child 0 + grandchild 0
    expect(m.totalFee).toBeCloseTo(0.0012, 6);
    expect(m.activeCount).toBe(2);    // mother 'active' + grandchild 'learning'
  });
  test('rejects non-array input', () => {
    expect(() => api.getMetrics(null)).toThrow(TypeError);
  });
});

describe('api.searchAndFilter', () => {
  test('queryText matches the id field', () => {
    expect(api.searchAndFilter(RECORDS, { queryText: 'mother' }).map(r => r.id)).toEqual(['mother-0']);
  });
  test('queryText matches a skill tag', () => {
    expect(api.searchAndFilter(RECORDS, { queryText: 'fast-charge' }).map(r => r.id)).toEqual(['child-1', 'grandchild-1']);
  });
  test('robotType filter narrows the set', () => {
    const r = api.searchAndFilter(RECORDS, { robotType: 'eco' });
    expect(r).toEqual([]);
    const all = api.searchAndFilter(RECORDS, { robotType: 'agri' });
    expect(all.length).toBe(3);
  });
  test('both filters combine', () => {
    expect(api.searchAndFilter(RECORDS, { robotType: 'agri', queryText: 'mother' }).map(r => r.id)).toEqual(['mother-0']);
  });
});
