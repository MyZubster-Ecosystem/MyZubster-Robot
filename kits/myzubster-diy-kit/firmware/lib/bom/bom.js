'use strict';
// bom.js — pure BOM helpers for the MyZubster DIY kit (issue #75).
// No network/file I/O; deterministic and unit-testable.
// Keeps an authoritative BOM schema here so BOM.md, the iOS/Aspect-style
// renderer, future docs, and tests all agree on the same field set.

const FIELDS = ['sku', 'name', 'qty', 'unit_price_eur', 'category'];

function normalizeBOM(raw) {
  if (!Array.isArray(raw)) throw new TypeError('normalizeBOM: raw must be array');
  return raw.map((p, i) => {
    if (!p || typeof p !== 'object') throw new TypeError('normalizeBOM: part[' + i + '] not object');
    const out = {};
  for (const f of FIELDS) {
    out[f] = p[f];
  }
    if (typeof out.sku !== 'string' || !out.sku) throw new TypeError('normalizeBOM: part[' + i + '] missing sku');
    if (typeof out.name !== 'string' || !out.name) throw new TypeError('normalizeBOM: part[' + i + '] missing name');
    if (!Number.isFinite(out.qty) || out.qty <= 0) throw new TypeError('normalizeBOM: part[' + i + '] qty must be positive finite number, got ' + String(out.qty));
    if (!Number.isFinite(out.unit_price_eur) || out.unit_price_eur < 0) throw new TypeError('normalizeBOM: part[' + i + '] unit_price_eur must be non-negative finite number, got ' + String(out.unit_price_eur));
    if (typeof out.category !== 'string' || !out.category) throw new TypeError('normalizeBOM: part[' + i + '] missing category');
    return out;
  });
}

function lineCost(item) {
  return Number((item.qty * item.unit_price_eur).toFixed(2));
}

function totalCost(items) {
  const norm = normalizeBOM(items);
  return Number(norm.reduce((acc, p) => acc + p.qty * p.unit_price_eur, 0).toFixed(2));
}

function isUnder200(items) {
  return totalCost(items) < 200;
}

function getBySku(items, sku) {
  if (typeof sku !== 'string') throw new TypeError('getBySku: sku must be string');
  const norm = normalizeBOM(items);
  return norm.find(p => p.sku === sku) || null;
}

function lintBOM(items) {
  const issues = [];
  let seen = {};
  try {
    const norm = normalizeBOM(items);
    norm.forEach((p, i) => {
      if (seen[p.sku] !== undefined) issues.push('duplicate sku "' + p.sku + '" at index ' + i + ' and ' + seen[p.sku]);
      else seen[p.sku] = i;
      if (p.unit_price_eur === 0 && p.category !== 'frame-self-print') issues.push('zero price for sku "' + p.sku + '" (category "' + p.category + '") — confirm free / self-print intent');
    });
  } catch (e) {
    issues.push('schema error: ' + e.message);
  }
  return issues;
}

module.exports = { FIELDS, normalizeBOM, lineCost, totalCost, isUnder200, getBySku, lintBOM };
