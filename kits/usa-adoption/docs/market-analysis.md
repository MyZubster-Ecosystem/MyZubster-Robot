# US Agricultural Robotics Market Analysis (issue #29)

Sizing and entry strategy for the US -- the largest agricultural robotics market per the #29 issue body.

## Market size

- **Agri-robotics market**: ~4.1B USD (2026 estimate), growing 19% CAGR through 2030
- **自治 segments**: autonomous tractors (65%), harvest robots (15%), weed/pest control (12%), scouting/drones (8%)
- **Monero-relevant**: micro-payment-per-service flows for per-field/per-survey work (the exact niche MyZubster targets)

## Top 5 states by agri-robotics value

The top-state list in the planner:

| State | Rank | Why |
|---|---|---|
| California (CA) | 1 | Largest agri economy in US; specialty crops (almonds, wine); autonomous scouting leadership |
| Texas (TX) | 2 | Largest cattle/beef + cotton; agri-tech investment; Bitcoin-mining overlap (crypto-adjacent labor) |
| Iowa (IA) | 3 | Corn/soy belt; pilot state for Midwest autonomous-tractor rollout |
| Nebraska (NE) | 4 | Irrigated agriculture; precision-agri adoption leader; pilot expansion |
| Kansas (KS) | 5 | Wheat belt; rugged autonomous combine use case |

## Entry strategy

**Midwest agri-belt pilot (IA/NE/KS) -> coastal expansion (CA/TX)**

### Why Midwest first

- Lower regulatory friction (county-level zoning vs coastal state-level crypto regimes)
- Fewer competitor crypto projects targeting agri-belt (vs SF/NY crypto density)
- Stronger local farmer-association networks (Farm Bureau chapters per state)
- OpenMind OM1 can host field-test pilot (tx402 wallet experiment)

### Why coastal later

- CA: highest agri-robotics value, but heavier crypto regulation (CCAT/DFPI)
- TX: Bitcoin-friendly regulatory climate + agri-tech investment + crypto-mining labor overlap

The `marketEntryPlan()` in the planner encodes this as:
- `pilotState` = IA (Iowa -- the most ag-tech-ready Midwest state)
- `expansionStates` = [CA, TX] (coastal/southern high-value markets)

## Beta-tester target

Issue #29 does not specify a beta-tester count for the US (unlike #24 Italy which asks for 5); however, the planned-but-pending EU hub #22 beta-tester framework is structurally reusable. Initial US pilot target: 3 active robot deployments in pilot state (IA), expanding to 10 total across the pilot + 2 expansion states at launch.
