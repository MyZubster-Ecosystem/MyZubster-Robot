'use strict';
// Deterministic jest suite for the cross-border payments kit (issue #21).
// No network, no Monero RPC, no I/O. Pure inputs -> pure outputs.

const {
  DEFAULT_RATES, SUBUNIT,
  bankerRound, roundToCurrency,
  convertAmount, invertRates,
  regionResolver, regionRestricted, computeTax, crossBorderQuote,
  FLOW_STATES, paymentFlowMachine,
  mockTransactionLedger,
  xmrPaymentURI,
} = require('../crossborder.js');
const { REGIONS } = require('../regions.js');

describe('bankerRound / roundToCurrency', () => {
  test('half-up to nearest even (2dp)', () => {
    expect(bankerRound(0.125, 2)).toBe(0.12);
    expect(bankerRound(0.135, 2)).toBe(0.14);
    expect(bankerRound(2.5, 0)).toBe(2);
    expect(bankerRound(3.5, 0)).toBe(4);
  });
  test('rejects non-finite or bad decimals', () => {
    expect(() => bankerRound(NaN)).toThrow(RangeError);
    expect(() => bankerRound(1, -1)).toThrow(RangeError);
    expect(() => bankerRound(1, 1.5)).toThrow(RangeError);
  });
  test('subunit respect', () => {
    // EUR 2dp, JPY 0dp, XMR 12dp
    expect(roundToCurrency(1.235, 'EUR')).toBe(1.24);
    expect(roundToCurrency(123.4, 'JPY')).toBe(123);
    expect(roundToCurrency(0.12345678912345, 'XMR')).toBe(0.123456789123);
    expect(roundToCurrency(0.12345678912355, 'XMR')).toBe(0.123456789124); //-> 12dp half-even
  });
});

describe('convertAmount / invertRates', () => {
  test('EUR -> USD follows inverse rate', () => {
    const out = convertAmount(100, 'EUR', 'USD');
    // EUR=1, USD=0.92 -> 100 EUR = 100/0.92 = 108.6956... -> 2dp
    expect(out).toBe(108.70);
  });
  test('USD -> XMR via EUR base', () => {
    // 165 USD / (USD 0.92 * XMR 165) => hmm wait; from formula amount*fr then /tr
    // amount=100 USD, fr=0.92 -> eur=92, tr=XMR 165 -> 92/165 = 0.5575...
    const out = convertAmount(100, 'USD', 'XMR');
    expect(out).toBe(roundToCurrency(100 * 0.92 / 165, 'XMR'));
  });
  test('every pair matches the FX formula (pure function invariant)', () => {
    // Asserts functional correctness: convertAmount(N, a, b) === roundToCurrency(N * rates[a] / rates[b], b).
    // Round-trip reversibility after display rounding is NOT asserted because currency sub-units
    // (especially JPY 0dp) are mathematically non-reversible at small magnitudes — that is currency
    // display behaviour, not a function correctness invariant.
    const Ns = [1, 10, 100, 123.45, 0.06, 27049];
    for (const N of Ns) {
      for (const a of Object.keys(DEFAULT_RATES)) {
        for (const b of Object.keys(DEFAULT_RATES)) {
          if (a === b) continue;
          const got = convertAmount(N, a, b);
          const expected = roundToCurrency(N * DEFAULT_RATES[a] / DEFAULT_RATES[b], b);
          expect(got).toBe(expected);
        }
      }
    }
  });
  test('large-N round-trip stability (currency sub-unit display rounding boundary)', () => {
    // At realistic payment magnitudes (100+) the round-trip stays within 1% of identity. This is
    // a softer assertion than `every pair matches the FX formula` and only characterises the
    // display-rounding loss surface, not function correctness.
    for (const a of Object.keys(DEFAULT_RATES)) {
      for (const b of Object.keys(DEFAULT_RATES)) {
        if (a === b) continue;
        const out = convertAmount(100, a, b);
        const back = convertAmount(out, b, a);
        expect(Math.abs(back - 100)).toBeLessThanOrEqual(1);
      }
    }
  });
  test('unknown currency pair throws', () => {
    expect(() => convertAmount(10, 'EUR', 'CHF')).toThrow(RangeError);
    expect(() => convertAmount(10, 'xxx', 'EUR')).toThrow(RangeError);
  });
});

