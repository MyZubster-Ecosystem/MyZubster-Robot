'use strict';
const L = require('../lawnmower.js');

describe('bomBudgetValidator', () => {
  const full = [
    { category: 'motors', name: 'DC motor x2', priceEur: 30 },
    { category: 'cutting', name: 'Blade', priceEur: 15 },
    { category: 'controller', name: 'ESP32', priceEur: 8 },
    { category: 'sensors', name: 'Proximity', priceEur: 10 },
    { category: 'battery', name: 'LiPo', priceEur: 25 },
    { category: 'chassis', name: '3D frame', priceEur: 20 },
  ];
  test('reports the correct total and per-category breakdown', () => {
    const r = L.bomBudgetValidator(full);
    expect(r.totalEur).toBe(108);
    expect(r.count).toBe(6);
    expect(r.byCategory.motors).toBe(30);
    expect(r.byCategory.battery).toBe(25);
  });
  test('valid=true when every required category present and total <= 200', () => {
    const r = L.bomBudgetValidator(full);
    expect(r.valid).toBe(true);
    expect(r.missingCategories).toEqual([]);
    expect(r.overBudget).toBe(false);
  });
  test('overBudget=true and valid=false when total exceeds the envelope', () => {
    const over = full.concat([{ category: 'motors', name: 'spare', priceEur: 100 }]);
    const r = L.bomBudgetValidator(over);
    expect(r.totalEur).toBe(208);
    expect(r.overBudget).toBe(true);
    expect(r.valid).toBe(false);
  });
  test('lists missing categories where required categories are absent', () => {
    const partial = full.filter(c => c.category !== 'battery' && c.category !== 'sensors');
    const r = L.bomBudgetValidator(partial);
    expect(r.missingCategories).toEqual(expect.arrayContaining(['battery', 'sensors']));
    expect(r.valid).toBe(false);
  });
  test('tracks cheapest and most expensive item', () => {
    const r = L.bomBudgetValidator(full);
    expect(r.cheapest).toEqual({ name: 'ESP32', category: 'controller', priceEur: 8 });
    expect(r.mostExpensive).toEqual({ name: 'DC motor x2', category: 'motors', priceEur: 30 });
  });
  test('sums duplicate categories into a single bucket', () => {
    const dup = [
      { category: 'motors', name: 'a', priceEur: 12.5 },
      { category: 'motors', name: 'b', priceEur: 17.5 },
      { category: 'cutting', name: 'c', priceEur: 15 },
      { category: 'controller', name: 'd', priceEur: 8 },
      { category: 'sensors', name: 'e', priceEur: 10 },
      { category: 'battery', name: 'f', priceEur: 25 },
      { category: 'chassis', name: 'g', priceEur: 20 },
    ];
    const r = L.bomBudgetValidator(dup);
    expect(r.byCategory.motors).toBe(30);
    expect(r.totalEur).toBe(108);
  });
  test('honours a custom bomBudgetEur opt', () => {
    const r = L.bomBudgetValidator(full, { bomBudgetEur: 50 });
    expect(r.overBudget).toBe(true);
    expect(r.valid).toBe(false);
  });
  test('throws on non-array, empty, missing category/name, non-number price, negative price', () => {
    expect(() => L.bomBudgetValidator('x')).toThrow(TypeError);
    expect(() => L.bomBudgetValidator([])).toThrow(RangeError);
    expect(() => L.bomBudgetValidator([{ name: 'x', priceEur: 1 }])).toThrow(TypeError);
    expect(() => L.bomBudgetValidator([{ category: 'a', priceEur: 1 }])).toThrow(TypeError);
    expect(() => L.bomBudgetValidator([{ category: 'a', name: 'x', priceEur: 'cheap' }])).toThrow(TypeError);
    expect(() => L.bomBudgetValidator([{ category: 'a', name: 'x', priceEur: -1 }])).toThrow(RangeError);
  });
});

describe('differentialDrive', () => {
  test('drives straight when heading error is inside the deadband', () => {
    const r = L.differentialDrive(0);
    expect(r.turnDirection).toBe('straight');
    expect(r.leftDuty).toBe(r.rightDuty);
    expect(r.leftDuty).toBe(100);
  });
  test('centered inside deadband still drives straight', () => {
    expect(L.differentialDrive(1.5).turnDirection).toBe('straight');
  });
  test('turns right with positive heading error beyond the deadband', () => {
    const r = L.differentialDrive(45);
    expect(r.turnDirection).toBe('right');
    expect(r.leftDuty).toBeGreaterThan(r.rightDuty);
    expect(r.insideDisabled).toBe(false);
  });
  test('turns left with negative heading error beyond the deadband', () => {
    const r = L.differentialDrive(-30);
    expect(r.turnDirection).toBe('left');
    expect(r.rightDuty).toBeGreaterThan(r.leftDuty);
  });
  test('wraps heading error to [-180, 180] (225 -> -135)', () => {
    const r = L.differentialDrive(225);
    expect(r.turnDirection).toBe('left');
    expect(r.headingErrorDeg).toBeCloseTo(-135, 5);
  });
  test('saturates the duty cycle within [0, 100]', () => {
    const r = L.differentialDrive(-179);
    expect(r.leftDuty).toBeGreaterThanOrEqual(0);
    expect(r.leftDuty).toBeLessThanOrEqual(100);
    expect(r.rightDuty).toBeGreaterThanOrEqual(0);
    expect(r.rightDuty).toBeLessThanOrEqual(100);
  });
  test('flags insideDisabled when the inside wheel is asked to go backward (very sharp turn)', () => {
    const r = L.differentialDrive(-170);
    expect(r.turnDirection).toBe('left');
    expect(r.leftDuty).toBe(0);
    expect(r.insideDisabled).toBe(true);
  });
  test('throws on non-number / infinite inputs', () => {
    expect(() => L.differentialDrive('x')).toThrow(TypeError);
    expect(() => L.differentialDrive(NaN)).toThrow(TypeError);
  });
});

