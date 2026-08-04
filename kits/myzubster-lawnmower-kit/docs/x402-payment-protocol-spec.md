# x402 Payment Protocol Spec - Modular Lawnmower Kit

Issue #70 task: Integrazione con MyZubster x402. The x402 protocol is the
HTTP 402 "Payment Required" machine-payable flow used by MyZubster. This
document is the protocol spec only; the firmware invokes a stub `x402PaymentSpec`
helper that returns a documentation object - no real wallet signing, Monero
transfer, key material, or network call is performed by this kit. Real wallet
operations remain owned by the MyZubster gateway code outside this kit.

## Why the kit references x402 (docs only)

The modular lawnmower can be paid per-mow via the x402 flow once the
MyZubster gateway is attached. So the firmware knowledge of the x402 flow
is part of the kit, but the actual signing/broadcast infrastructure is not.

## States

| # | State | Meaning |
|---|---|---|
| 0 | idle | waiting for a quote request |
| 1 | quote_requested | the unit asked the gateway for a mowing quote |
| 2 | quoted | the gateway returned the invoice_id + amount |
| 3 | paying | the client side initiated the Monero payment (gateway owned) |
| 4 | paid | the gateway confirmed payment on chain (gateway owned) |
| 5 | released | the mower may depart / has been called for service |
| 6 | refunded | gateway timeout / failure; the mower returns to idle |

## Transitions

| from | event | to |
|---|---|---|
| idle | request_quote | quote_requested |
| quote_requested | gateway_returns_quote | quoted |
| quoted | client_initiates_payment | paying |
| paying | gateway_confirms_payment | paid |
| paid | work_completed | released |
| paying | gateway_timeout | refunded |

## Data fields (informational placeholders)

- `invoice_id` - gateway-assigned quote identifier.
- `amount_xmr` - decimal Monero amount the gateway asks for. Informational only.
- `amount_eur` - decimal Euro equivalent, used downstream by the gateway.
- `payment_address` - the Monero subaddress the client pays to; informational only.
- `txid` - gateway-populated once on chain (gateway owned, never trusted blindly).
- `expires_at` - ISO 8601 timestamp after which the quote expires.

## Safe harbor

This spec is documentation-only. The MSP-side firmware maps to these field
labels for convenience, but never holds, generates, or signs Monero keys.
The x402PaymentSpec helper returns the spec object; no real signing happens.