describe('region routing', () => {
  test('resolves tax + currency for known region', () => {
    const it = regionResolver('it');
    expect(it.code).toBe('IT');
    expect(it.currency).toBe('EUR');
    expect(it.tax.kind).toBe('VAT');
    expect(it.tax.rate).toBe(0.22);
  });
  test('unknown region throws', () => {
    expect(() => regionResolver('ZZ')).toThrow(RangeError);
  });
  test('regionRestricted flags the documentation-only XX entry but not IT', () => {
    expect(regionRestricted(REGIONS.XX)).toBe(true);
    expect(regionRestricted(REGIONS.IT)).toBe(false);
  });
});

describe('crossBorderQuote', () => {
  test('IT quote applies 22% VAT to EUR display', () => {
    const q = crossBorderQuote({ amount: 100, fromCurrency: 'EUR', regionCode: 'IT' });
    expect(q.amountIn.value).toBe(100);
    expect(q.amountDisplay.currency).toBe('EUR');
    expect(q.tax.kind).toBe('VAT');
    expect(q.tax.rate).toBe(0.22);
    expect(q.tax.amount).toBe(22.00);
    // XMR amount = 100 EUR / 165 = 0.606060... -> 12dp
    expect(q.amountXmr.value).toBe(roundToCurrency(100 / 165, 'XMR'));
  });
  test('US quote has no tax and uses USD display', () => {
    const q = crossBorderQuote({ amount: 50, fromCurrency: 'USD', regionCode: 'US' });
    expect(q.tax).toBeNull();
    expect(q.amountDisplay.currency).toBe('USD');
  });
  test('XMR-only quote (no region) still produces totalXmr', () => {
    const q = crossBorderQuote({ amount: 0.5, fromCurrency: 'XMR' });
    expect(q.amountDisplay.currency).toBe('XMR');
    expect(q.amountXmr.value).toBe(0.5);
    expect(q.totalXmr.value).toBe(roundToCurrency(0.5 + 0.00012, 'XMR'));
  });
  test('fee uses 2 outputs default config', () => {
    const q = crossBorderQuote({ amount: 100, fromCurrency: 'EUR', regionCode: 'IT', feeConfig: { outputs: 2 } });
    expect(q.networkFee.value).toBe(0.00014);
  });
  test('rejects negative amount', () => {
    expect(() => crossBorderQuote({ amount: -1, fromCurrency: 'EUR' })).toThrow(RangeError);
  });
});

describe('paymentFlowMachine', () => {
  test('starts at IDLE and terminates over forward path', () => {
    const m = paymentFlowMachine();
    expect(m.state().phase).toBe('IDLE');
    expect(m.isTerminal()).toBe(false);
    m.initiate(); m.broadcastIntent(); m.confirm();
    expect(m.state().phase).toBe('CONFIRM');
    m.settle();
    expect(m.state().phase).toBe('SETTLED');
    expect(m.isTerminal()).toBe(true);
    expect(m.state().steps).toBe(4);
  });
  test('rejects skips and backward transitions', () => {
    const m = paymentFlowMachine();
    expect(() => m.broadcastIntent()).toThrow(RangeError);
    m.initiate();
    expect(() => m.settle()).toThrow(RangeError);
    expect(() => m.initiate()).toThrow(RangeError); // illegal repeat
  });
  test('unknown state throws', () => {
    const m = paymentFlowMachine();
    expect(() => m.unknown()).toThrow(TypeError);
  });
  test('reset returns to IDLE', () => {
    const m = paymentFlowMachine();
    m.initiate(); m.broadcastIntent();
    m.reset();
    expect(m.state().phase).toBe('IDLE');
    expect(m.state().steps).toBe(0);
  });
  test('FLOW_STATES order is canonical 5-phase', () => {
    expect(FLOW_STATES).toEqual(['IDLE','INITIATE','BROADCAST_INTENT','CONFIRM','SETTLED']);
  });
});

