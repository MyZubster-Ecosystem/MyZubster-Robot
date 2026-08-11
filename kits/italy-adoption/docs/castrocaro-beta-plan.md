# Castrocaro Beta-Test Plan (issue #24)

The pilot field-trial program at **Castrocaro** (Emilia-Romagna) targets the issue outcome: **5 active robots in Italy**. The planner encodes this as a 5-step pipeline with a 5-tester roster.

## Site rationale
- Castrocaro (Emilia-Romagna) is the named test site in issue #24; strong Monero community + agricultural base
- Emilia-Romagna is Italy's agri-tech heartland; top region in `marketEntryPlan.pilotRegion`
- Proximity to Coldiretti regional delegate + CRPA (regional agri research) shortens the referral loop

## 5-step beta pipeline (encoded in `betaTesterPipeline` / `advanceTester`)

1. **applied** -- tester profile submitted via Coldiretti referral (5 starter testers seeded)
2. **screened** -- agronomist screens for farm size, willingness to host a unit, GDPR consent collected
3. **field-trial** -- unit deployed on-farm; MIPAAF field-trial filed; operator trained
4. **feedback** -- structured 30-day feedback loop (telemetry + farmer survey)
5. **onboarded** -- retained, paid-up robot enters active fleet (counts toward `activeRobots`)

## Beta-tester roster (seeded in `BETA_TESTERS`)
- 3 testers in Emilia-Romagna (Castrocaro cluster)
- 1 tester in Veneto (Verona)
- 1 tester in Emilia-Romagna (Bologna)

The pipeline starts with `recruited=5`, `activeRobots=0`; advancing all 5 through `onboarded` yields `activeRobots=5`, meeting the issue outcome.

## Data / GDPR
- Beta-tester profiles are personal data; `Garante per la protezione dei dati personali` expectations documented in [regulatory-research.md](regulatory-research.md)
- Consent + minimization + retention defined before on-farm deployment
- The planner encodes only stage state -- no PII fields are stored in the kit

## Operator split
- Operator (MyZubster integration team) recruits, deploys hardware, collects feedback
- This kit provides the **pipeline model + tester roster scaffold + check harness**; execution is operator-side
