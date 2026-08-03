'use strict';
// bom-check.js — `npm run bom:check` validates the kit BOM cost stays under the
// 200 EUR budget promised by issue #75. Exits 0 on success, 1 if over budget.
const { totalCost, isUnder200, lintBOM } = require('../firmware/lib/bom/bom.js');

const BOM = [
  { sku: 'ESP32-DEVKIT-V1', name: 'ESP32 DevKit V1', qty: 1, unit_price_eur: 8.0, category: 'controller' },
  { sku: 'DRV8833', name: 'DRV8833 dual H-bridge motor driver', qty: 1, unit_price_eur: 5.0, category: 'driver' },
  { sku: 'TT-MOTOR', name: 'TT gear DC motor + wheel, 3-6V', qty: 2, unit_price_eur: 4.0, category: 'motor' },
  { sku: 'HC-SR04', name: 'HC-SR04 ultrasonic distance sensor', qty: 1, unit_price_eur: 2.0, category: 'sensor' },
  { sku: 'IR-PROX-2P', name: 'IR proximity sensor (analog)', qty: 2, unit_price_eur: 1.5, category: 'sensor' },
  { sku: 'LIPO-3V7-2000', name: '3.7V 2000mAh 18650 LiPo', qty: 1, unit_price_eur: 7.0, category: 'power' },
  { sku: 'TP4056', name: 'TP4056 LiPo charger breakout', qty: 1, unit_price_eur: 1.0, category: 'power' },
  { sku: 'MB-3V3', name: 'Mini breadboard 3.3V rail', qty: 1, unit_price_eur: 3.0, category: 'wiring' },
  { sku: 'JW-40', name: 'Jumper wires 40pc male-male + 40 male-female', qty: 1, unit_price_eur: 2.5, category: 'wiring' },
  { sku: 'USB-C-BOOT', name: 'USB-C cable for flashing', qty: 1, unit_price_eur: 2.0, category: 'wiring' },
  { sku: 'FRAME-SCAD', name: '3D-printable chassis frame (OpenSCAD source; print locally)', qty: 1, unit_price_eur: 0.0, category: 'frame-self-print' },
];

const issues = lintBOM(BOM);
const total = totalCost(BOM);
console.log('MyZubster DIY Kit — BOM check');
console.log('Parts: ' + BOM.length);
console.log('Total indicative EU cost: EUR ' + total.toFixed(2));
console.log('Budget cap: 200.00 EUR (issue #75)');
console.log('Polarity: ' + (isUnder200(BOM) ? 'PASS — under budget' : 'FAIL — over budget'));
if (issues.length) {
  console.log('Lint issues:');
  for (const x of issues) console.log(' - ' + x);
}
if (!isUnder200(BOM) || issues.length) {
  console.error('BOM check failed.');
  process.exit(1);
}
console.log('OK.');
