'use strict';
const L = require('../line');

describe('assemblyLineSequence', () => {
  test('produces 6 stations x 5 steps + init + complete = 32', () => {
    const steps = L.assemblyLineSequence({ stationCount: 6 });
    expect(steps[0].op).toBe('line_init');
    expect(steps[steps.length - 1].op).toBe('line_complete');
    expect(steps.length).toBe(32);
  });
  test('phases are ordered pick -> chassis -> board -> motors -> flash -> register', () => {
    const steps = L.assemblyLineSequence();
    const stations = steps.filter(s => s.op === 'station_enter');
    expect(stations.map(s => s.phase)).toEqual(['pick','chassis','board','motors','flash','register']);
  });
  test('conveyor advance after each station', () => {
    const steps = L.assemblyLineSequence();
    expect(steps.filter(s => s.op === 'conveyor_advance').length).toBe(6);
  });
  test('each execute step has arm control', () => {
    const steps = L.assemblyLineSequence();
    const execs = steps.filter(s => s.op === 'execute');
    expect(execs.length).toBe(6);
    execs.forEach(e => expect(e.arm.action).toBeTruthy());
  });
  test('quality step has checks per phase', () => {
    const steps = L.assemblyLineSequence();
    const quals = steps.filter(s => s.op === 'quality');
    expect(quals[0].checks).toContain('component_present');
    expect(quals[4].checks).toContain('firmware_checksum');
  });
});

describe('stationArmControl', () => {
  test('pick station grips and lifts', () => {
    const arm = L.stationArmControl(1, 'pick');
    expect(arm.action).toBe('grip_lift');
    expect(arm.gripper).toBe('close');
    expect(arm.lift_mm).toBe(40);
  });
  test('board station inserts down with open gripper', () => {
    const arm = L.stationArmControl(3, 'board');
    expect(arm.action).toBe('insert_down');
    expect(arm.gripper).toBe('open');
    expect(arm.lift_mm).toBe(5);
  });
  test('motors station rotates and connects', () => {
    const arm = L.stationArmControl(4, 'motors');
    expect(arm.action).toBe('connect');
    expect(arm.rotate_deg).toBe(45);
  });
  test('unknown phase returns idle', () => {
    const arm = L.stationArmControl(99, 'unknown');
    expect(arm.action).toBe('idle');
  });
  test('throws on non-number stationId', () => {
    expect(() => L.stationArmControl('1','pick')).toThrow(TypeError);
  });
  test('throws on non-string phase', () => {
    expect(() => L.stationArmControl(1, 123)).toThrow(TypeError);
  });
});

describe('stationChecks', () => {
  test('chassis station checks frame + screws', () => {
    const checks = L.stationChecks('chassis');
    expect(checks).toContain('frame_aligned');
    expect(checks).toContain('screws_tight');
  });
  test('flash station checks firmware + boot', () => {
    const checks = L.stationChecks('flash');
    expect(checks).toContain('firmware_checksum');
    expect(checks).toContain('boot_response');
  });
  test('register station checks id + schema', () => {
    const checks = L.stationChecks('register');
    expect(checks).toContain('id_assigned');
    expect(checks).toContain('schema_valid');
  });
  test('unknown phase returns empty array', () => {
    expect(L.stationChecks('foo')).toEqual([]);
  });
  test('throws on non-string', () => {
    expect(() => L.stationChecks(123)).toThrow(TypeError);
  });
});

describe('qualityGate', () => {
  test('all pass -> gate passes', () => {
    const r = L.qualityGate([
      { check: 'component_present', result: 'pass', durationMs: 100 },
      { check: 'grip_secure', result: 'pass', durationMs: 200 },
    ]);
    expect(r.pass).toBe(true);
    expect(r.failures).toEqual([]);
  });
  test('non-optional fail -> gate fails', () => {
    const r = L.qualityGate([
      { check: 'frame_aligned', result: 'fail', durationMs: 100 },
      { check: 'screws_tight', result: 'pass', durationMs: 100 },
    ]);
    expect(r.pass).toBe(false);
    expect(r.failures).toContain('frame_aligned');
  });
  test('optional fail does not fail gate', () => {
    const r = L.qualityGate([
      { check: 'cosmetic', result: 'fail', durationMs: 100, optional: true },
      { check: 'core', result: 'pass', durationMs: 100 },
    ]);
    expect(r.pass).toBe(true);
  });
  test('timeout fails gate', () => {
    const r = L.qualityGate([
      { check: 'slow', result: 'pass', durationMs: 45000, time_check: 'slow' },
    ]);
    expect(r.pass).toBe(false);
    expect(r.failures[0]).toContain('timeout');
  });
  test('empty results pass', () => {
    expect(L.qualityGate([]).pass).toBe(true);
  });
  test('throws on non-array', () => {
    expect(() => L.qualityGate('nope')).toThrow(TypeError);
  });
});

