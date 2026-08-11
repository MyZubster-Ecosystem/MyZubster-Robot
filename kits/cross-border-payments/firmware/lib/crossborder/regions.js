'use strict';
// regions.js — region table + FX fixture for the cross-border payments kit.
// Values are illustrative fixtures ONLY. Live FX, sanctions lists, and tax rates
// must be fetched from authoritative sources at runtime by the operator. The kit
// intentionally ships a frozen table so its jest tests stay deterministic.

const DEFAULT_RATES = {
  // currency code -> EUR-base amount. EUR normalised to 1.000 by convention.
  // Mock fixture derived from illustrative Aug 2026 levels; NOT a live price.
  XMR: 165.0,
  EUR: 1.0,
  USD: 0.92,
  SGD: 0.70,
  GBP: 1.17,
  JPY: 0.0061,
};

const REGIONS = {
  IT: { currency: 'EUR', tax: { kind: 'VAT', rate: 0.22 }, xmrOk: true,  label: 'Italy' },
  US: { currency: 'USD', tax: null,                       xmrOk: true,  label: 'United States' },
  SG: { currency: 'SGD', tax: { kind: 'GST', rate: 0.09 }, xmrOk: true,  label: 'Singapore' },
  JP: { currency: 'JPY', tax: { kind: 'CT',  rate: 0.10 }, xmrOk: true,  label: 'Japan' },
  GB: { currency: 'GBP', tax: { kind: 'VAT', rate: 0.20 }, xmrOk: true,  label: 'United Kingdom' },
  DE: { currency: 'EUR', tax: { kind: 'VAT', rate: 0.19 }, xmrOk: true,  label: 'Germany' },
  // Documentation-only stale example of a "do not offer XMR here" entry, useful for
  // surfacing fallback-to-local-currency UI behavior. NOT a compliance opinion.
  XX: { currency: 'USD', tax: null,                       xmrOk: false, label: 'Restricted-Example' },
};

module.exports = { DEFAULT_RATES, REGIONS };
