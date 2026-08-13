# International User Guides

Per-region end-user guides for accepting and paying with Monero through MyZubster. These guides are surface documentation for the kit and assume no live wallet signing, chain polling, or custody — see `safe-harbor-note.md`.

## Italy (`IT`, EUR)
- VAT (22%) is shown next to the displayed EUR amount on every quote.
- A `monero:` URI is offered directly. Buyer scans in their own wallet and confirms.
- Settlement is observable via the relay hook, not the kit.

## Germany (`DE`, EUR)
- VAT 19%. German VAT invoice must list line-item amounts in EUR and the XMR payload separately.
- Same Monero flow as IT, with region-aware tax caption.

## United States (`US`, USD)
- No national VAT; sales tax is operator-added at the merchant's state-rate.
- The kit does not model US sales tax; the operator supplies a custom region entry by overriding `regionResolver`'s `REGIONS` table.

## Singapore (`SG`, SGD)
- GST (9%) itemised once at the quote step, no further hidden surcharges.
- Cross-border inbound from IT/DE/GB is treated as imported services; GST rule attribution is an operator concern.

## Japan (`JP`, JPY)
- Consumption tax (10%) included in the displayed JPY figure (rounded to 0 decimals — `JPY` has no sub-unit).
- Buyer scans the QR; XMR payload is constant; only the display currency is localised.

## United Kingdom (`GB`, GBP)
- VAT (20%) itemised.
- Brexited jurisdictions; cross-border to/from the EU is treated as outside-EU's single market (the kit surfaces this via region code, not enforcement).

## Restricted-jurisdiction example (`XX`, USD)
- A theoretical region whose `xmrOk:false` flag triggers the UI fallback. The kit does NOT enforce this; the operator must keep the sanctions / no-XMR list current at runtime.
- Fallback: local-currency rail — see `multi-currency-ui-notes.md` for the selector behaviour.

## Cross-border flow student recap

| From | To | Display currency shown to buyer | XMR payload |
|---|---|---|---|
| IT | US | EUR | yes |
| US | SG | USD | yes |
| JP | DE | JPY | yes |
| GB | IT | GBP | yes |
| (any) | XX | USD | **no** — fallback rail |

The buyer always sees their own home region's currency; the seller sees their own; only the on-chain XMR payload crosses the border.
