# China Agri-Robotics Market Analysis (issue #34)

Sizing + entry strategy for the China market. Issue #34 rationale: "Large agricultural sector, growing robotics industry." The expected outcome is 2 active robots in China.

## Market size
- **Agri-robotics / agri-machinery + agri-UAV market**: ~45B USD / ~320B RMB (China agri-machinery + UAV agri, 2026 est) -- captured in `MARKET.agriRoboticsValue`
- China is the world's largest agri-machinery market and a top agri-drone adopter; state "smart agriculture" demonstration zones drive autonomous-unit demand
- Monero-relevant micro-payment-per-service flows are constrained: the 2021 PBoC ban means onshore crypto rails are not available; cross-border payment surfaces must use the compliant e-CNY/bank-channel framing (see [regulatory-research.md](regulatory-research.md))

## Top provinces by agri-robotics value (frozen in `MARKET.topRegions`)

| Province | Rank | Why |
|---|---|---|
| Shandong | 1 | Largest agri-machinery OEM base; smart-farm demonstration zone density; pilot site for the 2-robot beta |
| Henan | 2 | Top grain (wheat/maize) province by output; large autonomous-unit TAM |
| Jiangsu | 3 | Agri-machinery industrial park cluster; second beta-tester site in the kit |
| Heilongjiang | 4 | Northeast grain belt (soy/maize/rice); large-scale farm operations ideal for autonomous units |

## Entry strategy (`marketEntryPlan`)

**Shandong (agri-machinery OEM base) drone pilot -> Jiangsu/Henan autonomous-unit expansion.**

The planner encodes this as:
- `pilotRegion` = Shandong (the agri-machinery OEM base and smart-farm zone concentration)
- `expansionRegions` = Jiangsu, Henan (the next two top provinces)

### Why Shandong first
- Largest agri-machinery OEM base (Zoomlion/LOVOL/Shifang presence) -- shortens the partner-referral loop
- Multiple national smart-agriculture demonstration zones accept field-trial protocols
- The kit's beta-tester roster seeds one tester in Shandong (the pilot) and one in Jiangsu (the first expansion province)

## Beta-tester target
Issue #34 expected outcome: **2 active robots in China**. The `betaTesterPipeline()` encodes `target=2`, `recruited=2` (Shandong + Jiangsu testers), and an `activeRobots` counter that reaches 2 only after both testers advance to `onboarded`. See [beta-tester pipeline in the planner] and the safe-harbor note.

## Demand levers
- Labour scarcity in seasonal north-China grain operations raises autonomous-unit demand
- State smart-agriculture demonstration programs co-fund agri-tech field trials (MARA)
- Established agri-drone ecosystem (DJI/XAG) lowers the autonomous-unit adoption friction

## Caution
- All figures are research snapshots; operators must validate with live sources (MARA + CAAMM data + most-recent CIMAE/CIAME reports)
- The restrictive digital-currency regime (2021 PBoC ban) means any payment surface is off-mainland / compliant-rail only; this analysis is documentation-only and makes no market-data API calls

## Verification (in-kit)
`scripts/china-check.js` asserts `marketEntryPlan().pilotRegion === 'Shandong'`; the planner asserts `betaTesters.target === 2 && betaTesters.recruited === 2`.
