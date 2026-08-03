'use strict';
// Pure-JS garden-automation-kit helpers for MyZubster-Robot issue #76 (Robot che
// risparmia tempo in giardino). Extracted from firmware/firmware.ino so the grass
// cutting / irrigation / weed detection / garden mapping decisions are unit-testable.
// All pure integer/float math, no I/O, no network, no crypto - matches the
// safe-harbor scope of the #71 eco kit, #74 agri kit, #75 DIY kit, and #77 seed kit.

const DEFAULTS = {
  // Grass cutting (mower scheduler)
  cutStartHour: 8,            // earliest hour (0-23) the mower is allowed to run
  cutEndHour: 20,            // latest hour (exclusive)
  maxCutMoisturePct: 45,     // do not cut above this soil moisture (slip + tear risk)
  rainGuard: true,           // skip cutting when soil is too wet
  // Boustrophedon mowing path
  swathWidthM: 0.22,         // cutting blade width in meters (~22 cm mower)
  // Irrigation scheduler
  moistureThresholdMin: 25,  // below this -> soil is too dry, water even off-schedule
  moistureThresholdMax: 70,  // above this -> soil is saturated, skip watering
  // Weed classifier
  weedHeightMinMm: 50,       // taller than this while green -> classified as weed
  grassHeightMaxMm: 40,     // at-or-below this while green -> healthy grass
  greenDensityMin: 0.20,    // green pixel ratio below this -> bare soil
  // Garden mapping
  mapCellM: 0.5,             // grid cell size in meters for occupancy map
};

function optWith(opt) { return Object.assign({}, DEFAULTS, opt || {}); }

// --- Grass cutting scheduler ---
// Decide whether the mower is allowed to cut at a given hour + soil moisture.
// Returns 'cut' / 'skip_wet' / 'off_window'.
function mowerScheduler(hour, moisturePct, opt) {
  const o = optWith(opt);
  if (typeof hour !== 'number' || !Number.isFinite(hour)) throw new TypeError('hour must be a number');
  if (typeof moisturePct !== 'number' || !Number.isFinite(moisturePct)) throw new TypeError('moisturePct must be a number');
  const hourInt = Math.floor(hour);
  if (hourInt < o.cutStartHour || hourInt >= o.cutEndHour) return 'off_window';
  if (o.rainGuard && moisturePct > o.maxCutMoisturePct) return 'skip_wet';
  return 'cut';
}

// --- Boustrophedon mowing path planner ---
// Generate a back-and-forth (lawn-mower) coverage path for a rectangular field.
// Returns an ordered list of waypoints {x, y} in meters with {dir: 'right'|'left'}
// describing the sweep across rows. Rows are spaced by swathWidthM.
function boustrophedonPath(fieldWidthM, fieldHeightM, opt) {
  const o = optWith(opt);
  if (typeof fieldWidthM !== 'number' || typeof fieldHeightM !== 'number') {
    throw new TypeError('fieldWidthM and fieldHeightM must be numbers');
  }
  if (fieldWidthM <= 0 || fieldHeightM <= 0) throw new RangeError('dimensions must be positive');
  if (o.swathWidthM <= 0) throw new RangeError('swathWidthM must be positive');
  const points = [];
  const rows = Math.ceil(fieldHeightM / o.swathWidthM);
  let dir = 'right';
  for (let r = 0; r < rows; r++) {
    const y = r >= rows - 1 ? Math.max(fieldHeightM / 2, fieldHeightM - o.swathWidthM / 2) : r * o.swathWidthM + o.swathWidthM / 2;
    if (dir === 'right') {
      points.push({ x: 0, y, dir: 'right' });
      points.push({ x: fieldWidthM, y, dir: 'right' });
      dir = 'left';
    } else {
      points.push({ x: fieldWidthM, y, dir: 'left' });
      points.push({ x: 0, y, dir: 'left' });
      dir = 'right';
    }
  }
  return points;
}

