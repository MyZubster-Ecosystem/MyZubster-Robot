# China Adoption Kit (issue #34)

Self-contained kit for expanding **MyZubster adoption in China** under a restrictive regime. Pure docs + pure-JS planner + deterministic jest tests only. No wallet signing, no mainnet broadcast, no contract deployment. Safe-harbor documentation pattern, same approach as #24 Italy (PR #130), #29 USA (PR #128), #17 EU (PR #127), #22 hubs (PR #129), #70 (PR #115).

## What's inside

- **`firmware/lib/chinadoption/cndata.js`** -- frozen China regulatory table (PBoC / Cyberspace Administration of China / SAFE / MARA / MIIT), 5 China events (CIMAE/CIAME/Xiamen/Drone Expo/WAIC Blockchain Forum), market sizing + Chinese agri provinces, 4 partners (DJI Agriculture / XAG / Zoomlion / CAAMM), 2 beta testers, `zh` (Simplified-Chinese) locale keys.
- **`firmware/lib/chinadoption/chinadoption.js`** -- pure-JS planner: `regulatorReadinessScore` + `overallRegScore` + `complianceChecklist`, `eventTimeline` + `topEvents` + `eventReach`, `partnershipTracker` + `advancePartner` (identified->contacted->engaged->signed funnel + DJI-stage probe), `betaTesterPipeline` + `advanceTester` (5-step pipeline applied->screened->field-trial->feedback->onboarded; 2-tester roster -> activeRobots counter = issue outcome "2 active robots"), `communityManagerPipeline` (recruiting->screening->interview->onboarded), `zhLocaleKeys` + `zhTranslationCoverage`, `marketEntryPlan`, `buildChinaAdoptionPlan` (end-to-end plan builder).
  - The regulatory research surfaces the **2021 PBoC crypto trading ban** and the **e-CNY CBDC** compliant-rail context -- a major constraint-specific deliverable for a China rollout kit.
- **`firmware/lib/chinadoption/__tests__/chinadoption.test.js`** -- deterministic jest tests across 14 describe blocks.
- **`scripts/china-check.js`** -- `npm run cn:check` CLI headless simulation.
- **`docs/`** -- `regulatory-research.md`, `partnership-plan.md`, `event-calendar.md`, `community-manager-framework.md`, `market-analysis.md`, `zh-localization-plan.md`, `safe-harbor-note.md`.

## Acceptance criteria mapping (issue #34)

| Issue task | Coverage |
|---|---|
| Research Chinese crypto regulations | `docs/regulatory-research.md` (PBoC/CAC/SAFE/MARA/MIIT + 2021 ban + e-CNY context) + `complianceChecklist()` + `overallRegScore()` |
| Translate documentation to Chinese | `ZH_LOCALE` zh keys + `zhLocaleKeys()` / `zhTranslationCoverage()` + `docs/zh-localization-plan.md` |
| Identify key events (e.g. AgroChina) | `docs/event-calendar.md` + `eventTimeline()` / `topEvents()` |
| Find local community managers | `docs/community-manager-framework.md` + `communityManagerPipeline()` (recruiting->onboarded) |
| Expected outcome: 2 active robots in China | `betaTesterPipeline()` (target=2, recruited=2, activeRobots counter = 2 after onboard) |

## Quickstart

```bash
cd kits/china-adoption
npm install && npm test
npm run cn:check
```

## Scope / safety

Pure documentation + pure-JS planning + deterministic tests. No cryptocurrency generation, wallet signing, mainnet broadcast, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain logic. No network calls. The China-kit deliberately stays in the planning/documentation track -- it does not propose wallet deployment or token issuance on Chinese territory; it documents the regime as planning context for the operator team.

## AI-assisted development

Authored with AI assistance. Regulator scores, event fixtures, partner records, and beta-tester rosters are static research snapshots -- operators should refresh with live data at runtime.
