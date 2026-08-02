'use strict';
// Pure-JS mother-robot-kit helpers for MyZubster-Robot issue #78 (Mother Robot
// / Robot madre MyZubster). Extracted from firmware/firmware.ino so the assembly
// arm IK, component inventory, assembly sequence, child registration, and birth
// firmware decisions are unit-testable. All pure integer/float math, no I/O, no
// network, no crypto - matches the safe-harbor scope of the #71 eco kit, #74 agri
// kit, #75 DIY kit, #76 garden kit, and #77 seed kit.

const DEFAULTS = {
  // Assembly arm (3-DOF: base rotate + shoulder + elbow)
  armBaseStepsPerRev: 200,     // stepper steps per full base rotation
  armShoulderStepsPerRev: 200, // stepper steps per full shoulder rotation
  armElbowStepsPerRev: 200,   // stepper steps per full elbow rotation
  armBaseGearRatio: 2,        // gear reduction (motor:joint)
  armShoulderGearRatio: 3,
  armElbowGearRatio: 2,
  // Link lengths (mm)
  armShoulderLenMm: 120,       // upper arm length
  armElbowLenMm: 100,          // forearm length
  // Component storage magazine
  magazineSlots: 6,             // number of component slots
  magazineStepsPerSlot: 68,    // stepper steps to index one slot
  // Servo for gripper
  gripperOpenAngle: 90,        // servo angle when gripper is open
  gripperCloseAngle: 30,       // servo angle when gripper is closed
  // Welding / connector head
  welderDeployAngle: 60,      // servo angle when welder head is deployed
  welderRetractAngle: 120,    // servo angle when welder head is retracted
  // Birth firmware
  childDefaultName: 'myzubster-child-001',
};

function optWith(opt) { return Object.assign({}, DEFAULTS, opt || {}); }

// --- Component inventory manager ---
// Track which components are stocked in the magazine and which are depleted.
// Returns inventory state after add/remove operations.
function componentInventory(action, state, component, opt) {
  const o = optWith(opt);
  if (!Array.isArray(state)) throw new TypeError('state must be an array');
  if (typeof component !== 'string') throw new TypeError('component must be a string');
  if (action === 'add') {
    if (state.length >= o.magazineSlots) return { state, full: true, added: false };
    return { state: [...state, component], full: state.length + 1 >= o.magazineSlots, added: true };
  }
  if (action === 'remove') {
    const idx = state.indexOf(component);
    if (idx < 0) return { state, removed: false };
    return { state: state.filter((_, i) => i !== idx), removed: true };
  }
  if (action === 'count') {
    return { count: state.length, full: state.length >= o.magazineSlots, empty: state.length === 0 };
  }
  throw new TypeError('action must be add, remove, or count');
}

// --- Arm inverse kinematics solver ---
// Given a target (x, y) in mm relative to the arm base, compute the shoulder and
// elbow joint angles (degrees) to reach it. 2-link polar IK.
function armIK(targetX, targetY, opt) {
  const o = optWith(opt);
  if (typeof targetX !== 'number' || typeof targetY !== 'number') {
    throw new TypeError('targetX and targetY must be numbers');
  }
  const L1 = o.armShoulderLenMm;
  const L2 = o.armElbowLenMm;
  const dist = Math.sqrt(targetX * targetX + targetY * targetY);
  const maxReach = L1 + L2;
  const minReach = Math.abs(L1 - L2);
  if (dist > maxReach) return { reachable: false, reason: 'too_far', dist, maxReach };
  if (dist < minReach) return { reachable: false, reason: 'too_close', dist, minReach };
  // Law of cosines for shoulder angle (angle at base)
  const cosShoulder = (targetX * targetX + targetY * targetY + L1 * L1 - L2 * L2) / (2 * L1 * dist);
  const shoulderRad = Math.atan2(targetY, targetX) - Math.acos(Math.max(-1, Math.min(1, cosShoulder)));
  // Elbow angle: law of cosines for the elbow joint
  const cosElbow = (L1 * L1 + L2 * L2 - targetX * targetX - targetY * targetY) / (2 * L1 * L2);
  const elbowRad = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosElbow)));
  return {
    reachable: true,
    shoulderDeg: Math.round(shoulderRad * 180 / Math.PI * 100) / 100,
    elbowDeg: Math.round(elbowRad * 180 / Math.PI * 100) / 100,
    dist: Math.round(dist * 100) / 100,
  };
}

