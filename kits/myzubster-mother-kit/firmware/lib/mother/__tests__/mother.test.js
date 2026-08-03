'use strict';
const M = require('../mother');

describe('componentInventory', () => {
  test('add component to empty magazine', () => {
    const r = M.componentInventory('add', [], 'ESP32');
    expect(r.added).toBe(true);
    expect(r.state).toEqual(['ESP32']);
    expect(r.full).toBe(false);
  });
  test('remove existing component', () => {
    const r = M.componentInventory('remove', ['ESP32', 'N20-motor', 'ultrasonic'], 'N20-motor');
    expect(r.removed).toBe(true);
    expect(r.state).toEqual(['ESP32', 'ultrasonic']);
  });
  test('remove non-existing component returns removed=false', () => {
    const r = M.componentInventory('remove', ['ESP32'], 'camera');
    expect(r.removed).toBe(false);
    expect(r.state).toEqual(['ESP32']);
  });
  test('add to full magazine returns full=true', () => {
    const full = ['a','b','c','d','e','f']; // 6 = magazineSlots default
    const r = M.componentInventory('add', full, 'g');
    expect(r.added).toBe(false);
    expect(r.full).toBe(true);
    expect(r.state).toEqual(full);
  });
  test('count reports inventory status', () => {
    expect(M.componentInventory('count', ['a','b'], '').count).toBe(2);
    expect(M.componentInventory('count', ['a','b'], '').full).toBe(false);
    expect(M.componentInventory('count', [], '').empty).toBe(true);
  });
  test('throws on bad action', () => {
    expect(() => M.componentInventory('foo', [], 'x')).toThrow(TypeError);
    expect(() => M.componentInventory('add', 'not-array', 'x')).toThrow(TypeError);
  });
});

describe('armIK', () => {
  test('reachable target returns joint angles', () => {
    const r = M.armIK(100, 50, { armShoulderLenMm: 120, armElbowLenMm: 100 });
    expect(r.reachable).toBe(true);
    expect(typeof r.shoulderDeg).toBe('number');
    expect(typeof r.elbowDeg).toBe('number');
    expect(r.dist).toBeGreaterThan(0);
  });
  test('target beyond max reach is not reachable', () => {
    const r = M.armIK(300, 300, { armShoulderLenMm: 120, armElbowLenMm: 100 });
    expect(r.reachable).toBe(false);
    expect(r.reason).toBe('too_far');
  });
  test('target too close is not reachable', () => {
    const r = M.armIK(5, 5, { armShoulderLenMm: 120, armElbowLenMm: 100 });
    expect(r.reachable).toBe(false);
    expect(r.reason).toBe('too_close');
  });
  test('forward-reach at max reach boundary', () => {
    // dist = L1 + L2 = 220, target at (220, 0)
    const r = M.armIK(220, 0, { armShoulderLenMm: 120, armElbowLenMm: 100 });
    expect(r.reachable).toBe(true);
    expect(r.elbowDeg).toBeCloseTo(0, 0);
  });
  test('IK is deterministic (same input -> same output)', () => {
    const r1 = M.armIK(150, 80);
    const r2 = M.armIK(150, 80);
    expect(r1).toEqual(r2);
  });
  test('throws on non-number inputs', () => {
    expect(() => M.armIK('100', 50)).toThrow(TypeError);
    expect(() => M.armIK(100, null)).toThrow(TypeError);
  });
});

describe('armSteps', () => {
  test('converts joint angles to stepper steps', () => {
    const r = M.armSteps(90, 45, 180, { armShoulderStepsPerRev: 200, armShoulderGearRatio: 3, armElbowStepsPerRev: 200, armElbowGearRatio: 2, armBaseStepsPerRev: 200, armBaseGearRatio: 2 });
    expect(r.baseSteps).toBe(Math.round((180 / 360) * 200 * 2));
    expect(r.shoulderSteps).toBe(Math.round((90 / 360) * 200 * 3));
    expect(r.elbowSteps).toBe(Math.round((45 / 360) * 200 * 2));
  });
  test('full revolution base returns gearRatio * stepsPerRev', () => {
    const r = M.armSteps(0, 0, 360, { armBaseStepsPerRev: 200, armBaseGearRatio: 2 });
    expect(r.baseSteps).toBe(400);
  });
  test('zero angles yield zero steps', () => {
    const r = M.armSteps(0, 0, 0);
    expect(r.baseSteps).toBe(0);
    expect(r.shoulderSteps).toBe(0);
    expect(r.elbowSteps).toBe(0);
  });
  test('throws on non-number', () => {
    expect(() => M.armSteps('90', 45, 180)).toThrow(TypeError);
    expect(() => M.armSteps(90, null, 180)).toThrow(TypeError);
  });
});

describe('magazineSteps', () => {
  test('computes steps for N slots', () => {
    expect(M.magazineSteps(1, { magazineStepsPerSlot: 68 })).toBe(68);
    expect(M.magazineSteps(3, { magazineStepsPerSlot: 68 })).toBe(204);
  });
  test('zero slots yields zero steps', () => {
    expect(M.magazineSteps(0)).toBe(0);
  });
  test('negative slots yields zero', () => {
    expect(M.magazineSteps(-5)).toBe(0);
  });
  test('throws on non-number', () => {
    expect(() => M.magazineSteps('3')).toThrow(TypeError);
  });
});

