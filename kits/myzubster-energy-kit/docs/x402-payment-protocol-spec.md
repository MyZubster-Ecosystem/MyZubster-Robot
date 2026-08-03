# x402 Payment Protocol Specification (Documentation Only)

Bounty #85 -- x402 payment flow specification for the MyZubster charging system.

## Scope

This document specifies the x402 payment protocol as a DATA STRUCTURE and STATE DIAGRAM only. The toolkit itself performs NO real wallet signing, no Monero transfer, no key generation, and no network calls. The actual payment is handled by the x402 protocol's own infrastructure, not this kit.

## State machine

```
idle -> request_quote -> receive_quote -> authorize_payment -> payment_confirmed -> charging_authorized -> idle
```

| Transition | Trigger | Description |
|---|---|---|
| idle -> request_quote | dock_connected | Robot connects to the charging station |
| request_quote -> receive_quote | quote_received | Station returns a payment quote |
| receive_quote -> authorize_payment | user_consents | User (or robot policy) consents to pay |
| authorize_payment -> payment_confirmed | payment_verified | x402 infrastructure confirms payment |
| payment_confirmed -> charging_authorized | charging_starts | Charging is authorized to begin |
| charging_authorized -> idle | charging_complete | Charging finishes, cycle resets |

## Data fields

| Field | Type | Description |
|---|---|---|
| amount_xmr | number | Monero amount to pay (placeholder=0 in this kit) |
| recipient_address | string | XMR receiving address (provisioned by user, not generated here) |
| session_id | string | Unique session identifier |
| timestamp | number | Unix timestamp of the quote |

## Important

- This kit does NOT generate, store, or transmit any cryptographic key material.
- No real Monero transaction is created, signed, or broadcast.
- The `amount_xmr` default is 0 (placeholder). The real amount is negotiated by the x402 infrastructure at runtime.
- This is the same safe-harbor documentation pattern as the #81 autoconfig kit's wallet descriptor (address placeholder only, no keypair).
