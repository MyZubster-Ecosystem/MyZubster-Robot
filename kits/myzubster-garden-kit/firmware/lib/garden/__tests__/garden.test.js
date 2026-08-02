'use strict';
const G = require('../garden');

describe('mowerScheduler', () => {
  test('returns cut inside the allowed time window with dry soil', () => {
    expect(G.mowerScheduler(10, 30)).toBe('cut');
    expect(G.mowerScheduler(9.5, 20)).toBe('cut');
  });
  test('returns off_window before start hour', () => {
    expect(G.mowerScheduler(7, 30)).toBe('off_window');
    expect(G.mowerScheduler(0, 30)).toBe('off_window');
  });
  test('returns off_window at or after end hour', () => {
    expect(G.mowerScheduler(20, 30)).toBe('off_window');
    expect(G.mowerScheduler(23, 30)).toBe('off_window');
  });
  test('returns skip_wet when moisture exceeds threshold within window', () => {
    expect(G.mowerScheduler(10, 46)).toBe('skip_wet');
    expect(G.mowerScheduler(12, 50)).toBe('skip_wet');
  });
  test('respects custom window via opt', () => {
    expect(G.mowerScheduler(6, 30, { cutStartHour: 6, cutEndHour: 7 })).toBe('cut');
    expect(G.mowerScheduler(7, 30, { cutStartHour: 6, cutEndHour: 7 })).toBe('off_window');
  });
  test('rainGuard=false cuts even when wet', () => {
    expect(G.mowerScheduler(10, 90, { rainGuard: false, maxCutMoisturePct: 45 })).toBe('cut');
  });
  test('floor handles fractional hour at boundary', () => {
    expect(G.mowerScheduler(8.99, 30)).toBe('cut');
    expect(G.mowerScheduler(19.99, 30)).toBe('cut');
  });
  test('throws on non-number arguments', () => {
    expect(() => G.mowerScheduler('10', 30)).toThrow(TypeError);
    expect(() => G.mowerScheduler(10, null)).toThrow(TypeError);
  });
});

describe('boustrophedonPath', () => {
  test('produces back-and-forth rows spaced by swathWidth', () => {
    const path = G.boustrophedonPath(10, 1, { swathWidthM: 0.25 });
    // 4 rows of 0.25 -> Expect 5 turns at y=0.125,0.375,0.625,0.875
    expect(path.length).toBe(8);
    const ys = path.map(p => p.y);
    expect(ys).toContain(0.125);
    expect(ys).toContain(0.375);
    expect(ys).toContain(0.625);
    expect(ys).toContain(0.875);
  });
  test('first sweep goes right, second goes left', () => {
    const path = G.boustrophedonPath(5, 0.5, { swathWidthM: 0.25 });
    expect(path[0].dir).toBe('right');
    expect(path[0].x).toBe(0);
    expect(path[1].x).toBe(5);
    expect(path[2].dir).toBe('left');
    expect(path[2].x).toBe(5);
    expect(path[3].x).toBe(0);
  });
  test('last row is centered so the swath reaches the field edge', () => {
    const path = G.boustrophedonPath(8, 1, { swathWidthM: 0.3 });
    const ys = [...new Set(path.map(p => Math.round(p.y * 1e6)))];
    // last row center = fieldHeight - swath/2 = 1 - 0.15 = 0.85 (swath covers 0.7..1.0)
    expect(Math.max(...ys.map(v => v / 1e6))).toBe(0.85);
    expect(Math.min(...ys.map(v => v / 1e6))).toBe(0.15); // first row bisects first swath
  });
  test('number of rows is ceil(height / swath)', () => {
    const path = G.boustrophedonPath(10, 1, { swathWidthM: 0.22 });
    const rows = new Set(path.filter(p => p.dir === 'right' || p.dir === 'left').map(p => Math.round(p.y * 1e6)));
    // 1 / 0.22 = 4.54 -> 5 rows, but the row at y index 4 contains only endpoints with same y so 5 distinct y values
    expect(rows.size).toBeGreaterThanOrEqual(5);
  });
  test('throws on non-positive dimensions', () => {
    expect(() => G.boustrophedonPath(0, 5)).toThrow(RangeError);
    expect(() => G.boustrophedonPath(5, -1)).toThrow(RangeError);
  });
  test('throws on non-number dimensions', () => {
    expect(() => G.boustrophedonPath('10', 5)).toThrow(TypeError);
  });
});

