# Italy Adoption Kit (issue #24)

Self-contained kit for establishing **MyZubster adoption in Italy** (home base). Pure docs + pure-JS planner + deterministic jest tests only. No wallet signing, no mainnet broadcast, no contract deployment. Safe-harbor documentation pattern, same approach as #29 USA (PR #128), #17 EU (PR #127), #22 hubs (PR #129), #70 (PR #115), #71 (PR #99), #76 (PR #107).

## What's inside

- **`firmware/lib/italyadoption/itdata.js`** -- frozen Italy regulatory table (Banca d'Italia, Consob, Garante per la protezione dei dati personali, MIPAAF), 5 Italian events (Fieragricola, EIMA, Agrilevante, Maker Faire Roma, Milan Blockchain Week), market sizing + regions, 4 partners, 5 Castrocaro beta testers, `it` locale keys.
- **`firmware/lib/italyadoption/italyadoption.js`** -- pure-JS planner: `regulatorReadinessScore` + `overallRegScore` + `complianceChecklist`, `eventTimeline` + `topEvents` + `eventReach`, `partnershipTracker` + `advancePartner` (identified->contacted->engaged->signed funnel + Coldiretti stage), `betaTesterPipeline` + `advanceTester` (5-step Castrocaro pipeline: applied->screened->field-trial->feedback->onboarded; active-robots counter), `itLocaleKeys` + `itTranslationCoverage`, `marketEntryPlan`, `buildItalyAdoptionPlan` (end-to-end plan builder).
- **`firmware/lib/italyadoption/__tests__/italyadoption.test.js`** -- deterministic jest tests across 13 describe blocks.
- **`scripts/italy-check.js`** -- `npm run it:check` CLI headless simulation.
- **`docs/`** -- `regulatory-research.md`, `coldiretti-partnership-plan.md`, `castrocaro-beta-plan.md`, `event-calendar.md`, `market-analysis.md`, `safe-harbor-note.md`.

## Acceptance criteria mapping (issue #24)

| Issue task | Coverage |
|---|---|
| Connect with local farmers (Castrocaro test) | `docs/castrocaro-beta-plan.md` + `betaTesterPipeline()` (5-step Castrocaro pipeline, 5 beta testers) |
| Partner with agricultural associations (Coldiretti) | `docs/coldiretti-partnership-plan.md` + `partnershipTracker()` (Coldiretti stage surfaced) |
| Translate documentation to Italian | `IT_LOCALE` it-locale keys + `itTranslationCoverage()` / `itLocaleKeys()` |
| Organize local meetups | `docs/event-calendar.md` + `eventTimeline()` / `topEvents()` |
| Find 5 beta testers | `betaTesterPipeline()` (`target=5`, `recruited=5`, `activeRobots` counter) |
| Expected outcome: 5 active robots in Italy | `betaTesterPipeline()` onboarded-stage counter -> `advanceTester(t,'onboarded')` activeRobots=5 |

## Quickstart

```bash
cd kits/italy-adoption
npm install && npm test
npm run it:check
```

## Scope / safety

Pure documentation + pure-JS planning + deterministic tests. No cryptocurrency generation, wallet signing, mainnet broadcast, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain logic. No network calls.

## AI-assisted development

Authored with AI assistance. Regulator scores, event fixtures, partner records, and beta-tester rosters are static research snapshots -- operators should refresh them with live data at runtime.
