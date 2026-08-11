# Italy Event Calendar (issue #24)

Italian agri-tech + blockchain events for organizing local meetups (issue task). Sorted ascending by month in `eventTimeline()`.

| Month | Event | City | Priority | Type |
---|---|---|---|---|
| 2 (Feb) | Fieragricola | Verona | 5 | trade-fair |
| 6 (Jun) | Milan Blockchain Week | Milano | 3 | conference |
| 10 (Oct) | Agrilevante | Bari | 4 | trade-fair |
| 10 (Oct) | Maker Faire Rome | Roma | 4 | festival |
| 11 (Nov) | EIMA International | Bologna | 5 | trade-fair |

## Selection rationale
- **Fieragricola (Verona)** -- flagship Italian agri fair, priority 5; prime booth + cold-list capture moment for Coldiretti members
- **EIMA International (Bologna)** -- second flagship agri-machinery fair, priority 5; agri-robotics demo sweet spot (Bologna = kit HQ region)
- **Agrilevante (Bari)** -- top southern-Italy agri fair; balances regional reach (Bari over-indexed for olive + horticulture)
- **Maker Faire Rome** -- maker crowd + early adopters; lighter-fit but participatory
- **Milan Blockchain Week** -- crypto-community touchpoint (Monero) per the "strong Monero community" lever in issue #24

## Reach
`eventReach()` reports 5 events across 5 distinct Italian cities (Verona, Bologna, Bari, Roma, Milano), giving broad geographic coverage for the national rollout.

## Operator action
- Booth / sponsorship for Fieragricola + EIMA (priority 5)
- Talk submission for Milan Blockchain Week (Monero angle)
- Robotic farm demo slot at Agrilevante + Maker Faire Rome

## Verification (in-kit)
`scripts/italy-check.js` asserts `eventTimeline().length >= 4` and `topEvents` (3) returns the highest-priority trio.