describe('coverageArea', () => {
  test('full coverage equals field area when path covers all rows', () => {
    const path = G.boustrophedonPath(10, 1, { swathWidthM: 0.25 });
    const area = G.coverageArea(path, 10, 1, { swathWidthM: 0.25 });
    expect(area).toBe(10);
  });
  test('partial coverage when fewer rows than needed', () => {
    const path = [{ x: 0, y: 0.25, dir: 'right' }, { x: 10, y: 0.25, dir: 'right' }];
    const area = G.coverageArea(path, 10, 1, { swathWidthM: 0.25 });
    expect(area).toBeCloseTo(2.5, 5);
  });
  test('last partial row is clamped to remaining height', () => {
    const path = G.boustrophedonPath(10, 1, { swathWidthM: 0.3 });
    const area = G.coverageArea(path, 10, 1, { swathWidthM: 0.3 });
    expect(area).toBe(10);
  });
  test('coverage never exceeds total field area', () => {
    const path = G.boustrophedonPath(4, 1, { swathWidthM: 0.5 });
    const area = G.coverageArea(path, 4, 1, { swathWidthM: 0.5 });
    expect(area).toBeLessThanOrEqual(4);
  });
  test('throws on bad pathPoints', () => {
    expect(() => G.coverageArea(null, 10, 1)).toThrow(TypeError);
    expect(() => G.coverageArea([{}], 10, 1)).toThrow(TypeError);
  });
});

describe('irrigationScheduler', () => {
  const windows = [{ startHour: 6, endHour: 7, durationMin: 15 }, { startHour: 18, endHour: 19, durationMin: 20 }];
  test('active when hour falls in a scheduled window', () => {
    const r = G.irrigationScheduler(windows, 6, 30);
    expect(r.active).toBe(true);
    expect(r.reason).toBe('scheduled');
    expect(r.window.startHour).toBe(6);
    expect(r.durationMin).toBe(15);
  });
  test('saturated when moisture is above max threshold', () => {
    const r = G.irrigationScheduler(windows, 6, 71);
    expect(r.active).toBe(false);
    expect(r.reason).toBe('saturated');
  });
  test('dry_override triggers off-schedule when moisture is below min', () => {
    const r = G.irrigationScheduler(windows, 12, 20);
    expect(r.active).toBe(true);
    expect(r.reason).toBe('dry_override');
  });
  test('idle when no window matches and moisture is mid-range', () => {
    const r = G.irrigationScheduler(windows, 12, 45);
    expect(r.active).toBe(false);
    expect(r.reason).toBe('idle');
  });
  test('respects custom moisture thresholds', () => {
    const r = G.irrigationScheduler(windows, 12, 50, { moistureThresholdMin: 30, moistureThresholdMax: 60 });
    expect(r.reason).toBe('idle');
  });
  test('throws on bad entries', () => {
    expect(() => G.irrigationScheduler(null, 6, 30)).toThrow(TypeError);
    expect(() => G.irrigationScheduler([{ startHour: 'a', endHour: 7 }], 6, 30)).toThrow(TypeError);
  });
});

describe('weedClassifier', () => {
  test('tall green plant is a weed', () => {
    expect(G.weedClassifier(60, 0.8)).toBe('weed');
    expect(G.weedClassifier(55, 0.5)).toBe('weed');
  });
  test('short green plant is grass', () => {
    expect(G.weedClassifier(30, 0.7)).toBe('grass');
    expect(G.weedClassifier(40, 0.5)).toBe('grass');
  });
  test('low green density is bare soil', () => {
    expect(G.weedClassifier(50, 0.10)).toBe('bare_soil');
    expect(G.weedClassifier(0, 0.05)).toBe('bare_soil');
  });
  test('height between grassMax and weedMin is weed', () => {
    expect(G.weedClassifier(45, 0.6)).toBe('weed');
  });
  test('respects custom thresholds via opt', () => {
    expect(G.weedClassifier(35, 0.5, { weedHeightMinMm: 30, grassHeightMaxMm: 20 })).toBe('weed');
    expect(G.weedClassifier(15, 0.5, { weedHeightMinMm: 30, grassHeightMaxMm: 20 })).toBe('grass');
  });
  test('throws on non-number inputs', () => {
    expect(() => G.weedClassifier('30', 0.5)).toThrow(TypeError);
    expect(() => G.weedClassifier(30, undefined)).toThrow(TypeError);
  });
});

