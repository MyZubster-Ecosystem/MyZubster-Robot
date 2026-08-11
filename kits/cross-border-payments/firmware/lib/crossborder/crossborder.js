'use strict';
// crossborder.js — pure-JS helpers for the `kits/cross-border-payments/` package.
// Issue: MyZubster-Ecosystem/MyZubster-Robot #21 ("[Global] Cross-border payments with Monero").
//
// Every function below is pure and deterministic. Nothing here signs, broadcasts,
// custody-holds, or otherwise touches a real Monero network. The "test payments
// between regions" task from the issue is exercised over local mock / testnet
// fixtures only — see `mockTransactionLedger()` and `docs/safe-harbor-note.md` for
// the §2 boundary the implementer followed.

const { REGIONS, DEFAULT_RATES } = require('./regions');

// ---------- Rounding ----------

// Banker's rounding toward the nearest even value at the chosen decimal place.
// Display rounding for financial UIs should never favour a single direction —
// half-up inflates totals over time, half-down deflates them. IEEE 754 round-half-even
// is the audit-friendly default used by exchanges and payment gateways.
function bankerRound(amount, decimals = 2) {
  if (!Number.isFinite(amount)) throw new RangeError('amount must be a finite number');
  if (!Number.isInteger(decimals) || decimals < 0) throw new RangeError('decimals must be a non-negative integer');
  const f = Math.pow(10, decimals);
  const x = amount * f;
  const r = Math.round(x);
  if (Math.abs(x - r) === 0.5 && r % 2 !== 0) return (r - 1) / f;
  return r / f;
}

const SUBUNIT = { EUR: 2, USD: 2, SGD: 2, GBP: 2, JPY: 0, XMR: 12 };
function roundToCurrency(amount, currency) {
  const d = SUBUNIT[currency] == null ? 2 : SUBUNIT[currency];
  return bankerRound(amount, d);
}

// ---------- Currency conversion ----------

// Pure FX conversion. rates maps currency code -> EUR-base amount (EUR=1.000 by
// convention). Pure: no live price feed, no caching, no Date.now().
function convertAmount(amount, fromCurrency, toCurrency, rates = DEFAULT_RATES) {
  if (!Number.isFinite(amount)) throw new RangeError('amount must be a finite number');
  const fr = rates[fromCurrency];
  const tr = rates[toCurrency];
  if (!fr || !tr) throw new RangeError('unsupported currency pair: ' + fromCurrency + ' -> ' + toCurrency);
  const eur = amount * fr;
  const out = eur / tr;
  return roundToCurrency(out, toCurrency);
}

function invertRates(rates = DEFAULT_RATES) {
  const out = {};
  const keys = Object.keys(rates);
  for (const a of keys) for (const b of keys) {
    if (a === b) continue;
    out[a + b] = convertAmount(1, a, b, rates);
  }
  return out;
}

// ---------- Region routing ----------

function regionResolver(countryCode, regions = REGIONS) {
  const cc = String(countryCode || '').toUpperCase();
  const r = regions[cc];
  if (!r) throw new RangeError('unknown region code: ' + countryCode);
  return { code: cc, ...r };
}

function regionRestricted(region) {
  return Boolean(region && region.xmrOk === false);
}

// ---------- Cross-border quote ----------

function computeTax(amountDisplay, region) {
  if (!region || !region.tax) return null;
  const t = region.tax;
  return { kind: t.kind, rate: t.rate, amount: roundToCurrency(amountDisplay * t.rate, region.currency) };
}

function crossBorderQuote({ amount, fromCurrency, toCurrency, rates = DEFAULT_RATES,
                            regionCode, feeConfig = {} }) {
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError('amount must be >= 0');
  const region = regionCode ? regionResolver(regionCode) : null;
  const displayCurrency = region ? region.currency : (toCurrency || fromCurrency);
  const amountInDisplay = convertAmount(amount, fromCurrency, displayCurrency, rates);
  const base = Number(feeConfig.base) || 0.0001;
  const perOutput = Number(feeConfig.perOutput) || 0.00002;
  const outputs = Math.max(1, Number(feeConfig.outputs) || 1);
  const feeXmr = roundToCurrency(base + perOutput * outputs, 'XMR');
  const amountXmr = convertAmount(amount, fromCurrency, 'XMR', rates);
  const tax = computeTax(amountInDisplay, region);
  return {
    amountIn: { value: roundToCurrency(amount, fromCurrency), currency: fromCurrency },
    amountDisplay: { value: amountInDisplay, currency: displayCurrency },
    amountXmr: { value: amountXmr, currency: 'XMR' },
    region: region ? { code: region.code, currency: region.currency } : null,
    tax: tax ? { kind: tax.kind, rate: tax.rate, amount: tax.amount, currency: displayCurrency } : null,
    networkFee: { value: feeXmr, currency: 'XMR' },
    totalXmr: { value: roundToCurrency(amountXmr + feeXmr, 'XMR'), currency: 'XMR' },
  };
}