// --- Coverage area ---
// Compute the mown area covered by a boustrophedon path.
// Each row sweep covers swathWidth * fieldWidth. The last partial row is
// clamped to the remaining height so we never overstate coverage.
function coverageArea(pathPoints, fieldWidthM, fieldHeightM, opt) {
  const o = optWith(opt);
  if (!Array.isArray(pathPoints)) throw new TypeError('pathPoints must be an array');
  if (fieldWidthM <= 0 || fieldHeightM <= 0) throw new RangeError('dimensions must be positive');
  // Count distinct rows (unique y values)
  const ys = new Set();
  for (const p of pathPoints) {
    if (!p || typeof p.y !== 'number') throw new TypeError('each point needs numeric y');
    ys.add(Math.round(p.y * 1e6)); // quantize to avoid float drift
  }
  const rowCount = ys.size;
  // Each full row covers swathWidth * fieldWidth. Last row may be partial.
  const rows = Math.ceil(fieldHeightM / o.swathWidthM);
  const lastRowRemainder = fieldHeightM - (rows - 1) * o.swathWidthM;
  const fullRows = rowCount - 1;
  let area;
  if (rowCount >= rows) {
    area = (rows - 1) * o.swathWidthM * fieldWidthM + Math.min(lastRowRemainder, o.swathWidthM) * fieldWidthM;
  } else if (fullRows > 0) {
    area = fullRows * o.swathWidthM * fieldWidthM + Math.min(lastRowRemainder, o.swathWidthM) * fieldWidthM;
  } else {
    area = Math.min(lastRowRemainder, o.swathWidthM) * fieldWidthM;
  }
  return Math.min(area, fieldWidthM * fieldHeightM);
}

// --- Irrigation scheduler ---
// Given a list of watering windows + current hour + soil moisture, decide whether
// the irrigation valve should open.
// entries: [{ startHour, endHour, durationMin }]
// Returns { active: boolean, reason: 'scheduled'|'saturated'|'dry_override'|'idle',
//          window: entry|null, durationMin: number }
function irrigationScheduler(entries, hour, moisturePct, opt) {
  const o = optWith(opt);
  if (!Array.isArray(entries)) throw new TypeError('entries must be an array');
  if (typeof hour !== 'number' || typeof moisturePct !== 'number') {
    throw new TypeError('hour and moisturePct must be numbers');
  }
  if (moisturePct > o.moistureThresholdMax) {
    return { active: false, reason: 'saturated', window: null, durationMin: 0 };
  }
  const hourInt = Math.floor(hour);
  for (const e of entries) {
    if (!e || typeof e.startHour !== 'number' || typeof e.endHour !== 'number') {
      throw new TypeError('each window needs numeric startHour, endHour');
    }
    if (hourInt >= e.startHour && hourInt < e.endHour) {
      return { active: true, reason: 'scheduled', window: e, durationMin: e.durationMin || 0 };
    }
  }
  if (moisturePct < o.moistureThresholdMin) {
    return { active: true, reason: 'dry_override', window: null, durationMin: o.dryOverrideMin || 5 };
  }
  return { active: false, reason: 'idle', window: null, durationMin: 0 };
}

// --- Weed classifier ---
// Given plant height (mm) + green pixel density (0-1), classify the plot.
// Returns 'weed' / 'grass' / 'bare_soil'.
function weedClassifier(heightMm, greenDensity, opt) {
  const o = optWith(opt);
  if (typeof heightMm !== 'number' || typeof greenDensity !== 'number') {
    throw new TypeError('heightMm and greenDensity must be numbers');
  }
  if (greenDensity < o.greenDensityMin) return 'bare_soil';
  if (heightMm > o.weedHeightMinMm) return 'weed';
  if (heightMm <= o.grassHeightMaxMm) return 'grass';
  return 'weed';
}

