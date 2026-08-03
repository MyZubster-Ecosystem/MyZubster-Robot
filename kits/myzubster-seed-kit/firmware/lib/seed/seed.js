'use strict';
// Pure-JS seed-planting-kit helpers for MyZubster-Robot issue #77 (automatic
// seed-planting robot). Extracted from firmware/firmware.ino so the GPS / dibber /
// dispenser / cover / growth-monitor decisions are unit-testable. All integer/float
// math, no I/O, no network, no crypto - matches the safe-harbor scope of the #71 eco
// kit, #74 agri kit, and #75 DIY kit.

const DEFAULTS = {
  // GPS
  earthRadiusM: 6371000,     // mean earth radius in meters
  gridSpacingM: 0.5,          // distance between planting holes in the grid
  // Dibber servo (SG90-style 0-180 degrees)
  dibberRestAngle: 90,        // servo angle when dibber is raised (rest)
  dibberDownAngle: 20,        // servo angle when dibber fully inserted
  dibberHoleDepthMm: 30,      // target hole depth in mm
  // Seed dispenser (28BYJ-48 stepper, 4096 steps/rev via ULN2003)
  dispenserStepsPerRev: 4096,
  dispenserSlotsPerRev: 8,    // 8-slot Geneva wheel or slotted disk
  // Soil cover servo
  coverRestAngle: 110,        // servo angle when cover blade is retracted
  coverPushAngle: 40,         // servo angle when cover blade pushes soil over hole
  // Growth monitor thresholds
  germinationMoistureMin: 25, // moisture % below this is too dry for germination
  germinationMoistureMax: 80, // moisture % above this is waterlogged
  germinationTempMin: 10,     // too cold for germination
  germinationTempMax: 35,     // too hot for germination
};

function optWith(opt) { return Object.assign({}, DEFAULTS, opt || {}); }

// --- NMEA parser ---
// Parse a $GPGGA or $GPRMC sentence, extract lat/lon in decimal degrees + valid flag.
// This is the "Integrare GPS" deliverable. Pure parse, no network, no GPS fix wait.
function parseNMEA(line) {
  if (typeof line !== 'string') throw new TypeError('line must be a string');
  const parts = line.trim().split(',');
  const tag = parts[0];
  if (tag === '$GPGGA' || tag === '$GNGGA') {
    // $GPGGA,time,lat,N,S,lon,E,fix,nsat,hdop,alt,M,
    if (parts[6] !== '1' && parts[6] !== '2') return { valid: false, lat: null, lon: null };
    const lat = nmeaToDeg(parts[2], parts[3]);
    const lon = nmeaToDeg(parts[4], parts[5]);
    return { valid: !!(lat && lon), lat, lon, fix: parseInt(parts[6], 10), sats: parseInt(parts[7] || '0', 10) };
  }
  if (tag === '$GPRMC' || tag === '$GNRMC') {
    // $GPRMC,time,status,lat,N,lon,E,
    if (parts[2] !== 'A') return { valid: false, lat: null, lon: null };
    const lat = nmeaToDeg(parts[3], parts[4]);
    const lon = nmeaToDeg(parts[5], parts[6]);
    return { valid: !!(lat && lon), lat, lon, status: 'A' };
  }
  return { valid: false, lat: null, lon: null };
}

function nmeaToDeg(valStr, dir) {
  if (!valStr) return null;
  // NMEA coordinate format: latitude = DDMM.MMM (2 deg digits), longitude = DDDMM.MMM (3 deg digits).
  // Determine by the hemisphere direction, not by decimal-point position.
  const isLat = (dir === 'N' || dir === 'S');
  const degLen = isLat ? 2 : 3;
  const deg = parseInt(valStr.slice(0, degLen), 10);
  const min = parseFloat(valStr.slice(degLen)); // remaining is minutes as float
  if (!Number.isFinite(deg) || !Number.isFinite(min)) return null;
  let result = deg + min / 60;
  if (dir === 'S' || dir === 'W') result = -result;
  return result;
}

