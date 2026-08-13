# Safe-harbor Note (§2 boundary)

This kit implements the surface of issue #21 ("`[Global] Cross-border payments with Monero`"). It is intentionally scoped to documentation + pure-JS simulation + deterministic jest tests. It **does not** and **must not**:

- sign Monero transactions or build raw transactions,
- broadcast to the mainnet or any network that carries real value,
- read or write private spend/view keys,
- custody user funds, including staged payments or time-locked outputs,
- deploy contracts or perform token authorisations of any kind,
- read live FX / sanctions / tax rates from external services during tests (use the static `regions.js` table).

## What the kit is permitted to do

- pure FX computations over a static rate table,
- jurisdiction routing via a static region table,
- display rounding per currency sub-unit,
- a 5-phase state machine that only transitions phase labels,
- a hash-chained in-memory mock ledger seeded by user-supplied fixtures,
- build a BIP21-style `monero:` URI for display (similar to rendering a `mailto:` link — the kit renders, the user's own wallet decides what to do with it).

## Where the kit must defer to the operator

| Concern | Kit role | Operator's job |
|---|---|---|
| Live FX | static fixture | live price fetch from authoritative source |
| Sanctions screening | static `xmrOk:false` sample | current list maintenance |
| Wallet signing | never | yes (off-kit, in user-owned wallet) |
| Chain polling | never | yes (off-kit relay) |
| Tax compliance | static sample rates | jurisdictional determination at runtime |

## Why this matters for issue #21 collapse

The issue's "test payments between different regions" task could naively require real broadcasts. We resolve this as the **mock TransactionLedger** simulation — a hash-chained fixture that records region-pair movement locally without touching any chain. Every ledger record is a deterministic artefact for the kit's jest suite and CLI; the surrounding MyZubster operator is responsible for the off-kit settlement relays, never the kit itself.