describe('gardenMap', () => {
  test('builds occupancy grid from sampled positions', () => {
    const positions = [{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }];
    const m = G.gardenMap(positions, { mapCellM: 0.5 });
    expect(m.rows).toBe(2);
    expect(m.cols).toBe(2);
    expect(m.visitedCells).toBe(4);
    expect(m.totalCells).toBe(4);
    expect(m.coverage).toBe(1);
    expect(m.grid[0]).toEqual([1, 1]);
    expect(m.grid[1]).toEqual([1, 1]);
  });
  test('deduplicates points in the same cell', () => {
    const positions = [{ x: 0, y: 0 }, { x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }];
    const m = G.gardenMap(positions, { mapCellM: 0.5 });
    expect(m.visitedCells).toBe(1);
    expect(m.coverage).toBe(1);
  });
  test('computes partial coverage', () => {
    const positions = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const m = G.gardenMap(positions, { mapCellM: 0.5 });
    expect(m.rows).toBe(3);
    expect(m.cols).toBe(3);
    expect(m.visitedCells).toBe(2);
    expect(m.coverage).toBeCloseTo(2 / 9, 5);
  });
  test('empty input returns zero coverage', () => {
    const m = G.gardenMap([], { mapCellM: 0.5 });
    expect(m.rows).toBe(0);
    expect(m.coverage).toBe(0);
  });
  test('throws on missing x or y', () => {
    expect(() => G.gardenMap([{ x: 1 }])).toThrow(TypeError);
  });
});

describe('gardenMission', () => {
  const plan = {
    field: { widthM: 6, heightM: 1 },
    irrigateWindows: [{ startHour: 6, endHour: 7, durationMin: 15 }],
    weederPoints: [{ heightMm: 60, greenDensity: 0.8 }, { heightMm: 30, greenDensity: 0.6 }],
    samples: [{ x: 0, y: 0 }, { x: 3, y: 0.5 }],
  };
  test('produces ordered phases: mow, irrigate, detect, map', () => {
    const steps = G.gardenMission(plan, { swathWidthM: 0.25 });
    const ops = steps.map(s => s.op.split('_')[0]);
    // All mow steps first, then irrigate, then detect, then map
    const phaseOrder = [];
    let last = '';
    for (const o of ops) { if (o !== last) phaseOrder.push(o); last = o; }
    expect(phaseOrder).toEqual(['mow', 'irrigate', 'detect', 'map']);
  });
  test('mow phase contains start, moves, and end', () => {
    const steps = G.gardenMission(plan, { swathWidthM: 0.25 });
    expect(steps[0].op).toBe('mow_start');
    expect(steps.some(s => s.op === 'mow_move')).toBe(true);
    expect(steps.some(s => s.op === 'mow_end')).toBe(true);
  });
  test('detect phase labels weeds and grass', () => {
    const steps = G.gardenMission(plan, { swathWidthM: 0.25 });
    const detects = steps.filter(s => s.op === 'detect');
    expect(detects.length).toBe(2);
    expect(detects[0].label).toBe('weed');
    expect(detects[1].label).toBe('grass');
    const end = steps.find(s => s.op === 'detect_end');
    expect(end.counts.weed).toBe(1);
    expect(end.counts.grass).toBe(1);
  });
  test('map end reports visited cells and coverage', () => {
    const steps = G.gardenMission(plan, { swathWidthM: 0.25, mapCellM: 1 });
    const mapEnd = steps.find(s => s.op === 'map_end');
    expect(mapEnd.visitedCells).toBeGreaterThan(0);
    expect(mapEnd.coverage).toBeGreaterThan(0);
  });
  test('throws on missing field', () => {
    expect(() => G.gardenMission({})).toThrow(TypeError);
  });
});

describe('accumulateEnergy', () => {
  test('sums microjoules and converts to mWh', () => {
    const r = G.accumulateEnergy([{ voltage_mV: 3300, current_mA: 100, duration_ms: 1000 }]);
    // 3300 * 100 * 1000 / 1000 = 330000 uJ
    expect(r.totalMicroJoules).toBe(330000);
    expect(r.totalMilliWattHours).toBeCloseTo(330000 / 3600000, 6);
  });
  test('accumulates multiple samples', () => {
    const r = G.accumulateEnergy([
      { voltage_mV: 3000, current_mA: 50, duration_ms: 2000 },
      { voltage_mV: 3600, current_mA: 80, duration_ms: 1000 },
    ]);
    expect(r.totalMicroJoules).toBe(3000 * 50 * 2000 / 1000 + 3600 * 80 * 1000 / 1000);
  });
  test('throws on bad sample fields', () => {
    expect(() => G.accumulateEnergy([{ voltage_mV: 3000 }])).toThrow(TypeError);
    expect(() => G.accumulateEnergy('nope')).toThrow(TypeError);
  });
});