// --- Arm stepper step planner ---
// Convert joint angles (degrees) to stepper motor steps for each axis.
function armSteps(shoulderDeg, elbowDeg, baseDeg, opt) {
  const o = optWith(opt);
  if (typeof shoulderDeg !== 'number' || typeof elbowDeg !== 'number' || typeof baseDeg !== 'number') {
    throw new TypeError('shoulderDeg, elbowDeg, baseDeg must be numbers');
  }
  const baseSteps = Math.round((baseDeg / 360) * o.armBaseStepsPerRev * o.armBaseGearRatio);
  const shoulderSteps = Math.round((shoulderDeg / 360) * o.armShoulderStepsPerRev * o.armShoulderGearRatio);
  const elbowSteps = Math.round((elbowDeg / 360) * o.armElbowStepsPerRev * o.armElbowGearRatio);
  return { baseSteps, shoulderSteps, elbowSteps };
}

// --- Magazine indexer ---
// Compute stepper steps to advance the magazine by N slots.
function magazineSteps(slotCount, opt) {
  const o = optWith(opt);
  if (typeof slotCount !== 'number' || !Number.isFinite(slotCount)) throw new TypeError('slotCount must be a number');
  if (slotCount < 0) return 0;
  return Math.round(slotCount * o.magazineStepsPerSlot);
}

// --- Gripper angle ---
function gripperAngle(closed, opt) {
  const o = optWith(opt);
  return closed ? o.gripperCloseAngle : o.gripperOpenAngle;
}

// --- Welder head angle ---
function welderAngle(deployed, opt) {
  const o = optWith(opt);
  return deployed ? o.welderDeployAngle : o.welderRetractAngle;
}

// --- Child registration logger ---
// Generate a child robot registration record (deterministic, no network).
function registerChild(childId, motherboard, sensors, opt) {
  const o = optWith(opt);
  if (typeof childId !== 'string') throw new TypeError('childId must be a string');
  if (!Array.isArray(sensors)) throw new TypeError('sensors must be an array');
  if (typeof motherboard !== 'string') throw new TypeError('motherboard must be a string');
  return {
    childId,
    motherboard,
    sensors,
    registeredAt: 'deterministic-stub',
    firmwareVersion: '0.1.0',
    status: 'registered',
  };
}

// --- Birth firmware generator ---
// Produce a deterministic birth-firmware spec (firmware parameters for the child).
function birthFirmwareSpec(childConfig, opt) {
  const o = optWith(opt);
  if (!childConfig || typeof childConfig !== 'object') throw new TypeError('childConfig must be an object');
  const motorCount = childConfig.motors || 2;
  const sensorCount = (childConfig.sensors || []).length;
  return {
    childId: childConfig.childId || o.childDefaultName,
    flashSize: 4 * 1024 * 1024, // 4 MB ESP32 flash
    partitionTable: 'default',
    wifi: { enabled: false, ssid: null, password: null },
    motors: { count: motorCount, type: 'N20' },
    sensors: childConfig.sensors || [],
    birthSequence: ['boot', 'self_test', 'motor_init', 'sensor_init', 'register_with_mother', 'ready'],
    parent: 'mother-001',
  };
}

// --- Assembly sequence state machine ---
// Given a child spec, produce the ordered assembly steps.
// Each step: { op: 'pick'|'position'|'connect'|'verify'|'next', component, slot, arm, gripper, welder }
function assemblySequence(childSpec, opt) {
  const o = optWith(opt);
  if (!childSpec || !Array.isArray(childSpec.components)) {
    throw new TypeError('childSpec must have components array');
  }
  const steps = [];
  steps.push({ op: 'init', childId: childSpec.childId || o.childDefaultName });
  let slot = 0;
  for (const comp of childSpec.components) {
    steps.push({ op: 'pick', component: comp, slot, gripper: gripperAngle(true, o) });
    steps.push({ op: 'position', component: comp, slot, arm: armSteps(0, 0, 0, o) });
    steps.push({ op: 'connect', component: comp, slot, welder: welderAngle(true, o) });
    steps.push({ op: 'verify', component: comp, slot, gripper: gripperAngle(false, o) });
    slot++;
  }
  steps.push({ op: 'flash', childId: childSpec.childId || o.childDefaultName, firmware: birthFirmwareSpec(childSpec, o) });
  steps.push({ op: 'register', record: registerChild(childSpec.childId || o.childDefaultName, childSpec.motherboard || 'ESP32', childSpec.sensors || [], o) });
  steps.push({ op: 'complete', childId: childSpec.childId || o.childDefaultName });
  return steps;
}

// --- Energy accumulation (same formula as agri.js / eco.js / seed.js / garden.js) ---
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
  componentInventory,
  armIK,
  armSteps,
  magazineSteps,
  gripperAngle,
  welderAngle,
  registerChild,
  birthFirmwareSpec,
  assemblySequence,
  accumulateEnergy,
};
