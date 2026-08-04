'use strict';
const agri = require('../agri');

describe('agri.moistureToPercent', () => {
  test('clamps dry (raw >= dryRaw) to 0%', () => {
    expect(agri.moistureToPercent(3500)).toBe(0);
    expect(agri.moistureToPercent(4095)).toBe(0);
  });
  test('clamps saturated (raw <= wetRaw) to 100%', () => {
    expect(agri.moistureToPercent(1300)).toBe(100);
    expect(agri.moistureToPercent(0)).toBe(100);
  });
  test('linear mid-point maps to 50%', () => {
    // midpoint of 3500 and 1300 = 2400 => (3500-2400)/(3500-1300) = 1100/2200 = 50%
    expect(agri.moistureToPercent(2400)).toBe(50);
  });
  test('respects a custom calibration band', () => {
    expect(agri.moistureToPercent(3000, { dryRaw: 3000, wetRaw: 1000 })).toBe(0);
    expect(agri.moistureToPercent(1000, { dryRaw: 3000, wetRaw: 1000 })).toBe(100);
    expect(agri.moistureToPercent(2000, { dryRaw: 3000, wetRaw: 1000 })).toBe(50);
  });
  test('rejects non-numeric input', () => {
    expect(() => agri.moistureToPercent(NaN)).toThrow(TypeError);
  });
});

describe('agri.weatherFactor', () => {
  test('default 1.0 when forecast is null', () => {
    expect(agri.weatherFactor(null)).toBe(1.0);
  });
  test('rain expected returns the configured rainFactor (0.5)', () => {
    expect(agri.weatherFactor({ rainExpected: true })).toBe(0.5);
  });
  test('no rain returns 1.0', () => {
    expect(agri.weatherFactor({ rainExpected: false })).toBe(1.0);
  });
  test('respects a custom rainFactor', () => {
    expect(agri.weatherFactor({ rainExpected: true }, { rainFactor: 0.25 })).toBe(0.25);
  });
});

describe('agri.decideIrrigation', () => {
  test('irrigate when below the dry threshold (25 < 30)', () => {
    expect(agri.decideIrrigation(25, null)).toBe('irrigate');
  });
  test('wait when at/above the wet threshold (60 >= 60)', () => {
    expect(agri.decideIrrigation(60, null)).toBe('wait');
    expect(agri.decideIrrigation(75, null)).toBe('wait');
  });
  test('wait inside the middle band (45 between 30 and 60) - soak hysteresis', () => {
    expect(agri.decideIrrigation(45, null)).toBe('wait');
  });
  test('defaults to irrigate at the dry edge (29)', () => {
    expect(agri.decideIrrigation(29, null)).toBe('irrigate');
  });
  test('respects custom dry threshold', () => {
    expect(agri.decideIrrigation(15, null, { dryThreshold: 20 })).toBe('irrigate');
    expect(agri.decideIrrigation(25, null, { dryThreshold: 20 })).toBe('wait');
  });
});

describe('agri.valveControl', () => {
  test('valve closed with zero duration when waiting', () => {
    const v = agri.valveControl(75, null);
    expect(v.open).toBe(false);
    expect(v.duration_ms).toBe(0);
    expect(v.decision).toBe('wait');
  });
  test('valve opens when irrigating; duration = deficit * perPercentMs', () => {
    // moisture 20, deficit = 30 - 20 = 10 => 10 * 1000 = 10_000 ms
    const v = agri.valveControl(20, null);
    expect(v.open).toBe(true);
    expect(v.duration_ms).toBe(10_000);
    expect(v.rainFactor).toBe(1.0);
  });
  test('rain forecast halves the duration (factor 0.5)', () => {
    // moisture 20, deficit 10 => 10 * 1000 * 0.5 = 5_000
    const v = agri.valveControl(20, { rainExpected: true });
    expect(v.open).toBe(true);
    expect(v.duration_ms).toBe(5_000);
    expect(v.rainFactor).toBe(0.5);
  });
  test('duration capped at maxValveDurationMs', () => {
    // default moisture 0, deficit 30 => 30 * 1000 = 30_000, under the 60_000 cap
    const v = agri.valveControl(0, null);
    expect(v.duration_ms).toBe(30_000);
    // custom dryThreshold 100, perPercentMs 2000 => 100 * 2000 = 200_000, capped to 60_000
    const v2 = agri.valveControl(0, null, { dryThreshold: 100, perPercentMs: 2000, maxValveDurationMs: 60_000 });
    expect(v2.open).toBe(true);
    expect(v2.duration_ms).toBe(60_000);
  });
});

describe('agri.accumulateEnergy', () => {
  test('uJ = mV*mA*ms/1000, mWh = uJ/3_600_000', () => {
    const e = agri.accumulateEnergy([{ voltage_mV: 3300, current_mA: 100, duration_ms: 1000 }]);
    // uJ = 3300*100*1000/1000 = 330_000 ; mWh = 330_000 / 3_600_000 ~= 0.0917
    expect(e.totalMicroJoules).toBe(330_000);
    expect(e.totalMilliWattHours).toBeCloseTo(330000 / 3_600_000, 6);
  });
  test('yields 0 with empty input', () => {
    const e = agri.accumulateEnergy([]);
    expect(e.totalMicroJoules).toBe(0);
    expect(e.totalMilliWattHours).toBe(0);
  });
  test('rejects malformed sample shape', () => {
    expect(() => agri.accumulateEnergy([{ voltage_mV: 100 }])).toThrow(TypeError);
    expect(() => agri.accumulateEnergy('x')).toThrow(TypeError);
  });
});