describe('motorSpeedController', () => {
  test('returns a dutyCyclePct matching Kp*error + Ki*integral when below saturation', () => {
    const r = L.motorSpeedController(50, 40, 0);
    expect(r.error).toBe(10);
    // Integral accumulates the same tick: newIntegral = 10, then raw = 0.18*10 + 0.01*10 = 1.9
    expect(r.dutyCyclePct).toBeCloseTo(0.18 * 10 + 0.01 * 10, 4);
    expect(r.dutyCyclePct).toBe(1.9);
  });
  test('returns a negative dutyCyclePct when measured exceeds target', () => {
    const r = L.motorSpeedController(10, 50, 0);
    expect(r.error).toBe(-40);
    expect(r.dutyCyclePct).toBeLessThan(0);
  });
  test('accumulates the integral across calls with a passed-in accumulator', () => {
    let net = 0;
    for (let i = 0; i < 5; i++) net = L.motorSpeedController(50, 40, net).integral;
    expect(net).toBeGreaterThan(0);
  });
  test('clamps the integral accumulator at speedIntegralMax (anti-windup)', () => {
    let net = 0;
    for (let i = 0; i < 1000; i++) net = L.motorSpeedController(500, 0, net).integral;
    expect(net).toBeLessThanOrEqual(60);
    expect(net).toBeGreaterThanOrEqual(-60);
  });
  test('saturates dutyCyclePct to [-100, 100] for a large error + huge integral', () => {
    const r = L.motorSpeedController(10000, 0, 60);
    expect(r.dutyCyclePct).toBeLessThanOrEqual(100);
    expect(r.dutyCyclePct).toBeGreaterThanOrEqual(-100);
  });
  test('reports antiWindupActive when the clamp is touching the ceiling', () => {
    let net = 0;
    let active = false;
    for (let i = 0; i < 100; i++) {
      const step = L.motorSpeedController(500, 0, net);
      net = step.integral;
      if (step.antiWindupActive) active = true;
    }
    expect(active).toBe(true);
  });
  test('throws on non-number / implausibly large integral', () => {
    expect(() => L.motorSpeedController('x', 0, 0)).toThrow(TypeError);
    expect(() => L.motorSpeedController(10, 'x', 0)).toThrow(TypeError);
    expect(() => L.motorSpeedController(10, 10, 1e9)).toThrow(RangeError);
  });
});

describe('obstacleGuard', () => {
  test('reports normal speed + clear reason when far and untilted', () => {
    const r = L.obstacleGuard(2000, 5);
    expect(r.motorAllowed).toBe(true);
    expect(r.bladeAllowed).toBe(true);
    expect(r.speed).toBe('normal');
    expect(r.reasons).toBe('clear');
  });
  test('reports caution speed in the slow band between stop and caution thresholds', () => {
    const r = L.obstacleGuard(250, 5);
    expect(r.motorAllowed).toBe(true);
    expect(r.speed).toBe('caution');
    expect(r.reasons).toBe('obstacle_close');
  });
  test('reports stop + disables motor and blade when obstacle under the stop threshold', () => {
    const r = L.obstacleGuard(100, 5);
    expect(r.motorAllowed).toBe(false);
    expect(r.bladeAllowed).toBe(false);
    expect(r.speed).toBe('stop');
    expect(r.reasons).toBe('obstacle_too_close');
  });
  test('disables blade and stops when chassis tilt exceeds the tilt stop threshold', () => {
    const r = L.obstacleGuard(2000, 30);
    expect(r.motorAllowed).toBe(false);
    expect(r.bladeAllowed).toBe(false);
    expect(r.speed).toBe('stop');
    expect(r.reasons).toBe('tilt_excessive');
  });
  test('combines obstacle and tilt reasons when both are triggered', () => {
    const r = L.obstacleGuard(100, -30);
    expect(r.reasons).toContain('obstacle_too_close');
    expect(r.reasons).toContain('tilt_excessive');
  });
  test('respects custom threshold opt', () => {
    const r = L.obstacleGuard(500, 5, { obstacleStopMm: 1000, obstacleCautionMm: 2000 });
    expect(r.motorAllowed).toBe(false);
  });
  test('throws on non-number / infinite inputs', () => {
    expect(() => L.obstacleGuard('x', 0)).toThrow(TypeError);
    expect(() => L.obstacleGuard(0, Infinity)).toThrow(TypeError);
  });
});