// --- Garden mapping ---
// Given a list of robot positions { x, y } (meters) + cell size, build an occupancy
// grid. Returns { rows, cols, grid (2D 0/1), visitedCells, totalCells, coverage }.
function gardenMap(positions, opt) {
  const o = optWith(opt);
  if (!Array.isArray(positions)) throw new TypeError('positions must be an array');
  if (o.mapCellM <= 0) throw new RangeError('mapCellM must be positive');
  if (positions.length === 0) {
    return { rows: 0, cols: 0, grid: [], visitedCells: 0, totalCells: 0, coverage: 0 };
  }
  let maxX = 0, maxY = 0;
  for (const p of positions) {
    if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') {
      throw new TypeError('each position needs numeric x, y');
    }
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const cols = Math.floor(maxX / o.mapCellM) + 1;
  const rows = Math.floor(maxY / o.mapCellM) + 1;
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(cols).fill(0));
  }
  let visited = 0;
  const seen = new Set();
  for (const p of positions) {
    const c = Math.floor(p.x / o.mapCellM);
    const rw = Math.floor(p.y / o.mapCellM);
    const key = rw + ',' + c;
    if (!seen.has(key)) { seen.add(key); grid[rw][c] = 1; visited++; }
  }
  const total = rows * cols;
  return { rows, cols, grid, visitedCells: visited, totalCells: total, coverage: total > 0 ? visited / total : 0 };
}

// --- Garden mission state machine ---
// Given a garden plan, produce an ordered sequence of garden task commands.
// plan: { field: {widthM, heightM}, samples: [{x, y}], weederPoints: [{heightMm, greenDensity}],
//         irrigateWindows: [{startHour, endHour, durationMin}] }
// Returns ordered steps: mow coverage path + irrigate + detect weeds + map samples.
function gardenMission(plan, opt) {
  const o = optWith(opt);
  if (!plan || !plan.field) throw new TypeError('plan needs field {widthM, heightM}');
  const f = plan.field;
  if (typeof f.widthM !== 'number' || typeof f.heightM !== 'number') {
    throw new TypeError('field needs numeric widthM, heightM');
  }
  const steps = [];
  // Phase 1: mow (boustrophedon path becomes 'move' waypoints)
  const path = boustrophedonPath(f.widthM, f.heightM, o);
  steps.push({ op: 'mow_start', rows: path.length / 2, swathWidthM: o.swathWidthM });
  for (const pt of path) {
    steps.push({ op: 'mow_move', x: pt.x, y: pt.y, dir: pt.dir });
  }
  steps.push({ op: 'mow_end' });
  // Phase 2: irrigate (one step per scheduled window)
  steps.push({ op: 'irrigate_start' });
  const windows = plan.irrigateWindows || [];
  for (const w of windows) {
    steps.push({ op: 'irrigate_window', startHour: w.startHour, endHour: w.endHour, durationMin: w.durationMin });
  }
  steps.push({ op: 'irrigate_end' });
  // Phase 3: detect weeds (one classify step per probe point)
  steps.push({ op: 'detect_start' });
  const wp = plan.weederPoints || [];
  for (const idx in wp) {
    const w = wp[idx];
    steps.push({ op: 'detect', idx: parseInt(idx, 10), heightMm: w.heightMm, greenDensity: w.greenDensity, label: weedClassifier(w.heightMm, w.greenDensity, o) });
  }
  steps.push({ op: 'detect_end', counts: steps.filter(s => s.op === 'detect').reduce((a, s) => { a[s.label] = (a[s.label] || 0) + 1; return a; }, {}) });
  // Phase 4: garden mapping (record sampled positions as map points)
  steps.push({ op: 'map_start' });
  const samples = plan.samples || [];
  for (const idx in samples) {
    const s = samples[idx];
    steps.push({ op: 'map_point', idx: parseInt(idx, 10), x: s.x, y: s.y });
  }
  const map = gardenMap(samples, o);
  steps.push({ op: 'map_end', visitedCells: map.visitedCells, totalCells: map.totalCells, coverage: map.coverage });
  return steps;
}

// --- Energy accumulation (same formula as agri.js / eco.js / seed.js) ---
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
  mowerScheduler,
  boustrophedonPath,
  coverageArea,
  irrigationScheduler,
  weedClassifier,
  gardenMap,
  gardenMission,
  accumulateEnergy,
};
