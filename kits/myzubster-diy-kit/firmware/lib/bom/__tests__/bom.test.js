'use strict';
const {
  normalizeBOM, lineCost, totalCost, isUnder200, getBySku, lintBOM, FIELDS,
} = require('../bom.js');

const SAMPLE = [
  { sku: 'ESP32-DEVKIT-V1', name: 'ESP32 DevKit V1', qty: 1, unit_price_eur: 8.0, category: 'controller' },
  { sku: 'DRV8833', name: 'DRV8833 dual H-bridge', qty: 1, unit_price_eur: 5.0, category: 'driver' },
  { sku: 'TT-MOTOR', name: 'TT gear motor + wheel', qty: 2, unit_price_eur: 4.0, category: 'motor' },
  { sku: 'HC-SR04', name: 'Ultrasonic distance sensor', qty: 1, unit_price_eur: 2.0, category: 'sensor' },
  { sku: 'LIPO-3V7-2000', name: '3.7V 2000mAh 18650 LiPo', qty: 1, unit_price_eur: 7.0, category: 'power' },
  { sku: 'TP4056', name: 'TP4056 LiPo charger', qty: 1, unit_price_eur: 1.0, category: 'power' },
  { sku: 'MB-3V3', name: 'Mini breadboard 3.3V rail', qty: 1, unit_price_eur: 3.0, category: 'wiring' },
  { sku: 'FRAME-SCAD', name: '3D-printable chassis frame (OpenSCAD source)', qty: 1, unit_price_eur: 0.0, category: 'frame-self-print' },
];

describe('FIELDS', () => {
  test('contains the expected schema fields', () => {
    expect(FIELDS).toEqual(['sku', 'name', 'qty', 'unit_price_eur', 'category']);
  });
});

describe('normalizeBOM', () => {
  test('preserves all required fields per row', () => {
    const out = normalizeBOM(SAMPLE);
    expect(out.length).toBe(SAMPLE.length);
    out.forEach((row, i) => {
      expect(row).toEqual(SAMPLE[i]);
    });
  });
  test('rejects non-array input', () => {
    expect(() => normalizeBOM(null)).toThrow(/array/);
    expect(() => normalizeBOM({})).toThrow(/array/);
  });
  test('rejects missing sku', () => {
    expect(() => normalizeBOM([{ name: 'x', qty: 1, unit_price_eur: 1, category: 'c' }])).toThrow(/missing sku/);
  });
  test('rejects non-positive qty', () => {
    expect(() => normalizeBOM([{ sku: 'A', name: 'x', qty: 0, unit_price_eur: 1, category: 'c' }])).toThrow(/qty/);
    expect(() => normalizeBOM([{ sku: 'A', name: 'x', qty: -1, unit_price_eur: 1, category: 'c' }])).toThrow(/qty/);
  });
  test('rejects negative price', () => {
    expect(() => normalizeBOM([{ sku: 'A', name: 'x', qty: 1, unit_price_eur: -1, category: 'c' }])).toThrow(/unit_price_eur/);
  });
  test('rejects missing name', () => {
    expect(() => normalizeBOM([{ sku: 'A', qty: 1, unit_price_eur: 1, category: 'c' }])).toThrow(/missing name/);
  });
  test('rejects missing category', () => {
    expect(() => normalizeBOM([{ sku: 'A', name: 'x', qty: 1, unit_price_eur: 1 }])).toThrow(/missing category/);
  });
});

describe('lineCost', () => {
  test('returns qty * unit_price_eur rounded to 2 decimals', () => {
    expect(lineCost(SAMPLE[2])).toBe(8.0);
    expect(lineCost({ sku: 'A', name: 'x', qty: 3, unit_price_eur: 2.5, category: 'c' })).toBe(7.5);
    expect(lineCost({ sku: 'B', name: 'y', qty: 1, unit_price_eur: 2.55, category: 'c' })).toBe(2.55);
  });
});

describe('totalCost', () => {
  test('sums qty*unit_price_eur across rows, 2 decimals', () => {
    const t = totalCost(SAMPLE);
    expect(t).toBeCloseTo(34.0, 2);
    expect(Number.isInteger(t * 100)).toBe(true);
  });
  test('does not mutate input array', () => {
    const snap = JSON.parse(JSON.stringify(SAMPLE));
    totalCost(SAMPLE);
    expect(SAMPLE).toEqual(snap);
  });
});

describe('isUnder200', () => {
  test('true when totalCost < 200', () => {
    expect(isUnder200(SAMPLE)).toBe(true);
  });
  test('false when totalCost >= 200', () => {
    const overkill = SAMPLE.concat([
      { sku: 'BIG', name: 'big item', qty: 30, unit_price_eur: 6.5, category: 'extra' },
    ]);
    expect(isUnder200(overkill)).toBe(false);
  });
});

describe('getBySku', () => {
  test('returns matching row', () => {
    expect(getBySku(SAMPLE, 'ESP32-DEVKIT-V1').name).toBe('ESP32 DevKit V1');
  });
  test('returns null when not found', () => {
    expect(getBySku(SAMPLE, 'NOPE')).toBeNull();
  });
  test('rejects non-string sku', () => {
    expect(() => getBySku(SAMPLE, 123)).toThrow(/sku must be string/);
  });
});

describe('lintBOM', () => {
  test('returns empty issues for valid sample', () => {
    expect(lintBOM(SAMPLE)).toEqual([]);
  });
  test('flags duplicate sku', () => {
    const dup = SAMPLE.concat([{ sku: 'ESP32-DEVKIT-V1', name: 'dup', qty: 1, unit_price_eur: 1, category: 'controller' }]);
    const issues = lintBOM(dup);
    expect(issues.join('\n')).toMatch(/duplicate sku "ESP32-DEVKIT-V1"/);
  });
  test('flags zero price for non-self-print category', () => {
    const weird = [{ sku: 'X', name: 'weird', qty: 1, unit_price_eur: 0, category: 'controller' }];
    expect(lintBOM(weird).join('\n')).toMatch(/zero price for sku "X"/);
  });
  test('allows zero price for self-print frame category', () => {
    const scad = SAMPLE.find(p => p.category === 'frame-self-print');
    expect(lintBOM([scad])).toEqual([]);
  });
  test('reports schema error', () => {
    expect(lintBOM([{ sku: null }]).join('\n')).toMatch(/schema error/);
  });
});
