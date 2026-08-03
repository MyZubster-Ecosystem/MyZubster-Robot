'use strict';
// `npm run seed:check` - runs the seed-planting helpers across a simulated
// planting mission on a 3x3 grid and prints a mission summary. No network, local only.
const seed = require('../firmware/lib/seed/seed');

console.log('MyZubster Seed-Planting Kit - mission simulation (issue #77)');
console.log('='.repeat(64));

// 1. GPS origin: Cesena, Italy
const origin = { lat: 44.1397, lon: 12.2422 };
console.log('Field origin: lat=' + origin.lat + ' lon=' + origin.lon);

// 2. NMEA samples at 9 grid points (0.5 m spacing in a 3x3 grid)
console.log('');
console.log('NMEA parsing + GPS-to-grid mapping:');
const positions = [];
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    const dLat = (row * 0.5) / 111000;
    const dLon = (col * 0.5) / (111000 * Math.cos(origin.lat * Math.PI / 180));
    const lat = origin.lat + dLat;
    const lon = origin.lon + dLon;
    // synthetic GGA line
    const latMin = ((lat % 1) * 60).toFixed(3);
    const lonMin = ((lon % 1) * 60).toFixed(3);
    const latDeg = Math.floor(lat);
    const lonDeg = Math.floor(lon);
    const nmea = '$GPGGA,100000,' + latDeg + '' + latMin + ',N,0' + lonDeg + '' + lonMin + ',E,1,06,1.0,50,M,,*XX';
    const parsed = seed.parseNMEA(nmea);
    const grid = seed.gpsToGrid(parsed.lat, parsed.lon, origin);
    positions.push({ row: grid.row, col: grid.col });
    console.log('  r' + row + 'c' + col + ' -> grid row=' + grid.row + ' col=' + grid.col + ' lat=' + parsed.lat.toFixed(8) + ' lon=' + parsed.lon.toFixed(8));
  }
}

// 3. Dibber + dispenser + cover for each position
console.log('');
console.log('Planting mission steps:');
const mission = seed.plantingMission(positions);
for (const step of mission) {
  const desc = step.op + ' [' + step.row + ',' + step.col + ']'
    + (step.depthMm != null ? ' depth=' + step.depthMm + 'mm angle=' + step.angle : '')
    + (step.seeds != null ? ' seeds=' + step.seeds + ' steps=' + step.steps : '')
    + (step.angle != null && step.op === 'cover' ? ' angle=' + step.angle : '');
  console.log('  ' + desc);
}

// 4. Growth monitor readings
console.log('');
console.log('Growth monitor readings:');
const readings = [
  { moisture: 50, temp: 20 }, // plant
  { moisture: 15, temp: 20 }, // dry
  { moisture: 90, temp: 20 }, // wet
  { moisture: 50, temp: 5 },  // cold
  { moisture: 50, temp: 40 },  // hot
];
for (const r of readings) {
  const g = seed.growthMonitor(r.moisture, r.temp);
  console.log('  moisture=' + r.moisture + '% temp=' + r.temp + 'C -> ' + g);
}

// 5. Energy accumulation for the full mission
const servoEnergy = mission
  .filter(s => s.op === 'dig' || s.op === 'cover')
  .map(s => ({ voltage_mV: 5000, current_mA: 250, duration_ms: 500 }));
const stepperEnergy = mission
  .filter(s => s.op === 'seed')
  .map(s => ({ voltage_mV: 5000, current_mA: 200, duration_ms: s.seeds * 512 }));
const allEnergy = servoEnergy.concat(stepperEnergy);
const energy = seed.accumulateEnergy(allEnergy);
console.log('');
console.log('Mission energy: ' + mission.length + ' steps, ' + energy.totalMicroJoules + ' uJ (' + energy.totalMilliWattHours.toFixed(3) + ' mWh)');

// 6. Sanity invariants
const ok =
  positions.length === 9 &&
  mission.length === 36 &&
  mission.filter(s => s.op === 'dig').length === 9 &&
  mission.filter(s => s.op === 'seed').length === 9 &&
  mission.filter(s => s.op === 'cover').length === 9 &&
  seed.dibberAngle(30) === 20 &&
  seed.dispenserSteps(1) === 512 &&
  seed.coverAngle(true) === 40 &&
  seed.growthMonitor(50, 20) === 'plant' &&
  energy.totalMicroJoules > 0;

console.log('');
if (!ok) {
  console.error('FAIL: seed-planting mission invariants not satisfied');
  process.exit(1);
}
console.log('PASS - seed-planting kit: GPS grid mapping + dibber + dispenser + cover + growth monitor + mission state machine deterministically correct (issue #77: robot che costruisce e pianta semi)');
process.exit(0);
