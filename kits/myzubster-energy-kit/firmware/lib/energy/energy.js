'use strict';
// Pure-JS auto-recharge-kit helpers for MyZubster-Robot issue #85 (Robot che
// si ricarica autonomamente). Extracted from firmware/firmware.ino so the battery
// level monitor, low-battery hysteresis, charging station navigator, auto-docking
// state machine, and charging completion notifier decisions are unit-testable.
// The x402 payment flow is documented as a PROTOCOL SPEC (data structures + state
// transitions only). No real wallet signing, Monero transfer, or network call is
// performed. All pure integer/float math - matches the safe-harbor scope of the
// #71-#81 kits.

const DEFAULTS = {
  // Battery
  batteryFullMv: 4200,           // fully charged Li-ion cell voltage
  batteryEmptyMv: 3000,         // depleted cell voltage
  batteryLowPct: 20,            // trigger recharge when SoC drops below this
  batteryHysteresisPct: 5,      // must rise above low+hysteresis to cancel alert
  // Charging station
  dockMaxApproachDistM: 10,     // max distance (m) at which navigator activates
  // x402 payment (documentation-only spec, no real signing/transfer)
  x402Endpoint: 'documented-spec-only',
  x402AmountXmr: 0,             // placeholder, never transmitted
};

function optWith(opt) { return Object.assign({}, DEFAULTS, opt || {}); }

// --- Battery state-of-charge estimator ---
// Given a raw ADC voltage reading (mV), estimate SoC percent (0-100).
// Linear interpolation between empty and full.
function socFromVoltage(voltageMv, opt) {
  const o = optWith(opt);
  if (typeof voltageMv !== 'number' || !Number.isFinite(voltageMv)) throw new TypeError('voltageMv must be a number');
  const clamped = Math.max(o.batteryEmptyMv, Math.min(voltageMv, o.batteryFullMv));
  const pct = Math.round((clamped - o.batteryEmptyMv) / (o.batteryFullMv - o.batteryEmptyMv) * 100);
  return pct;
}

// --- Low-battery detector with hysteresis ---
// Given current SoC + previous alert state, determine new alert state.
// Hysteresis prevents oscillation near the threshold.
function lowBatteryDetector(socPct, wasAlerting, opt) {
  const o = optWith(opt);
  if (typeof socPct !== 'number') throw new TypeError('socPct must be a number');
  if (typeof wasAlerting !== 'boolean') throw new TypeError('wasAlerting must be a boolean');
  if (wasAlerting) {
    // Must rise above low + hysteresis to cancel
    if (socPct >= o.batteryLowPct + o.batteryHysteresisPct) return { alerting: false, action: 'cancel_recharge' };
    return { alerting: true, action: 'continue_recharge' };
  }
  // Not currently alerting: trigger when below threshold
  if (socPct < o.batteryLowPct) return { alerting: true, action: 'trigger_recharge' };
  return { alerting: false, action: 'idle' };
}

// --- Charging station navigator ---
// Given robot position {x, y} + dock position {x, y}, compute bearing (degrees)
// and distance (meters) to the charging dock.
function navigatorToDock(robotPos, dockPos, opt) {
  const o = optWith(opt);
  if (!robotPos || typeof robotPos.x !== 'number' || typeof robotPos.y !== 'number') {
    throw new TypeError('robotPos needs numeric x, y');
  }
  if (!dockPos || typeof dockPos.x !== 'number' || typeof dockPos.y !== 'number') {
    throw new TypeError('dockPos needs numeric x, y');
  }
  const dx = dockPos.x - robotPos.x;
  const dy = dockPos.y - robotPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  let bearingDeg = Math.atan2(dy, dx) * 180 / Math.PI;
  if (bearingDeg < 0) bearingDeg += 360;
  const inRange = dist <= o.dockMaxApproachDistM;
  return {
    distance: Math.round(dist * 100) / 100,
    bearing: Math.round(bearingDeg * 100) / 100,
    inRange,
  };
}

// --- Auto-docking connector state machine ---
// States: idle -> navigate -> approach -> align -> connect -> charge -> disconnect -> idle
// Each transition is deterministic based on sensor conditions.
function dockingStateMachine(currentState, sensor, opt) {
  const o = optWith(opt);
  if (typeof currentState !== 'string') throw new TypeError('currentState must be a string');
  if (!sensor || typeof sensor !== 'object') throw new TypeError('sensor must be an object');
  const transitions = {
    idle: () => sensor.lowBattery ? 'navigate' : 'idle',
    navigate: () => sensor.dockVisible ? 'approach' : 'navigate',
    approach: () => sensor.dockAligned ? 'align' : 'approach',
    align: () => sensor.contactsAligned ? 'connect' : 'align',
    connect: () => sensor.powerConnected ? 'charge' : 'connect',
    charge: () => sensor.fullyCharged ? 'disconnect' : 'charge',
    disconnect: () => 'idle',
  };
  const fn = transitions[currentState];
  if (!fn) throw new TypeError('unknown state: ' + currentState);
  const nextState = fn();
  return { from: currentState, to: nextState, action: nextState + '_action' };
}

