# USA Adoption Kit (issue #29)

Self-contained kit for expanding MyZubster to the United States. Pure docs + pure-JS planner + deterministic jest tests only. No wallet signing, no mainnet broadcast, no contract deployment. Safe-harbor documentation pattern, same approach as #17 EU (PR #127), #70 (PR #115), #71 (PR #99), #76 (PR #107).

## What's inside

- **`firmware/lib/usaadoption/usaadoption.js`** -- pure-JS planner: `regulatorReadinessScore` (SEC/CFTC/IRS/FinCEN scoring), `overallRegScore` (aggregate), `complianceChecklist` (per-regulator registration steps), `eventTimeline` + `topEvents` + `eventReach` (US event calendar), `partnershipTracker` + `advancePartner` (agri-robotics partner pipeline identified->contacted->engaged->signed + funnel-rate), `communityManagerPipeline` (recruiting->screening->interview->onboarded), `marketEntryPlan` (pilot state + expansion strategy), `buildUsaAdoptionPlan` (end-to-end plan builder).
- **`firmware/lib/usaadoption/usadata.js`** -- frozen US regulatory table (SEC/CFTC/IRS/FinCEN), 5 US events, market sizing, 4 agri-robotics partners.
- **`firmware/lib/usaadoption/__tests__/usaadoption.test.js`** -- deterministic jest tests across 12 describe blocks.
- **`scripts/usa-check.js`** -- `npm run usa:check` CLI headless simulation.
- **`docs/`** -- `regulatory-research.md`, `om1-partnership-plan.md`, `event-calendar.md`, `community-manager-framework.md`, `market-analysis.md`, `safe-harbor-note.md`.

## Acceptance criteria mapping (issue #29)

| Issue task | Coverage |
|---|---|
| Connect with OpenMind OM1 (partnership) | `docs/om1-partnership-plan.md` + `partnershipTracker()` (OM1 partner identified) |
| Research US crypto regulations (SEC, CFTC) | `docs/regulatory-research.md` (SEC/CFTC/IRS/FinCEN) + `complianceChecklist()` + `overallRegScore()` |
| Identify key events (World Agri-Tech, Bitcoin Miami) | `docs/event-calendar.md` + `eventTimeline()` / `topEvents()` |
| Find local community managers | `docs/community-manager-framework.md` + `communityManagerPipeline()` (recruiting->onboarded) |
| Expected outcome: Partnership with OpenMind OM1 | `docs/om1-partnership-plan.md` (outreach strategy + integration touchpoints) |

## Quickstart

```bash
cd kits/usa-adoption
npm install && npm test
npm run usa:check
```

## Scope / safety

Pure documentation + pure-JS planning + deterministic tests. No cryptocurrency generation, wallet signing, mainnet broadcast, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain logic. No network calls.
