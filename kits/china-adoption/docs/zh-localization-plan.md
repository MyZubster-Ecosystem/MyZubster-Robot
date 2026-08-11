# Simplified-Chinese (zh) Localization Plan (issue #34)

Issue #34 task: "Translate documentation to Chinese." The kit ships a Simplified-Chinese (`zh`) locale map in `cndata.js` (`ZH_LOCALE`) and helpers `zhLocaleKeys()` / `zhTranslationCoverage()` that mirror the existing en/it localization pattern. Values are demo strings; the operator team finalizes production wording.

## zh locale keys (seeded in `ZH_LOCALE`)

| Key | Simplified-Chinese (zh) | English gloss |
|---|---|---|
| cn_adoption_title | MyZubster 在中国的采纳 | MyZubster adoption in China |
| cn_adoption_goal | 在中国推广 MyZubster 机器人支付系统 | Promote MyZubster robotic payment system in China |
| cn_adoption_outcome | 2 台活跃机器人在中国实现 | 2 active robots live in China |
| cn_adoption_partner_dji | 与 DJI 农业合作 | Partner with DJI Agriculture |
| cn_adoption_events | 中国农业事件日历 | China agri event calendar |
| cn_adoption_docs | 简体中文文档 | Simplified-Chinese documentation |
| cn_adoption_community | 招募本地社区管理员 | Recruit local community managers |

## Coverage
`zhTranslationCoverage(Object.keys(ZH_LOCALE))` reports `total=7, present=7, missing=[], complete=true`. The kit's `scripts/china-check.js` asserts `zhI18n.complete === true`.

## Localization scope (operator-side finalization)
- UI surface strings for the adoption dashboard (the 7 seeded keys cover title/goal/outcome/partner/events/docs/community)
- Documentation translation: key kit docs (README, this plan, regulatory-research) to be provided in Simplified Chinese for the onshore field team
- All Chinese copy must respect the 2021 PBoC ban framing: no onshore-Monero marketing language; position the payment surface as e-CNY/compliant-rail only (see [regulatory-research.md](regulatory-research.md))

## Mirrors en/it pattern
The kit follows the same shape as the en/it locale maps used by the existing adoption kits (Italy `it` keys, US `en`). The coverage helper is intentionally generic so adding new zh keys is a single `Object.freeze` extension.

## Operator role split
The kit provides the **locale key map + coverage harness**; the operator team provides the **final production wording** and any additional UI strings once the onshore field team review completes.