// --- Charging completion notifier ---
// Given charging status, produce a notification message.
function chargingCompleteNotifier(chargingComplete, opt) {
  const o = optWith(opt);
  if (typeof chargingComplete !== 'boolean') throw new TypeError('chargingComplete must be a boolean');
  if (chargingComplete) {
    return { notify: true, message: 'recharge_complete', level: 'info' };
  }
  return { notify: false, message: '', level: 'none' };
}

// --- x402 payment flow spec (documentation-only, NO real signing) ---
// This is a PROTOCOL SPEC: data structures and state transitions only.
// No wallet signing, no Monero transfer, no network call, no key material.
// The spec documents how the payment flow SHOULD work; the kit does NOT execute it.
function x402PaymentSpec(opt) {
  const o = optWith(opt);
  return {
    // This is a documentation-only spec. No real values, no signing, no transfer.
    protocol: 'x402-documentation-spec',
    states: ['idle', 'request_quote', 'receive_quote', 'authorize_payment', 'payment_confirmed', 'charging_authorized'],
    transitions: [
      { from: 'idle', to: 'request_quote', trigger: 'dock_connected' },
      { from: 'request_quote', to: 'receive_quote', trigger: 'quote_received' },
      { from: 'receive_quote', to: 'authorize_payment', trigger: 'user_consents' },
      { from: 'authorize_payment', to: 'payment_confirmed', trigger: 'payment_verified' },
      { from: 'payment_confirmed', to: 'charging_authorized', trigger: 'charging_starts' },
      { from: 'charging_authorized', to: 'idle', trigger: 'charging_complete' },
    ],
    dataFields: ['amount_xmr', 'recipient_address', 'session_id', 'timestamp'],
    note: 'Documentation-only spec. No real wallet signing, Monero transfer, or network call performed by this kit. The actual payment protocol is implemented by the x402 infrastructure, not this kit.',
    endpoint: o.x402Endpoint,
  };
}

// --- Full recharge mission sequence ---
// Given a robot position + dock position + battery SoC, produce the ordered
// recharge mission steps. Phase 1-4 of the issue: detect, navigate, connect,
// charge+notify. Phase 5 (x402) is a documented spec reference.
function rechargeMission(robotPos, dockPos, socPct, opt) {
  const o = optWith(opt);
  if (typeof socPct !== 'number') throw new TypeError('socPct must be a number');
  const steps = [];
  // Phase 1: Battery detection
  const lowBatt = lowBatteryDetector(socPct, false, o);
  steps.push({ phase: 1, op: 'battery_check', soc: socPct, action: lowBatt.action });
  if (!lowBatt.alerting) {
    steps.push({ phase: 1, op: 'no_recharge_needed', soc: socPct });
    return steps;
  }
  // Phase 2: Navigate to dock
  const nav = navigatorToDock(robotPos, dockPos, o);
  steps.push({ phase: 2, op: 'navigate', distance: nav.distance, bearing: nav.bearing, inRange: nav.inRange });
  // Phase 3: Auto-connect
  steps.push({ phase: 3, op: 'approach', distance: nav.distance });
  steps.push({ phase: 3, op: 'align', bearing: nav.bearing });
  steps.push({ phase: 3, op: 'connect', contactsAligned: true });
  // Phase 4: x402 payment (documentation spec reference)
  steps.push({ phase: 4, op: 'x402_payment_spec', spec: x402PaymentSpec(o) });
  // Phase 5: Charge + notify
  steps.push({ phase: 5, op: 'charge', charging: true });
  steps.push({ phase: 5, op: 'complete', notify: chargingCompleteNotifier(true, o) });
  return steps;
}

// --- Energy accumulation (same formula as all kits) ---
function accumulateEnergy(samples) {
  if (!Array.isArray(samples)) throw new TypeError('samples must be an array');
  let totalMicroJoules = 0;
  for (const s of samples) {
    if (!s || typeof s.voltage_mV !== 'number' || typeof s.current_mA !== 'number' || typeof s.duration_ms !== 'number') {
      throw new TypeError('each sample needs numeric voltage_mV, current_mA, duration_ms');
    }
    totalMicroJoules += Math.trunc((s.voltage_mV * s.current_mA * s.duration_ms) / 1000);
  }
  return { totalMicroJoules, totalMilliWattHours: totalMicroJoules / 3_600_000 };
}

module.exports = {
  DEFAULTS,
  socFromVoltage,
  lowBatteryDetector,
  navigatorToDock,
  dockingStateMachine,
  chargingCompleteNotifier,
  x402PaymentSpec,
  rechargeMission,
  accumulateEnergy,
};