describe('gripperAngle', () => {
  test('open vs close angles', () => {
    expect(M.gripperAngle(false, { gripperOpenAngle: 90, gripperCloseAngle: 30 })).toBe(90);
    expect(M.gripperAngle(true, { gripperOpenAngle: 90, gripperCloseAngle: 30 })).toBe(30);
  });
});

describe('welderAngle', () => {
  test('deployed vs retracted angles', () => {
    expect(M.welderAngle(true, { welderDeployAngle: 60, welderRetractAngle: 120 })).toBe(60);
    expect(M.welderAngle(false, { welderDeployAngle: 60, welderRetractAngle: 120 })).toBe(120);
  });
});

describe('registerChild', () => {
  test('creates registration record', () => {
    const r = M.registerChild('child-001', 'ESP32', ['ultrasonic', 'camera']);
    expect(r.childId).toBe('child-001');
    expect(r.motherboard).toBe('ESP32');
    expect(r.sensors).toEqual(['ultrasonic', 'camera']);
    expect(r.status).toBe('registered');
    expect(r.firmwareVersion).toBe('0.1.0');
  });
  test('throws on bad childId', () => {
    expect(() => M.registerChild(123, 'ESP32', [])).toThrow(TypeError);
    expect(() => M.registerChild('x', 'ESP32', 'nope')).toThrow(TypeError);
  });
});

describe('birthFirmwareSpec', () => {
  test('generates firmware spec with defaults', () => {
    const r = M.birthFirmwareSpec({ childId: 'child-002', motors: 4, sensors: ['moisture'] });
    expect(r.childId).toBe('child-002');
    expect(r.motors.count).toBe(4);
    expect(r.sensors).toEqual(['moisture']);
    expect(r.flashSize).toBe(4 * 1024 * 1024);
    expect(r.wifi.enabled).toBe(false);
    expect(r.birthSequence).toContain('boot');
    expect(r.birthSequence).toContain('ready');
  });
  test('uses default childId when not specified', () => {
    const r = M.birthFirmwareSpec({ motors: 2 });
    expect(r.childId).toBe('myzubster-child-001');
  });
  test('throws on non-object config', () => {
    expect(() => M.birthFirmwareSpec(null)).toThrow(TypeError);
    expect(() => M.birthFirmwareSpec('nope')).toThrow(TypeError);
  });
});

describe('assemblySequence', () => {
  const spec = { childId: 'child-003', motherboard: 'ESP32', components: ['chassis', 'motor', 'sensor'], sensors: ['ultrasonic'] };
  test('produces init, pick-position-connect-verify per component, then flash+register+complete', () => {
    const steps = M.assemblySequence(spec);
    expect(steps[0].op).toBe('init');
    expect(steps[0].childId).toBe('child-003');
    const ops = steps.map(s => s.op);
    expect(ops).toContain('pick');
    expect(ops).toContain('position');
    expect(ops).toContain('connect');
    expect(ops).toContain('verify');
    expect(ops[ops.length - 1]).toBe('complete');
    // 1 init + 3 components * 4 ops + 1 flash + 1 register + 1 complete = 16
    expect(steps.length).toBe(16);
  });
  test('flash step contains birth firmware spec', () => {
    const steps = M.assemblySequence(spec);
    const flash = steps.find(s => s.op === 'flash');
    expect(flash.firmware.childId).toBe('child-003');
    expect(flash.firmware.motors.count).toBe(2); // default when not specified in spec.motors
  });
  test('register step contains child record', () => {
    const steps = M.assemblySequence(spec);
    const reg = steps.find(s => s.op === 'register');
    expect(reg.record.childId).toBe('child-003');
    expect(reg.record.sensors).toEqual(['ultrasonic']);
  });
  test('each component gets incrementing slot number', () => {
    const steps = M.assemblySequence({ components: ['a', 'b', 'c'] });
    const picks = steps.filter(s => s.op === 'pick');
    expect(picks[0].slot).toBe(0);
    expect(picks[1].slot).toBe(1);
    expect(picks[2].slot).toBe(2);
  });
  test('throws on missing components array', () => {
    expect(() => M.assemblySequence({})).toThrow(TypeError);
    expect(() => M.assemblySequence(null)).toThrow(TypeError);
  });
});

describe('accumulateEnergy', () => {
  test('sums microjoules and converts to mWh', () => {
    const r = M.accumulateEnergy([{ voltage_mV: 5000, current_mA: 200, duration_ms: 1000 }]);
    expect(r.totalMicroJoules).toBe(1000000);
    expect(r.totalMilliWattHours).toBeCloseTo(1000000 / 3600000, 6);
  });
  test('accumulates multiple samples', () => {
    const r = M.accumulateEnergy([
      { voltage_mV: 4000, current_mA: 100, duration_ms: 500 },
      { voltage_mV: 5000, current_mA: 150, duration_ms: 1000 },
    ]);
    expect(r.totalMicroJoules).toBe(4000 * 100 * 500 / 1000 + 5000 * 150 * 1000 / 1000);
  });
  test('throws on bad samples', () => {
    expect(() => M.accumulateEnergy([{ voltage_mV: 3000 }])).toThrow(TypeError);
    expect(() => M.accumulateEnergy('nope')).toThrow(TypeError);
  });
});
