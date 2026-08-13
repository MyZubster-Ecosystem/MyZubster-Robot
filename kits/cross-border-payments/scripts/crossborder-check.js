'use strict';
// crossborder-check.js — headless simulation for the cross-border payments kit (#21).
// Invoke via `npm run crossborder:check`. Purely local: no network, no Monero RPC,
// no custody. Surfaces the kit's deterministic acceptance surface in one CLI pass.

const {
  crossBorderQuote, paymentFlowMachine, mockTransactionLedger, xmrPaymentURI,
} = require('../firmware/lib/crossborder/crossborder.js');

function pass(name) { console.log('  \u2713 ' + name); }
function fail(name, err) { console.error('  \u2717 ' + name + (err ? ' :: ' + (err && err.message || err) : '')); process.exitCode = 1; }

function main() {
  console.log('cross-border payments kit :: crossborder-check');
  let fails = 0;

  // 1) Quote across all known regions
  try {
    const samples = [['IT','EUR',100],['US','USD',50],['SG','SGD',75],['JP','JPY',10000],['GB','GBP',40]];
    for (const [region, cur, amt] of samples) {
      const q = crossBorderQuote({ amount: amt, fromCurrency: cur, regionCode: region });
      if (q.amountDisplay.currency !== cur) throw new Error('display currency mismatch for '+region);
      if (q.totalXmr.value <= 0) throw new Error('non-positive total for '+region);
      pass('quote ' + region + ' ' + cur + amt);
    }
  } catch (e) { fail('quote sweep', e); fails++; }

  // 2) Payment flow state machine 5-phase forward
  try {
    const m = paymentFlowMachine();
    m.initiate(); m.broadcastIntent(); m.confirm(); m.settle();
    if (m.state().phase !== 'SETTLED') throw new Error('not SETTLED');
    if (!m.isTerminal()) throw new Error('isTerminal false');
    pass('payment flow machine 5-phase forward');
  } catch (e) { fail('flow machine', e); fails++; }

  // 3) Mock cross-region ledger round trip
  try {
    const L = mockTransactionLedger();
    L.append({ fromRegion: 'IT', toRegion: 'US', amount: 0.06, currency: 'XMR', memo: 'bounty prepay', createdAt: 1 });
    L.append({ fromRegion: 'US', toRegion: 'SG', amount: 0.03, currency: 'XMR', memo: 'settle ref', createdAt: 2 });
    L.append({ fromRegion: 'SG', toRegion: 'DE', amount: 0.02, currency: 'XMR', memo: 'referral', createdAt: 3 });
    if (!L.verify()) throw new Error('chain verify failed');
    if (L.size() !== 3) throw new Error('size not 3');
    pass('mock ledger 3-region round trip + verify');
  } catch (e) { fail('mock ledger', e); fails++; }

  // 4) xmrPaymentURI canonical round-trip on a sample address
  try {
    const u = xmrPaymentURI({ address: '4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc', amountXmr: 0.06, label: 'Bounty #21', paymentId: 'cbp-' + 0 });
    if (!u.startsWith('monero:4')) throw new Error('not monero URI');
    if (!u.includes('tx_amount=')) throw new Error('no tx_amount');
    pass('xmrPaymentURI canonical');
  } catch (e) { fail('xmrPaymentURI', e); fails++; }

  console.log('\ncross-border check ' + (fails === 0 ? 'OK' : 'FAILED') + ' :: ' + fails + ' step(s) failed');
  if (fails > 0) process.exit(1);
}

main();
