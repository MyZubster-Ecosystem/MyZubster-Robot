'use strict';
const eco = require('../eco');

describe('eco.decideSleep', () => {
  test('active when below the light threshold', () => {
    expect(eco.decideSleep(2000)).toBe('active');
    expect(eco.decideSleep(9999)).toBe('active');
  });
  test('light between the light and deep thresholds', () => {
    expect(eco.decideSleep(10000)).toBe('light');
    expect(eco.decideSleep(30000)).toBe('light');
    expect(eco.decideSleep(59999)).toBe('light');
  });
  test('deep at/above the deep threshold', () => {
    expect(eco.decideSleep(60000)).toBe('deep');
    expect(eco.decideSleep(120000)).toBe('deep');
  });
  test('respects custom thresholds', () => {
    expect(eco.decideSleep(4000, { lightMs: 5000, deepMs: 15000 })).toBe('active');
    expect(eco.decideSleep(8000, { lightMs: 5000, deepMs: 15000 })).toBe('light');
    expect(eco.decideSleep(20000, { lightMs: 5000, deepMs: 15000 })).toBe('deep');
  });
});

describe('eco.motorStandby', () => {
  test('false below the idle threshold', () => {
    expect(eco.motorStandby(0)).toBe(false);
    expect(eco.motorStandby(2999)).toBe(false);
  });
  test('true at/above the idle threshold', () => {
    expect(eco.motorStandby(3000)).toBe(true);
    expect(eco.motorStandby(120000)).toBe(true);
  });
  test('custom idle threshold', () => {
    expect(eco.motorStandby(9000, { motorIdleMs: 10000 })).toBe(false);
    expect(eco.motorStandby(10000, { motorIdleMs: 10000 })).toBe(true);
  });
});

describe('eco.rampDown', () => {
  test('produces a descending ladder to the floor', () => {
    const r = eco.rampDown(255, 5, 0);
    expect(r).toHaveLength(5);
    expect(r[0]).toBe(255);
    expect(r[4]).toBe(0);
    // strictly non-increasing
    let ok = true;
    for (let i = 1; i < r.length; i++) if (r[i] > r[i - 1]) ok = false;
    expect(ok).toBe(true);
  });
  test('respects a custom floor', () => {
    const r = eco.rampDown(255, 4, 60);
    expect(r[0]).toBe(255);
    expect(r[r.length - 1]).toBe(60);
    for (const v of r) expect(v).toBeGreaterThanOrEqual(60);
  });
  test('clamps to a minimum of 2 steps', () => {
    const r = eco.rampDown(200, 1, 0);
    expect(r.length).toBeGreaterThanOrEqual(2);
  });
});

describe('eco.accumulateEnergy', () => {
  test('1 h at 3.3 V / 100 mA = 330 mWh', () => {
    const e = eco.accumulateEnergy([{ voltage_mV: 3300, current_mA: 100, duration_ms: 3_600_000 }]);
    expect(e.totalMicroJoules).toBe(1_188_000_000);
    expect(e.totalMilliWattHours).toBeCloseTo(330, 5);
  });
  test('aggregates multiple samples', () => {
    const s = [
      { voltage_mV: 3300, current_mA: 50, duration_ms: 1_800_000 },
      { voltage_mV: 3300, current_mA: 50, duration_ms: 1_800_000 },
    ];
    expect(eco.totalMilliWattHours(s)).toBeCloseTo(165, 5);  // 2 x 82.5 mWh
  });
  test('zero samples = zero energy', () => {
    expect(eco.accumulateEnergy([])).toEqual({ totalMicroJoules: 0, totalMilliWattHours: 0 });
  });
  test('rejects malformed samples', () => {
    expect(() => eco.accumulateEnergy('x')).toThrow();
    expect(() => eco.accumulateEnergy([{ voltage_mV: 1 }])).toThrow();
  });
});