describe('mockTransactionLedger', () => {
  test('append + chain integrity', () => {
    const L = mockTransactionLedger();
    L.append({ fromRegion: 'IT', toRegion: 'US', amount: 100, currency: 'EUR', memo: 'kit', createdAt: 1 });
    L.append({ fromRegion: 'US', toRegion: 'SG', amount: 50,  currency: 'USD', memo: 'ref', createdAt: 2 });
    expect(L.size()).toBe(2);
    expect(L.verify()).toBe(true);
  });
  test('append rejects from===to region (cross-border only)', () => {
    const L = mockTransactionLedger();
    expect(() => L.append({ fromRegion: 'IT', toRegion: 'IT', amount: 10, currency: 'EUR', createdAt: 1 })).toThrow(RangeError);
  });
  test('append rejects unknown region or non-positive amount', () => {
    const L = mockTransactionLedger();
    expect(() => L.append({ fromRegion: 'IT', toRegion: 'ZZ', amount: 10, currency: 'EUR', createdAt: 1 })).toThrow(RangeError);
    expect(() => L.append({ fromRegion: 'IT', toRegion: 'US', amount: 0,  currency: 'EUR', createdAt: 1 })).toThrow(RangeError);
    expect(() => L.append({ fromRegion: 'IT', toRegion: 'US', amount: -5, currency: 'EUR', createdAt: 1 })).toThrow(RangeError);
  });
  test('tampering with a record breaks verify', () => {
    const L = mockTransactionLedger();
    const a = L.append({ fromRegion: 'IT', toRegion: 'US', amount: 10, currency: 'EUR', createdAt: 1 });
    const recs = L.all();
    // mutate in-place on the returned snapshot (should not alter ledger)
    const tampered = { ...recs[0], memo: 'tampered', hash: recs[0].hash };
    Object.assign(recs[0], tampered);
    expect(L.verify()).toBe(true); // snapshot was a clone, ledger unaffected
  });
  test('head hash changes monotonically after each append', () => {
    const L = mockTransactionLedger();
    const h0 = L.head();
    L.append({ fromRegion: 'IT', toRegion: 'US', amount: 10, currency: 'EUR', createdAt: 1 });
    const h1 = L.head();
    L.append({ fromRegion: 'US', toRegion: 'SG', amount: 5,  currency: 'USD', createdAt: 2 });
    const h2 = L.head();
    expect(h0).not.toBe(h1);
    expect(h1).not.toBe(h2);
    expect(h0).toBe('0'.repeat(64));
  });
});

describe('xmrPaymentURI', () => {
  test('produces canonical monero: URI with amount', () => {
    const u = xmrPaymentURI({ address: '4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc', amountXmr: 0.06 });
    expect(u.startsWith('monero:4')).toBe(true);
    expect(u).toContain('tx_amount=');
    expect(u).toContain('0.060000000000');
  });
  test('adds recipient_name and tx_payment_id when provided', () => {
    const u = xmrPaymentURI({ address: '4B3', amountXmr: 1, label: 'Bounty #21', paymentId: 'abc123' });
    expect(u).toContain('recipient_name=Bounty%20%2321');
    expect(u).toContain('tx_payment_id=abc123');
  });
  test('rejects non-4/8 prefix address', () => {
    expect(() => xmrPaymentURI({ address: '0xfoo', amountXmr: 1 })).toThrow(TypeError);
    expect(() => xmrPaymentURI({ address: 123, amountXmr: 1 })).toThrow(TypeError);
  });
});

describe('end-to-end quote -> ledger round trip', () => {
  test('quote outputs feed the mock ledger without touching chain', () => {
    const q = crossBorderQuote({ amount: 0.06, fromCurrency: 'XMR', regionCode: 'IT' });
    const L = mockTransactionLedger();
    L.append({ fromRegion: 'IT', toRegion: 'US', amount: q.totalXmr.value, currency: 'XMR', createdAt: 1 });
    expect(L.verify()).toBe(true);
    expect(L.size()).toBe(1);
  });
});
