# Cross-border Payment Flow (Monero)

This guide documents the cross-border Monero payment flow for the MyZubster modular robot family. It is a surface document only — it names the actors and the 5-phase state machine implemented in `firmware/lib/crossborder/crossborder.js`. It does **not** describe any custodial holding, hot wallet, or mainnet broadcast — see `safe-harbor-note.md`.

## Actors

- **Sender** — an international user (referenced by `regionCode`, e.g. `SG`) who wants to pay for goods/services priced in a foreign currency.
- **Receiver** — the MyZubster operator or a sub-affiliate (merchant), identified by a Monero mainnet (4...) or subaddress (8...) address.
- **Quote compositor** — `crossBorderQuote({...})`; converts the seller-requested amount into the buyer's local display currency and into XMR for the on-chain payload (display only — no live conversions are signed by this kit).
- **Relay** — a non-custodial relay that forwards the BIP21-style `monero:` URI the buyer receives to the wallet they own (out of scope for this kit; only documented as a hook).

## 5-phase state machine

| Phase | Trigger | Surface action |
|---|---|---|
| `IDLE` | (initial) | Show quote to the user. |
| `INITIATE` | User taps "Pay with Monero". | Freeze the quote; show a QR/memo with `xmrPaymentURI`. |
| `BROADCAST_INTENT` | User scans the QR and confirms in their own wallet (off-kit). | Show "Awaiting sender confirmation". |
| `CONFIRM` | Local relay receives a mempool tx (off-kit). | Show "Incoming settlement pending". |
| `SETTLED` | Local relay receives confirmations >= N (configurable, off-kit). | Show "Paid". |

The kit implements the transitions `IDLE→INITIATE`, `INITIATE→BROADCAST_INTENT`, `BROADCAST_INTENT→CONFIRM`, `CONFIRM→SETTLED`. Reverse and skip transitions throw `RangeError`, which the UI surfaces as "Cannot rewind a payment".

## Why 5 phases, not 3?

The classic 3-phase (init→broadcast→settle) conflates user confirmation with broadcast intent; in cross-border flows the buyer may sit in `BROADCAST_INTENT` for hours before the chain moves. Splitting `BROADCAST_INTENT` and `CONFIRM` lets the UI show accurate stage states without polling chain for unconfirmed mempool entries.

## Network fee disclosure

The kit's `networkFee` field is a fixture (`base=0.0001 XMR`, `perOutput=0.00002 XMR`). Real Monero per-tx fees vary with mempool density and ring-size; the operator **must** override `feeConfig` at runtime with a live estimate from their own wallet RPC. The fixture is for UI plumbing demos only.

## Where the kit ends and the operator begins

| Concern | Kit | Operator |
|---|---|---|
| Quote display | yes | — |
| Tax classification | static table | live rate overrides |
| Sanctions screening | static `xmrOk:false` flag | live sanctions list |
| Wallet signing / broadcast | never | yes (off-kit) |
| Confirmations / chain polling | never | yes (off-kit) |
| Settlement notification | never | yes (off-kit) |

If a region is flagged `regionRestricted(region)=true`, the UI must NOT present a `monero:` URI. The fallback path is local-currency rails (e.g. PayPal, SEPA), and the documented fallback surface is in `international-user-guides.md`.