describe('cuttingDeckController', () => {
  test('ramps up by at most bladeRampRpmPerSec when target is far above current', () => {
    const r = L.cuttingDeckController(3200, 0);
    expect(r.nextRpm).toBe(600);
    expect(r.ramped).toBe(true);
  });
  test('reaches the target within one tick when delta is below the ramp cap', () => {
    const r = L.cuttingDeckController(600, 100);
    expect(r.nextRpm).toBe(600);
    expect(r.ramped).toBe(false);
  });
  test('ramps down by at most the cap when target is below current', () => {
    const r = L.cuttingDeckController(0, 1300);
    expect(r.nextRpm).toBe(700);
  });
  test('clamps target and current to the [0, bladeMaxRpm] range', () => {
    const r = L.cuttingDeckController(99999, -100);
    expect(r.nextRpm).toBe(600);
  });
  test('computes dutyPct as nextRpm / bladeMaxRpm * 100', () => {
    const r = L.cuttingDeckController(600, 0);
    expect(r.dutyPct).toBe(Math.round(600 / 3200 * 100));
  });
  test('throws on non-number inputs and below-idle target', () => {
    expect(() => L.cuttingDeckController('x', 0)).toThrow(TypeError);
    expect(() => L.cuttingDeckController(0, 'x')).toThrow(TypeError);
    expect(() => L.cuttingDeckController(-1, 0)).toThrow(RangeError);
  });
});

describe('x402PaymentSpec', () => {
  test('returns the seven states of the HTTP 402 machine-payable flow', () => {
    const sp = L.x402PaymentSpec();
    expect(sp.protocol).toBe('x402');
    expect(sp.states).toEqual(['idle', 'quote_requested', 'quoted', 'paying', 'paid', 'released', 'refunded']);
  });
  test('transitions form a connected idle -> released / refunded DAG', () => {
    const sp = L.x402PaymentSpec();
    expect(sp.transitions.length).toBeGreaterThanOrEqual(6);
    const tos = sp.transitions.map(t => t.to);
    expect(tos).toEqual(expect.arrayContaining(['quote_requested', 'quoted', 'paying', 'paid', 'released', 'refunded']));
  });
  test('documents the six data fields without any real signing material', () => {
    const sp = L.x402PaymentSpec();
    expect(sp.dataFields).toEqual(expect.arrayContaining(['invoice_id', 'amount_xmr', 'amount_eur', 'payment_address', 'txid', 'expires_at']));
    expect(sp.safetyNote).toMatch(/No wallet signing/);
  });
  test('uses a default suggestedPaymentEur of 0.5 when not provided', () => {
    expect(L.x402PaymentSpec().suggestedPaymentEur).toBe(0.5);
  });
  test('honours a custom suggestedPaymentEur opt', () => {
    expect(L.x402PaymentSpec({ suggestedPaymentEur: 1.25 }).suggestedPaymentEur).toBe(1.25);
  });
  test('the description doc spec text flags the firmware omits real signing', () => {
    expect(L.x402PaymentSpec().description).toMatch(/firmware omits real wallet signing/);
  });
});

describe('mowingMission', () => {
  test('emits the five phases standby -> start -> mow -> pause -> park', () => {
    const r = L.mowingMission({ widthM: 5, heightM: 4 });
    expect(r.phases.map(p => p.phase)).toEqual(['standby', 'start', 'mow', 'pause', 'park']);
    expect(r.phases).toHaveLength(5);
  });
  test('row count is ceil(width / swath) with default 0.22m swath', () => {
    expect(L.mowingMission({ widthM: 5, heightM: 4 }).rowCount).toBe(23);
  });
  test('honours a custom swathM in row count', () => {
    expect(L.mowingMission({ widthM: 6, heightM: 4, swathM: 0.5 }).rowCount).toBe(12);
  });
  test('mow phase action records the row count', () => {
    const r = L.mowingMission({ widthM: 2, heightM: 2 });
    expect(r.phases[2].action).toBe('mow_10_rows');
  });
  test('park phase references the x402 spec (documentation only)', () => {
    const r = L.mowingMission({ widthM: 2, heightM: 2 });
    expect(r.phases[4].action).toBe('x402_settle_documentation_only');
    expect(r.x402.protocol).toBe('x402');
  });
  test('throws on non-object, bad dimensions, and non-positive swath', () => {
    expect(() => L.mowingMission('x')).toThrow(TypeError);
    expect(() => L.mowingMission({ widthM: 'x', heightM: 2 })).toThrow(TypeError);
    expect(() => L.mowingMission({ widthM: 0, heightM: 2 })).toThrow(RangeError);
    expect(() => L.mowingMission({ widthM: 2, heightM: 2, swathM: -1 })).toThrow(RangeError);
  });
});
