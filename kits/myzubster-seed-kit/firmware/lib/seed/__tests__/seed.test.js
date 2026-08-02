'use strict';
const seed = require('../seed');

describe('parseNMEA', () => {
  test('parses a valid $GPGGA sentence', () => {
    // Cesena, Italy: 44.1397N 12.2422E
    const r = seed.parseNMEA('$GPGGA,123519,4413.782,N,01214.532,E,1,08,0.9,545.4,M,47.0,M,,*47');
    expect(r.valid).toBe(true);
    expect(r.lat).toBeCloseTo(44 + 13.782 / 60, 4);
    expect(r.lon).toBeCloseTo(12 + 14.532 / 60, 4);
    expect(r.fix).toBe(1);
    expect(r.sats).toBe(8);
  });
  test('returns invalid for no-fix GGA', () => {
    const r = seed.parseNMEA('$GPGGA,123519,4807.038,N,01131.000,E,0,00,99.0,,,,*XX');
    expect(r.valid).toBe(false);
  });
  test('parses $GPRMC with status A (active)', () => {
    const r = seed.parseNMEA('$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A');
    expect(r.valid).toBe(true);
    expect(r.lat).toBeCloseTo(48 + 7.038 / 60, 4);
    expect(r.lon).toBeCloseTo(11 + 31.0 / 60, 4);
  });
  test('handles S/W negative hemisphere', () => {
    const r = seed.parseNMEA('$GPGGA,100000,3412.345,S,05830.678,W,1,05,1.0,50.0,M,,*XX');
    expect(r.valid).toBe(true);
    expect(r.lat).toBeCloseTo(-(34 + 12.345 / 60), 4);
    expect(r.lon).toBeCloseTo(-(58 + 30.678 / 60), 4);
  });
  test('returns invalid for non-NMEA string', () => {
    const r = seed.parseNMEA('hello world');
    expect(r.valid).toBe(false);
  });
});

describe('gpsToGrid', () => {
  test('origin maps to row 0 col 0', () => {
    const origin = { lat: 44.1397, lon: 12.2422 };
    const g = seed.gpsToGrid(44.1397, 12.2422, origin);
    expect(g.row).toBe(0);
    expect(g.col).toBe(0);
  });
  test('north offset maps to positive row', () => {
    const origin = { lat: 44.1397, lon: 12.2422 };
    // 1 degree N latitude ~ 111 km, so 0.005 deg ~ 555 m -> ~1110 rows at 0.5 m spacing
    const g = seed.gpsToGrid(44.1447, 12.2422, origin);
    expect(g.row).toBeGreaterThan(0);
  });
  test('west offset maps to negative col', () => {
    const origin = { lat: 44.1397, lon: 12.2422 };
    const g = seed.gpsToGrid(44.1397, 12.2372, origin);
    expect(g.col).toBeLessThan(0);
    expect(g.row).toBe(0);
  });
  test('1 m north at 0.5 m spacing => row 2', () => {
    const origin = { lat: 44.0, lon: 12.0 };
    const dLat = 1 / 111000; // ~1 m north
    const g = seed.gpsToGrid(44.0 + dLat, 12.0, origin, { gridSpacingM: 0.5 });
    expect(g.row).toBe(2);
  });
});

describe('dibberAngle', () => {
  test('depth 0 => rest angle', () => {
    expect(seed.dibberAngle(0)).toBe(90);
  });
  test('max depth => down angle', () => {
    expect(seed.dibberAngle(30)).toBe(20);
  });
  test('depth beyond max clamps to down angle', () => {
    expect(seed.dibberAngle(999)).toBe(20);
  });
  test('negative depth clamps to rest', () => {
    expect(seed.dibberAngle(-5)).toBe(90);
  });
  test('mid depth interpolates linearly', () => {
    // 15 mm = half of 30 => angle = 90 - 0.5 * (90-20) = 90 - 35 = 55
    expect(seed.dibberAngle(15)).toBe(55);
  });
});

describe('dispenserSteps', () => {
  test('1 seed => stepsPerRev / slotsPerRev = 4096 / 8 = 512', () => {
    expect(seed.dispenserSteps(1)).toBe(512);
  });
  test('0 seeds => 0 steps', () => {
    expect(seed.dispenserSteps(0)).toBe(0);
  });
  test('3 seeds => 1536 steps', () => {
    expect(seed.dispenserSteps(3)).toBe(1536);
  });
  test('negative => 0', () => {
    expect(seed.dispenserSteps(-1)).toBe(0);
  });
});

describe('coverAngle', () => {
  test('push => push angle', () => {
    expect(seed.coverAngle(true)).toBe(40);
  });
  test('rest => rest angle', () => {
    expect(seed.coverAngle(false)).toBe(110);
  });
});

describe('growthMonitor', () => {
  test('optimal conditions => plant', () => {
    expect(seed.growthMonitor(50, 20)).toBe('plant');
  });
  test('too dry => wait_dry', () => {
    expect(seed.growthMonitor(15, 20)).toBe('wait_dry');
  });
  test('too wet => wait_wet', () => {
    expect(seed.growthMonitor(90, 20)).toBe('wait_wet');
  });
  test('too cold => wait_cold', () => {
    expect(seed.growthMonitor(50, 5)).toBe('wait_cold');
  });
  test('too hot => wait_hot', () => {
    expect(seed.growthMonitor(50, 40)).toBe('wait_hot');
  });
});

describe('plantingMission', () => {
  test('single position => 4 steps (move dig seed cover)', () => {
    const steps = seed.plantingMission([{ row: 0, col: 0 }]);
    expect(steps).toHaveLength(4);
    expect(steps[0].op).toBe('move');
    expect(steps[1].op).toBe('dig');
    expect(steps[2].op).toBe('seed');
    expect(steps[3].op).toBe('cover');
  });
  test('three positions => 12 steps', () => {
    const steps = seed.plantingMission([
      { row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }
    ]);
    expect(steps).toHaveLength(12);
  });
  test('dig step includes angle + depth', () => {
    const steps = seed.plantingMission([{ row: 5, col: 3 }]);
    const dig = steps.find(s => s.op === 'dig');
    expect(dig.depthMm).toBe(30);
    expect(dig.angle).toBe(20);
  });
  test('seed step includes stepper count', () => {
    const steps = seed.plantingMission([{ row: 0, col: 0 }]);
    const sd = steps.find(s => s.op === 'seed');
    expect(sd.seeds).toBe(1);
    expect(sd.steps).toBe(512);
  });
  test('cover step includes push angle', () => {
    const steps = seed.plantingMission([{ row: 0, col: 0 }]);
    const cov = steps.find(s => s.op === 'cover');
    expect(cov.angle).toBe(40);
  });
  test('throws on non-array', () => {
    expect(() => seed.plantingMission(null)).toThrow(TypeError);
  });
});

describe('accumulateEnergy', () => {
  test('single sample', () => {
    const e = seed.accumulateEnergy([{ voltage_mV: 5000, current_mA: 200, duration_ms: 1000 }]);
    // uJ = (5000 * 200 * 1000) / 1000 = 1000000 uJ = 1 J
    expect(e.totalMicroJoules).toBe(1000000);
    expect(e.totalMilliWattHours).toBeCloseTo(1 / 3.6, 4);
  });
  test('empty array => 0', () => {
    const e = seed.accumulateEnergy([]);
    expect(e.totalMicroJoules).toBe(0);
  });
  test('throws on bad sample', () => {
    expect(() => seed.accumulateEnergy([{ voltage_mV: 5000 }])).toThrow(TypeError);
  });
});