describe('wipTracker', () => {
  test('enter increments station count', () => {
    const r = L.wipTracker('enter', [0,0,0,0,0,0], 1);
    expect(r.state[0]).toBe(1);
    expect(r.total).toBe(1);
  });
  test('exit decrements station count', () => {
    const r = L.wipTracker('exit', [1,0,0,0,0,0], 1);
    expect(r.state[0]).toBe(0);
    expect(r.total).toBe(0);
    expect(r.removed).toBe(true);
  });
  test('exit on empty station returns removed=false', () => {
    const r = L.wipTracker('exit', [0,0,0,0,0,0], 3);
    expect(r.removed).toBe(false);
  });
  test('snapshot reports totals', () => {
    const r = L.wipTracker('snapshot', [2,1,0,0,0,0], 1);
    expect(r.total).toBe(3);
    expect(r.perStation[0]).toBe(2);
  });
  test('throws on out-of-range station', () => {
    expect(() => L.wipTracker('enter', [0,0,0,0,0,0], 7, {stationCount:6})).toThrow(RangeError);
    expect(() => L.wipTracker('enter', [0,0,0,0,0,0], 0)).toThrow(RangeError);
  });
  test('throws on bad action', () => {
    expect(() => L.wipTracker('foo', [], 1)).toThrow(TypeError);
  });
});

describe('throughputEstimator', () => {
  test('bottleneck station determines rate', () => {
    const r = L.throughputEstimator([4000, 5000, 3000, 6000, 4000, 2000]);
    expect(r.bottleneckStation).toBe(4);
    expect(r.maxCycleMs).toBe(6000);
    expect(r.unitsPerHour).toBe(Math.round(3600000 / 6000 * 100) / 100);
  });
  test('meets target when rate >= target', () => {
    const r = L.throughputEstimator([5000,5000,5000,5000,5000,5000], {targetUnitsPerHour:10});
    expect(r.unitsPerHour).toBeCloseTo(720, 0);
    expect(r.meetsTarget).toBe(true);
  });
  test('below target when slow bottleneck', () => {
    const r = L.throughputEstimator([30000,30000,30000,30000,30000,30000], {targetUnitsPerHour:200});
    expect(r.meetsTarget).toBe(false);
  });
  test('empty array returns zero', () => {
    expect(L.throughputEstimator([]).unitsPerHour).toBe(0);
  });
  test('throws on non-number entries', () => {
    expect(() => L.throughputEstimator([1000,'bad',3000])).toThrow(TypeError);
  });
});

describe('lineBalancer', () => {
  test('balanced when all stations meet target', () => {
    const r = L.lineBalancer([5000,5000,5000,5000,5000,5000], {targetUnitsPerHour:10});
    expect(r.balanced).toBe(true);
    expect(r.suggestion).toBe('none');
  });
  test('unbalanced suggests bottleneck fix', () => {
    const r = L.lineBalancer([3000,3000,3000,15000,3000,3000], {targetUnitsPerHour:300});
    expect(r.balanced).toBe(false);
    expect(r.bottleneckStation).toBe(4);
    expect(r.suggestedCycleMs).toBe(Math.round(3600000/300));
    expect(r.suggestion).toContain('station 4');
  });
  test('suggested cycle = 3600000 / target', () => {
    const r = L.lineBalancer([10000,10000,10000,20000,10000,10000], {targetUnitsPerHour:200});
    expect(r.suggestedCycleMs).toBe(Math.round(3600000/200));
  });
});

describe('accumulateEnergy', () => {
  test('sums microjoules', () => {
    const r = L.accumulateEnergy([{ voltage_mV: 5000, current_mA: 150, duration_ms: 1000 }]);
    expect(r.totalMicroJoules).toBe(750000);
  });
  test('converts to mWh', () => {
    const r = L.accumulateEnergy([{ voltage_mV: 5000, current_mA: 150, duration_ms: 1000 }]);
    expect(r.totalMilliWattHours).toBeCloseTo(750000/3600000, 6);
  });
  test('accumulates multiple', () => {
    const r = L.accumulateEnergy([
      { voltage_mV: 4000, current_mA: 100, duration_ms: 500 },
      { voltage_mV: 5000, current_mA: 200, duration_ms: 1000 },
    ]);
    expect(r.totalMicroJoules).toBe(4000*100*500/1000 + 5000*200*1000/1000);
  });
  test('throws on bad samples', () => {
    expect(() => L.accumulateEnergy([{voltage_mV:1}])).toThrow(TypeError);
    expect(() => L.accumulateEnergy('nope')).toThrow(TypeError);
  });
});
