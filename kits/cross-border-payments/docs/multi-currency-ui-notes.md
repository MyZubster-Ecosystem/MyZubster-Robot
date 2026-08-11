# Multi-currency UI Notes

Surface design notes for the MyZubster interface to render cross-border quotes in more than one currency. These are UI contracts — no live conversion logic lives in this doc; the kit's job is to surface the canonical quote.

## Selector behaviour

- A user's **home currency** is inferred from their `regionCode` (`IT` → EUR, `SG` → SGD, ...).
- The user may switch display currencies explicitly. The list shown in the picker is the value set of `invertRates(DEFAULT_RATES)`.
- When a region is `regionRestricted`, the picker **hides** the `monero:` URI option and offers local-currency rails only (PayPal, SEPA, etc.) via separate integrations outside this kit.

## Display rounding

- Always round display amounts via `roundToCurrency(amount, currency)`, which respects sub-unit rules.
- EUR/USD/SGD/GBP use 2 dp; JPY uses 0 dp; XMR uses 12 dp.
- For totals rendered across mixed currencies (e.g. EUR VAT + XMR payload), render each side in its own currency and present as a paired cell, never as a single sum.

## Quote card (recommended layout)

```
┌─────────────────────────────────────────────────────┐
│ You (US, USD)        ⇒  Recip (IT, EUR)              │
│                                                      │
│ Amount             50.00 USD                         │
│ In EUR             45.87 EUR                         │
│ VAT (22%)          +10.09 EUR                       │
│ ─────────────────────────────────────                 │
│ On-chain   0.303030303030 XMR                        │
│ Network fee    0.000120000000 XMR                   │
│ Total       0.303150303030 XMR                       │
│                                                      │
│ [Pay with Monero] [Pay via SEPA]                    │
└─────────────────────────────────────────────────────┘
```

## Edge cases

- **`regionRestricted=true`**: only the `[Pay via local rail]` button is shown; the Monero column header is replaced with a tooltip: "Monero is not currently offered in your jurisdiction."
- **Sub-unit absentee (JPY)**: amounts rendered without decimals; totals in JPY remain integers.
- **Inverted pair sanity**: when the user is in JPY and the seller is in USD, the display order is JPY (primary) + USD (secondary) + XMR payload — always buyer-first.
- **Rounding in totals**: totalXmr is rounded via `roundToCurrency(_, 'XMR')`, never concatenated from the per-component figures.

## i18n strings needed

- `pay_with_monero` — "Pay with Monero"
- `pay_via_sepa`  — "Pay via SEPA"
- `monero_not_offered` — "Monero is not currently offered in your jurisdiction."
- `network_fee_label` — "Network fee"
- `vat_label_jurisdiction` — "VAT ({rate}%)", "GST ({rate}%)", "Consumption tax ({rate}%)"

Add localisation keys for en/it/es/fr as in the rest of i18n locales of MyZubster-App.
