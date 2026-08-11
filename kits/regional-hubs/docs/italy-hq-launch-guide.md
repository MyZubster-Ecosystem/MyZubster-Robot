# Italy HQ Launch Guide (issue #22 -- first hub)

Step-by-step guide for launching the first MyZubster hub in Italy (the HQ), per the issue's "first hub launch" expected outcome.

## Step 1: Ambassador recruitment

- Target: bilingual (it/en) community organizer with Castrocaro test site access + Coldiretti network
- Outreach: Monero Italia community + Castrocaro robotics forum + Coldiretti member recommendation
- Process: application -> trial event (Florence/Bologna) -> community vote -> onboarded (per `governanceModel().ambassadorSelection`)

## Step 2: Local language support

- Italian (it) + English (en) localization
- Existing MyZubster Italian strings are already complete (home base); English complete from prior PRs
- New strings for hub-launch UI: "Become a beta tester", "Hub event calendar", "Local community contacts"

## Step 3: First event

- **Venue**: Florence or Bologna community venue
- **Attendance target**: 10-15 (minimum 10 to pass milestone)
- **Demo**: live MyZubster robot inspection kit demo (from prior #70/#71/#76 kits)
- **Agenda**: MyZubster x402 payment demo -> beta tester sign-up -> Monero privacy talk -> Q&A
- **Follow-up**: 24h thank-you email + beta tester onboarding kit dispatch

## Step 4: Beta tester recruitment (target: 5)

- Pitch: "Test MyZubster agricultural robots in the Castrocaro test site + receive Monero bounty for feedback"
- Logistics: 5 test deployments scheduled over 4 weeks; weekly check-in
- Beta tester agreement: privacy-aware Monero payout wallet + weekly feedback photos + bug reports

## Step 5: First paid bounty completed

- Each beta tester / ambassador opens or completes at least one MyZubster bounty PR
- Example: bug report, customer review translation, robot kit feedback synthesis, performance testimonial
- The PR's Monero bounty payout closes the first-hub "first paid bounty" milestone in `governanceModel().milestoneStructure`

## Step 6: Quarterly report + annual hub summit

- Month 1: launch event + beta tester recruitment
- Month 3: quarterly report (beta tester count, bugs filed, bounties completed, payout total)
- Month 12: annual hub summit (Florence) + renewal decision: continue / expand / add second Italian regional hub

The `buildHubPlan('IT')` in the planner encodes this plan as: score=96, gate=true, timeline position=1, checklist + governance + ambassador pipeline.