// ---------- Payment flow state machine ----------

const FLOW_STATES = ['IDLE', 'INITIATE', 'BROADCAST_INTENT', 'CONFIRM', 'SETTLED'];

function paymentFlowMachine() {
  const state = { phase: 'IDLE', steps: 0, lastTransitionAt: 0 };
  function transition(to) {
    const fromIndex = FLOW_STATES.indexOf(state.phase);
    const toIndex = FLOW_STATES.indexOf(to);
    if (toIndex < 0) throw new RangeError('unknown state: ' + to);
    if (toIndex !== fromIndex + 1) throw new RangeError('illegal transition: ' + state.phase + ' -> ' + to);
    state.phase = to;
    state.steps += 1;
    state.lastTransitionAt = state.steps;
    return { ...state };
  }
  return {
    state: () => ({ ...state }),
    initiate: () => transition('INITIATE'),
    broadcastIntent: () => transition('BROADCAST_INTENT'),
    confirm: () => transition('CONFIRM'),
    settle: () => transition('SETTLED'),
    isTerminal: () => state.phase === 'SETTLED',
    reset: () => { state.phase = 'IDLE'; state.steps = 0; state.lastTransitionAt = 0; },
  };
}

// ---------- Mock transaction ledger (the "test payments between regions" task) ----------

// Hash-chained append-only ledger for simulating cross-border payments between
// regions. Pure SHA-256 over prior hash + canonical record. Records NO real Monero
// txid, touches NO real chain — only a deterministic fixture for the issue's test
// requirement.
const crypto = require('crypto');

function canonicalRecord(entry) {
  return [
    entry.id, entry.fromRegion, entry.toRegion, entry.amount.toFixed(12),
    entry.currency, entry.memo || '', entry.createdAt.toFixed(0),
  ].join('|');
}

function mockTransactionLedger() {
  const records = [];
  let head = '0'.repeat(64);

  function append(entry) {
    if (!(entry.amount > 0)) throw new RangeError('amount must be > 0');
    if (!REGIONS[entry.fromRegion] || !REGIONS[entry.toRegion]) throw new RangeError('invalid region pair');
    if (entry.fromRegion === entry.toRegion) throw new RangeError('cross-border only: from !== to required');
    const rec = { id: 'MOCK-' + String(records.length + 1).padStart(4, '0'), ...entry };
    const hashable = head + '|' + canonicalRecord(rec);
    const hash = crypto.createHash('sha256').update(hashable, 'utf8').digest('hex');
    records.push({ ...rec, prevHash: head, hash });
    head = hash;
    return { ...records[records.length - 1] };
  }

  function verify() {
    let prev = '0'.repeat(64);
    for (const r of records) {
      if (r.prevHash !== prev) return false;
      const hashable = prev + '|' + canonicalRecord(r);
      const expect = crypto.createHash('sha256').update(hashable, 'utf8').digest('hex');
      if (expect !== r.hash) return false;
      prev = r.hash;
    }
    return true;
  }

  return {
    append,
    all: () => records.map(r => ({ ...r })),
    size: () => records.length,
    head: () => head,
    verify,
    reset: () => { records.length = 0; head = '0'.repeat(64); },
  };
}

// ---------- xmrPaymentURI (documentation-only data structures) ----------

// Serialises a payment record into a BIP21-style monero: URI. NO signing, NO chain
// commit — purely the fields a receiving wallet would name in a QR code / URI.
function xmrPaymentURI({ address, amountXmr, label, messageId, paymentId }) {
  if (typeof address !== 'string' || !(address.startsWith('4') || address.startsWith('8'))) {
    throw new TypeError('address must be a Monero mainnet (4) or subaddress (8) string');
  }
  const m = amountXmr.toFixed(12);
  const params = ['tx_amount=' + m];
  if (label) params.push('recipient_name=' + encodeURIComponent(label));
  if (paymentId) params.push('tx_payment_id=' + encodeURIComponent(paymentId));
  if (messageId) params.push('message=' + encodeURIComponent(messageId));
  return 'monero:' + address + (params.length ? '?' + params.join('&') : '');
}

module.exports = {
  DEFAULT_RATES, SUBUNIT,
  bankerRound, roundToCurrency,
  convertAmount, invertRates,
  regionResolver, regionRestricted, computeTax, crossBorderQuote,
  FLOW_STATES, paymentFlowMachine,
  mockTransactionLedger,
  xmrPaymentURI,
};