// --- GPS to planting grid mapper ---
// Given a GPS coordinate + a field origin, compute the nearest grid row / col.
// Uses equirectangular approximation (valid for small areas < ~10 km).
function gpsToGrid(lat, lon, origin, opt) {
  const o = optWith(opt);
  if (typeof lat !== 'number' || typeof lon !== 'number') throw new TypeError('lat/lon must be numbers');
  if (!origin || typeof origin.lat !== 'number' || typeof origin.lon !== 'number') {
    throw new TypeError('origin must have {lat, lon}');
  }
  const latRad = lat * Math.PI / 180;
  const originLatRad = origin.lat * Math.PI / 180;
  const dLat = (lat - origin.lat) * Math.PI / 180 * o.earthRadiusM;
  const dLon = (lon - origin.lon) * Math.PI / 180 * o.earthRadiusM * Math.cos(originLatRad);
  const row = Math.round(dLat / o.gridSpacingM);
  const col = Math.round(dLon / o.gridSpacingM);
  return { row, col, dLatM: dLat, dLonM: dLon };
}

// --- Dibber servo angle ---
// Map a desired hole depth to a servo angle. linear interpolation between
// rest (depth 0) and down (max depth). Returns angle in degrees for SG90 servo.
function dibberAngle(depthMm, opt) {
  const o = optWith(opt);
  if (typeof depthMm !== 'number' || !Number.isFinite(depthMm)) throw new TypeError('depthMm must be a finite number');
  const clamped = Math.max(0, Math.min(depthMm, o.dibberHoleDepthMm));
  const frac = clamped / o.dibberHoleDepthMm;
  return Math.round(o.dibberRestAngle - frac * (o.dibberRestAngle - o.dibberDownAngle));
}

// --- Seed dispenser step count ---
// Compute stepper motor steps to dispense a given number of seeds.
// Each slot dispenses one seed; steps per seed = stepsPerRev / slotsPerRev.
function dispenserSteps(seedCount, opt) {
  const o = optWith(opt);
  if (typeof seedCount !== 'number' || !Number.isFinite(seedCount)) throw new TypeError('seedCount must be a finite number');
  if (seedCount < 0) return 0;
  const stepsPerSeed = o.dispenserStepsPerRev / o.dispenserSlotsPerRev;
  return Math.ceil(seedCount * stepsPerSeed);
}

// --- Soil cover servo angle ---
// Rest angle (retracted) vs push angle (soil pushed over hole).
function coverAngle(forPush, opt) {
  const o = optWith(opt);
  return forPush ? o.coverPushAngle : o.coverRestAngle;
}

// --- Growth monitor ---
// Given moisture % + temperature C, determine whether germination conditions are suitable.
// Returns 'plant' / 'wait_dry' / 'wait_wet' / 'wait_cold' / 'wait_hot'.
function growthMonitor(moisturePct, tempC, opt) {
  const o = optWith(opt);
  if (typeof moisturePct !== 'number' || typeof tempC !== 'number') throw new TypeError('moisturePct and tempC must be numbers');
  if (moisturePct < o.germinationMoistureMin) return 'wait_dry';
  if (moisturePct > o.germinationMoistureMax) return 'wait_wet';
  if (tempC < o.germinationTempMin) return 'wait_cold';
  if (tempC > o.germinationTempMax) return 'wait_hot';
  return 'plant';
}

// --- Planting mission state machine ---
// Given a list of grid positions, produce an ordered sequence of planting commands.
// Each position { row, col } generates: { op: 'dig', ... }, { op: 'seed', ... }, { op: 'cover', ... }.
function plantingMission(positions, opt) {
  const o = optWith(opt);
  if (!Array.isArray(positions)) throw new TypeError('positions must be an array');
  const steps = [];
  for (const pos of positions) {
    if (!pos || typeof pos.row !== 'number' || typeof pos.col !== 'number') {
      throw new TypeError('each position needs numeric row, col');
    }
    steps.push({ op: 'move', row: pos.row, col: pos.col });
    steps.push({ op: 'dig', row: pos.row, col: pos.col, depthMm: o.dibberHoleDepthMm, angle: dibberAngle(o.dibberHoleDepthMm, o) });
    steps.push({ op: 'seed', row: pos.row, col: pos.col, seeds: 1, steps: dispenserSteps(1, o) });
    steps.push({ op: 'cover', row: pos.row, col: pos.col, angle: coverAngle(true, o) });
  }
  return steps;
}

// --- Energy accumulation (same formula as agri.js / eco.js) ---
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
  parseNMEA,
  nmeaToDeg,
  gpsToGrid,
  dibberAngle,
  dispenserSteps,
  coverAngle,
  growthMonitor,
  plantingMission,
  accumulateEnergy,
};
