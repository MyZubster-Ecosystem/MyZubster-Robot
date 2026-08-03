'use strict';
const E = require('../energy');

describe('socFromVoltage', () => {
  test('returns 100 at full voltage', () => {
    expect(E.socFromVoltage(4200)).toBe(100);
  });
  test('returns 0 at empty voltage', () => {
    expect(E.socFromVoltage(3000)).toBe(0);
  });
  test('returns 50 at midpoint', () => {
    expect(E.socFromVoltage(3600)).toBe(50);
  });
  test('clamps below empty to 0', () => {
    expect(E.socFromVoltage(2500)).toBe(0);
  });
  test('clamps above full to 100', () => {
    expect(E.socFromVoltage(4500)).toBe(100);
  });
  test('respects custom thresholds via opt', () => {
    expect(E.socFromVoltage(4000, { batteryFullMv: 4000, batteryEmptyMv: 3200 })).toBe(100);
    expect(E.socFromVoltage(3200, { batteryFullMv: 4000, batteryEmptyMv: 3200 })).toBe(0);
    expect(E.socFromVoltage(3600, { batteryFullMv: 4000, batteryEmptyMv: 3200 })).toBe(50);
  });
  test('throws on non-number input', () => {
    expect(() => E.socFromVoltage('4200')).toThrow(TypeError);
    expect(() => E.socFromVoltage(null)).toThrow(TypeError);
    expect(() => E.socFromVoltage(undefined)).toThrow(TypeError);
    expect(() => E.socFromVoltage(NaN)).toThrow(TypeError);
  });
  test('throws on Infinity', () => {
    expect(() => E.socFromVoltage(Infinity)).toThrow(TypeError);
  });
});

describe('lowBatteryDetector', () => {
  test('triggers when below threshold (not alerting)', () => {
    const r = E.lowBatteryDetector(15, false);
    expect(r.alerting).toBe(true);
    expect(r.action).toBe('trigger_recharge');
  });
  test('stays idle when above threshold (not alerting)', () => {
    const r = E.lowBatteryDetector(50, false);
    expect(r.alerting).toBe(false);
    expect(r.action).toBe('idle');
  });
  test('continues recharge while alerting and below cancel threshold', () => {
    const r = E.lowBatteryDetector(22, true);
    expect(r.alerting).toBe(true);
    expect(r.action).toBe('continue_recharge');
  });
  test('cancels recharge when alerting and SoC rises above low + hysteresis', () => {
    const r = E.lowBatteryDetector(25, true);
    expect(r.alerting).toBe(false);
    expect(r.action).toBe('cancel_recharge');
  });
  test('hysteresis boundary: cancels at exactly low+hysteresis', () => {
    const r = E.lowBatteryDetector(25, true, { batteryLowPct: 20, batteryHysteresisPct: 5 });
    expect(r.alerting).toBe(false);
    expect(r.action).toBe('cancel_recharge');
  });
  test('hysteresis boundary: does not cancel at low+hysteresis-1', () => {
    const r = E.lowBatteryDetector(24, true, { batteryLowPct: 20, batteryHysteresisPct: 5 });
    expect(r.alerting).toBe(true);
    expect(r.action).toBe('continue_recharge');
  });
  test('respects custom thresholds via opt', () => {
    const r = E.lowBatteryDetector(9, false, { batteryLowPct: 10, batteryHysteresisPct: 3 });
    expect(r.alerting).toBe(true);
    expect(r.action).toBe('trigger_recharge');
  });
  test('throws on non-number socPct', () => {
    expect(() => E.lowBatteryDetector('15', false)).toThrow(TypeError);
    expect(() => E.lowBatteryDetector(undefined, false)).toThrow(TypeError);
  });
  test('throws on non-boolean wasAlerting', () => {
    expect(() => E.lowBatteryDetector(15, 'true')).toThrow(TypeError);
    expect(() => E.lowBatteryDetector(15, 1)).toThrow(TypeError);
    expect(() => E.lowBatteryDetector(15, null)).toThrow(TypeError);
  });
});

