# cross-border-payments (Bounty #21)

Cross-border `payments with Monero` kit for the MyZubster modular robot family. Resolves [MyZubster-Ecosystem/MyZubster-Robot #21](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/21) ("`[Global] Cross-border payments with Monero`", 0.06 XMR).

Everything in this package is documentation + pure-JS simulation + deterministic jest tests. **No real Monero wallet signing, no mainnet broadcast, no custody, no contract deployment.** See [`docs/safe-harbor-note.md`](docs/safe-harbor-note.md) for the operator's §2 boundary.

Same safe-harbor documentation pattern used by the prior merged kits under `kits/`:

- `kits/myzubster-lawnmower-kit/` (PR #115, issue #70) — modular lawnmower < 200 EUR
- `kits/myzubster-eco-kit/` (PR #99, issue #71) — ESP32 eco-mode energy saving
- `kits/myzubster-garden-kit/` (PR #107, issue #76) — garden automation scheduling

## What the kit ships

- **`firmware/lib/crossborder/crossborder.js`** — pure helpers: `bankerRound` (half-even rounding), `roundToCurrency` (currency sub-unit aware), `convertAmount` (pure FX), `invertRates` (rate table inversion), `regionResolver` (jurisdiction routing), `regionRestricted` (sanctions / no-XMR fallback flag), `crossBorderQuote` (display + tax + network fee + totalXmr compositor), `paymentFlowMachine` (5-phase state machine IDLE→INITIATE→BROADCAST_INTENT→CONFIRM→SETTLED), `mockTransactionLedger` (hash-chained append-only fixture), `xmrPaymentURI` (BIP21-style `monero:` URI builder).
- **`firmware/lib/crossborder/regions.js`** — frozen region table + FX fixture (IT/US/SG/JP/GB/DE).
- **`firmware/lib/crossborder/__tests__/crossborder.test.js`** — deterministic jest suite (rounding, conversion, region, quote, flow, ledger, URI, end-to-end).
- **`scripts/crossborder-check.js`** — `npm run crossborder:check` CLI headless simulation.
- **`docs/`** — payment-flow guide, international user guides, multi-currency UI notes, xmr protocol spec, safe-harbor note.

## Acceptance-criteria mapping (issue #21)

| Issue task | Kit deliverable |
|---|---|
| Document cross-border payment flow | `docs/payment-flow-guide.md` + `docs/xmr-protocol-spec.md` |
| Create guides for international users | `docs/international-user-guides.md` |
| Test payments between different regions | `mockTransactionLedger()` + jest ledger suite + `crossborder-check.js` sweep |
| Add multi-currency support | `convertAmount()` + `invertRates()` + `docs/multi-currency-ui-notes.md` |

## Quickstart

```sh
cd kits/cross-border-payments
npm install
npm test              # jest, deterministic
npm run crossborder:check   # CLI headless simulation
```

## §2 boundary contract

This kit intentionally ships no live RPC client, no wallet-keystore integration, and
no real network calls inside its helpers. The region `xmrOk:false` sample is a UI
fallback hook, not a compliance opinion. Operators are responsible for any live FX,
sanctions, or chain access — the kit limits itself to surface documents and mock
simulation. See `docs/safe-harbor-note.md` for the full operator's contract.

## Bounty

Issue #21, 0.06 XMR, paid at PR merge per the MyZubster conventions.
Payout address (one-shot, recorded in the original claim comment):
`4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc`
