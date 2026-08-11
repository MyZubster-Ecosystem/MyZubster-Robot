# Regional Hubs Kit (issue #22)

Self-contained kit for creating regional hubs for MyZubster. Pure docs + pure-JS planner + deterministic jest tests. Safe-harbor documentation pattern, same approach as #17 EU (#127), #29 USA (#128), #70 (#115).

## What's inside

- **`firmware/lib/regionalhubs/regionalhubs.js`** -- pure-JS planner: `hubReadinessScore` (agri+monero+launch-weighted 0-100), `rankHubs`, `launchTimeline` (6-region phased launch plan), `hubLaunchChecklist` + `allHubChecklists` (per-region: language, events, farmer connection, regulatory, milestones), `governanceModel` (ambassador selection + reporting cadence + milestone structure + funding model), `ambassadorPipeline` + `advanceAmbassador` (recruiting->screening->interview->onboarded->active), `buildHubPlan` (end-to-end).
- **`firmware/lib/regionalhubs/hubs.js`** -- frozen 6-hub table (IT-HQ, US, SG, BR, AE, ZA).
- **`firmware/lib/regionalhubs/__tests__/regionalhubs.test.js`** -- deterministic jest tests across 10 describe blocks.
- **`scripts/hubs-check.js`** -- `npm run hubs:check` CLI headless simulation.
- **`docs/`** -- `hub-setup-plan.md`, `hub-governance-model.md`, `italy-hq-launch-guide.md`, `safe-harbor-note.md`.

## Acceptance criteria mapping (issue #22)

| Issue task | Coverage |
|---|---|
| Support local language | `hubLaunchChecklist().languageSupport` (IT/US/SG/BR/AE/ZA per-hub language arrays) |
| Organize local events | `hubLaunchChecklist().eventFramework` + `docs/italy-hq-launch-guide.md` |
| Connect with local farmers/agriculturists | `hubLaunchChecklist().farmerConnection` (agri-association outreach + beta tester recruitment + field demo) |
| Adapt MyZubster to local regulations | `hubLaunchChecklist().regulatoryAdaptation` (local crypto briefing + KYC/AML + tax registration) |
| Expected outcome: Regional hub plan and first hub launch | `docs/hub-setup-plan.md` (6-region plan) + `docs/italy-hq-launch-guide.md` (first hub step-by-step) |

## Quickstart

```bash
cd kits/regional-hubs
npm install && npm test
npm run hubs:check
```

## Scope / safety

Pure documentation + pure-JS planning + deterministic tests. No cryptocurrency generation, wallet signing, mainnet, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain logic. No network calls.