describe('navigatorToDock', () => {
  test('returns distance and bearing for simple offset', () => {
    const r = E.navigatorToDock({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(r.distance).toBe(5);
    expect(r.inRange).toBe(true);
  });
  test('bearing 0 for pure +x direction', () => {
    const r = E.navigatorToDock({ x: 0, y: 0 }, { x: 5, y: 0 });
    expect(r.bearing).toBe(0);
  });
  test('bearing 90 for pure +y direction', () => {
    const r = E.navigatorToDock({ x: 0, y: 0 }, { x: 0, y: 5 });
    expect(r.bearing).toBe(90);
  });
  test('bearing 180 for pure -x direction', () => {
    const r = E.navigatorToDock({ x: 0, y: 0 }, { x: -5, y: 0 });
    expect(r.bearing).toBe(180);
  });
  test('bearing 270 for pure -y direction', () => {
    const r = E.navigatorToDock({ x: 0, y: 0 }, { x: 0, y: -5 });
    expect(r.bearing).toBe(270);
  });
  test('inRange false when beyond max approach distance', () => {
    const r = E.navigatorToDock({ x: 0, y: 0 }, { x: 20, y: 0 });
    expect(r.inRange).toBe(false);
  });
  test('respects custom dockMaxApproachDistM', () => {
    const r = E.navigatorToDock({ x: 0, y: 0 }, { x: 15, y: 0 }, { dockMaxApproachDistM: 20 });
    expect(r.inRange).toBe(true);
  });
  test('zero distance when robot already at dock', () => {
    const r = E.navigatorToDock({ x: 5, y: 5 }, { x: 5, y: 5 });
    expect(r.distance).toBe(0);
    expect(r.bearing).toBe(0);
    expect(r.inRange).toBe(true);
  });
  test('throws on missing robotPos', () => {
    expect(() => E.navigatorToDock(null, { x: 1, y: 1 })).toThrow(TypeError);
  });
  test('throws on non-numeric robotPos coords', () => {
    expect(() => E.navigatorToDock({ x: '1', y: 2 }, { x: 1, y: 1 })).toThrow(TypeError);
    expect(() => E.navigatorToDock({ x: 1, y: 2 }, { x: undefined, y: 3 })).toThrow(TypeError);
  });
  test('throws on missing dockPos', () => {
    expect(() => E.navigatorToDock({ x: 1, y: 1 }, null)).toThrow(TypeError);
  });
});

describe('dockingStateMachine', () => {
  test('stays idle when no low battery', () => {
    const r = E.dockingStateMachine('idle', { lowBattery: false });
    expect(r.from).toBe('idle');
    expect(r.to).toBe('idle');
  });
  test('idle -> navigate when low battery', () => {
    const r = E.dockingStateMachine('idle', { lowBattery: true });
    expect(r.to).toBe('navigate');
  });
  test('navigate -> approach when dock visible', () => {
    const r = E.dockingStateMachine('navigate', { dockVisible: true });
    expect(r.to).toBe('approach');
  });
  test('stays navigate when dock not visible', () => {
    const r = E.dockingStateMachine('navigate', { dockVisible: false });
    expect(r.to).toBe('navigate');
  });
  test('approach -> align when dock aligned', () => {
    const r = E.dockingStateMachine('approach', { dockAligned: true });
    expect(r.to).toBe('align');
  });
  test('stays approach when dock not aligned', () => {
    const r = E.dockingStateMachine('approach', { dockAligned: false });
    expect(r.to).toBe('approach');
  });
  test('align -> connect when contacts aligned', () => {
    const r = E.dockingStateMachine('align', { contactsAligned: true });
    expect(r.to).toBe('connect');
  });
  test('stays align when contacts not aligned', () => {
    const r = E.dockingStateMachine('align', { contactsAligned: false });
    expect(r.to).toBe('align');
  });
  test('connect -> charge when power connected', () => {
    const r = E.dockingStateMachine('connect', { powerConnected: true });
    expect(r.to).toBe('charge');
  });
  test('stays connect when power not connected', () => {
    const r = E.dockingStateMachine('connect', { powerConnected: false });
    expect(r.to).toBe('connect');
  });
  test('charge -> disconnect when fully charged', () => {
    const r = E.dockingStateMachine('charge', { fullyCharged: true });
    expect(r.to).toBe('disconnect');
  });
  test('stays charge when not fully charged', () => {
    const r = E.dockingStateMachine('charge', { fullyCharged: false });
    expect(r.to).toBe('charge');
  });
  test('disconnect -> idle (cycle complete)', () => {
    const r = E.dockingStateMachine('disconnect', {});
    expect(r.to).toBe('idle');
  });
  test('full cycle: idle -> navigate -> approach -> align -> connect -> charge -> disconnect -> idle', () => {
    let state = 'idle';
    const sequence = [
      { lowBattery: true },
      { dockVisible: true },
      { dockAligned: true },
      { contactsAligned: true },
      { powerConnected: true },
      { fullyCharged: true },
      {},
    ];
    const expected = ['navigate', 'approach', 'align', 'connect', 'charge', 'disconnect', 'idle'];
    for (let i = 0; i < sequence.length; i++) {
      const r = E.dockingStateMachine(state, sequence[i]);
      expect(r.to).toBe(expected[i]);
      state = r.to;
    }
  });
  test('action string matches next state', () => {
    const r = E.dockingStateMachine('idle', { lowBattery: true });
    expect(r.action).toBe('navigate_action');
  });
  test('throws on unknown state', () => {
    expect(() => E.dockingStateMachine('unknown', {})).toThrow(TypeError);
  });
  test('throws on non-string state', () => {
    expect(() => E.dockingStateMachine(42, {})).toThrow(TypeError);
  });
  test('throws on missing sensor', () => {
    expect(() => E.dockingStateMachine('idle', null)).toThrow(TypeError);
    expect(() => E.dockingStateMachine('idle', 'nope')).toThrow(TypeError);
  });
});

describe('chargingCompleteNotifier', () => {
  test('notifies when charging complete', () => {
    const r = E.chargingCompleteNotifier(true);
    expect(r.notify).toBe(true);
    expect(r.message).toBe('recharge_complete');
    expect(r.level).toBe('info');
  });
  test('no notification when not complete', () => {
    const r = E.chargingCompleteNotifier(false);
    expect(r.notify).toBe(false);
    expect(r.message).toBe('');
    expect(r.level).toBe('none');
  });
  test('throws on non-boolean', () => {
    expect(() => E.chargingCompleteNotifier('yes')).toThrow(TypeError);
    expect(() => E.chargingCompleteNotifier(1)).toThrow(TypeError);
    expect(() => E.chargingCompleteNotifier(null)).toThrow(TypeError);
  });
});

describe('x402PaymentSpec', () => {
  const spec = E.x402PaymentSpec();
  test('returns documentation-only spec', () => {
    expect(spec.protocol).toBe('x402-documentation-spec');
  });
  test('has 6 states', () => {
    expect(spec.states).toHaveLength(6);
    expect(spec.states).toContain('idle');
    expect(spec.states).toContain('charging_authorized');
  });
  test('has 6 transitions', () => {
    expect(spec.transitions).toHaveLength(6);
  });
  test('transitions form a complete path from idle back to idle', () => {
    const t = spec.transitions;
    expect(t[0].from).toBe('idle');
    expect(t[t.length - 1].to).toBe('idle');
  });
  test('lists expected data fields', () => {
    expect(spec.dataFields).toContain('amount_xmr');
    expect(spec.dataFields).toContain('recipient_address');
    expect(spec.dataFields).toContain('session_id');
    expect(spec.dataFields).toContain('timestamp');
  });
  test('note documents that no real signing/transfer is performed', () => {
    expect(spec.note).toMatch(/Documentation-only/);
    expect(spec.note).toMatch(/No real wallet signing/);
  });
  test('endpoint is documented-spec-only', () => {
    expect(spec.endpoint).toBe('documented-spec-only');
  });
  test('does NOT return amount > 0 (no real payment value)', () => {
    expect(E.DEFAULTS.x402AmountXmr).toBe(0);
  });
});

describe('rechargeMission', () => {
  test('returns mission steps when battery is low', () => {
    const steps = E.rechargeMission({ x: 0, y: 0 }, { x: 3, y: 4 }, 15);
    expect(steps.length).toBeGreaterThan(1);
    expect(steps[0].op).toBe('battery_check');
  });
  test('returns early no_recharge_needed when battery is fine', () => {
    const steps = E.rechargeMission({ x: 0, y: 0 }, { x: 3, y: 4 }, 80);
    expect(steps).toHaveLength(2);
    expect(steps[0].op).toBe('battery_check');
    expect(steps[1].op).toBe('no_recharge_needed');
  });
  test('includes all 5 phases when recharge needed', () => {
    const steps = E.rechargeMission({ x: 0, y: 0 }, { x: 3, y: 4 }, 10);
    const phases = steps.map(s => s.phase);
    expect(phases).toContain(1);
    expect(phases).toContain(2);
    expect(phases).toContain(3);
    expect(phases).toContain(4);
    expect(phases).toContain(5);
  });
  test('phase 4 is x402 documentation spec (no real payment)', () => {
    const steps = E.rechargeMission({ x: 0, y: 0 }, { x: 3, y: 4 }, 10);
    const p4 = steps.find(s => s.phase === 4);
    expect(p4.op).toBe('x402_payment_spec');
    expect(p4.spec.protocol).toBe('x402-documentation-spec');
  });
  test('phase 5 includes charge and completion notification', () => {
    const steps = E.rechargeMission({ x: 0, y: 0 }, { x: 3, y: 4 }, 10);
    const p5 = steps.filter(s => s.phase === 5);
    expect(p5.some(s => s.op === 'charge')).toBe(true);
    expect(p5.some(s => s.op === 'complete')).toBe(true);
  });
  test('navigate step includes distance and bearing', () => {
    const steps = E.rechargeMission({ x: 0, y: 0 }, { x: 3, y: 4 }, 15);
    const nav = steps.find(s => s.op === 'navigate');
    expect(nav.distance).toBe(5);
    expect(nav.bearing).toBe(53.13);
  });
  test('throws on non-number socPct', () => {
    expect(() => E.rechargeMission({ x: 0, y: 0 }, { x: 1, y: 1 }, '15')).toThrow(TypeError);
    expect(() => E.rechargeMission({ x: 0, y: 0 }, { x: 1, y: 1 }, null)).toThrow(TypeError);
  });
});

describe('accumulateEnergy', () => {
  test('sums microjoules and converts to mWh', () => {
    const r = E.accumulateEnergy([{ voltage_mV: 3300, current_mA: 50, duration_ms: 1000 }]);
    expect(r.totalMicroJoules).toBe(165000);
    expect(r.totalMilliWattHours).toBeCloseTo(165000 / 3600000, 6);
  });
  test('accumulates multiple samples', () => {
    const r = E.accumulateEnergy([
      { voltage_mV: 3000, current_mA: 40, duration_ms: 500 },
      { voltage_mV: 3600, current_mA: 60, duration_ms: 1000 },
    ]);
    expect(r.totalMicroJoules).toBe(3000 * 40 * 500 / 1000 + 3600 * 60 * 1000 / 1000);
  });
  test('empty array yields zero', () => {
    const r = E.accumulateEnergy([]);
    expect(r.totalMicroJoules).toBe(0);
    expect(r.totalMilliWattHours).toBe(0);
  });
  test('throws on bad samples (missing fields)', () => {
    expect(() => E.accumulateEnergy([{ voltage_mV: 1 }])).toThrow(TypeError);
    expect(() => E.accumulateEnergy([{ voltage_mV: 1, current_mA: 2 }])).toThrow(TypeError);
  });
  test('throws on non-array', () => {
    expect(() => E.accumulateEnergy('nope')).toThrow(TypeError);
    expect(() => E.accumulateEnergy(null)).toThrow(TypeError);
  });
});
