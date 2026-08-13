# XMR Payment Protocol (documentation-only spec)

The cross-border kit surfaces a BIP21-style `monero:` URI as a serialisable record; it does not sign or commit a transaction. This document specifies the wire format of the record and the consumer's contract for receiving it.

## URI format

```
monero:<address>?[param=value&]*
```

- `<address>` — Monero mainnet address starting with `4` (primary) or `8` (subaddress).
- `<param=value>` — URL-encoded key=value pairs.

### Parameters carried

| param | required | type | notes |
|---|---|---|---|
| `tx_amount` | yes | decimal string, 12 dp | amount in XMR |
| `recipient_name` | optional | string | display label for the receiving wallet UI |
| `tx_payment_id` | optional | hex string | set when payment correlation is required (e.g. for split settlements) |
| `message` | optional | string | human-readable message shown by wallets |

## Compositor signature

`xmrPaymentURI({ address, amountXmr, label?, messageId?, paymentId? }) -> 'monero:...'`

### Validation

- `address` must be a string starting with `4` or `8`. Any other prefix throws `TypeError`.
- `amountXmr` is serialized as `toFixed(12)`. Negative or non-finite inputs up-front are not part of this kit's input contract — quote construction guarantees finiteness.

## Consumer contract

Sovereign end-user wallets (Cake Wallet, Monerujo, official monero-wallet-gui/cli) accept the URI as a payment request. The kit signs nothing. Wallet software custody-rows the spend privately. The kit's `BROADCAST_INTENT` phase is entered when the user confirms in their wallet — the local host opens `INTERACTIVE_AWAIT_CONFIRM` and waits for the operator's off-kit relay to surface a settlement event.

## State machine coverage

The 5-phase machine implemented in `paymentFlowMachine()` matches this spec:

```
IDLE         [quote shown]
  |
INITIATE     [monero: URI shown to user]
  |
BROADCAST_INTENT  [user scanned in own wallet; awaiting wallet confirmation]
  |
CONFIRM      [mempool tx surfaced by relay]
  |
SETTLED      [confirmations >= N]
```

## Non-goals of this spec

- The spec does **not** mandate a particular Sub-address algorithm (one-time addresses via view-key derivation). Use the wallet's standard subaddress derivation.
- The spec does **not** recommend a confirmation threshold; `N` is the operator's choice based on transaction value and risk tolerance.
- The spec does **not** provide escrow or arbitrator semantics — those live outside this kit.

## Future hooks (documented, NOT in this kit)

- `tx_priority` (optional, post-merge) — covers the wallet's fee selection (`unimportant`/`normal`/`elevated`/`priority`).
- `tx_unlock_time` (optional, post-merge) — Monero unlock-time in block height, not human time.

These are documented for forward-compatibility only; the kit does not serialise them in v0.1.0.
