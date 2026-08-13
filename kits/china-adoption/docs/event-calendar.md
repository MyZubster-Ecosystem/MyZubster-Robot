# China Event Calendar (issue #34)

Chinese agri-tech + blockchain events for organizing local meetups (issue task: "Identify key events (e.g., AgroChina)"). Sorted ascending by month in `eventTimeline()`.

| Month | Event | City | Priority | Type |
---|---|---|---|---|
| 4 (Apr) | China International Modern Agricultural Exhibition (CIMAE) | Beijing | 5 | trade-fair |
| 6 (Jun) | China International UAV / Drone Expo | Shenzhen | 4 | trade-fair |
| 7 (Jul) | World Artificial Intelligence Conference / Blockchain Forum | Shanghai | 3 | conference |
| 9 (Sep) | Asia Agriculture & Livestock Expo | Xiamen | 4 | trade-fair |
| 10 (Oct) | China International Agricultural Machinery Exhibition (CIAME) | Wuhan | 5 | trade-fair |

## Selection rationale
- **CIMAE (Beijing)** -- flagship national modern-agriculture exhibition, priority 5; the prime "AgroChina"-class booth + outreach moment
- **CIAME (Wuhan)** -- flagship agri-machinery fair, priority 5; autonomous-unit demo sweet spot (heavy-machinery OEM audience)
- **Asia Agriculture & Livestock Expo (Xiamen)** -- top south-China agri fair, priority 4; balances regional reach (livestock + horticulture)
- **China International UAV / Drone Expo (Shenzhen)** -- agri-drone co-integration touchpoint with DJI/XAG; aligns with the agri-drone partnership track
- **WAIC Blockchain Forum (Shanghai)** -- the cross-border / digital-currency community touchpoint; the compliant-rail (e-CNY) angle belongs here, not a Monero-privacy pitch

## Reach
`eventReach()` reports 5 events across 5 distinct cities (Beijing, Shenzhen, Shanghai, Xiamen, Wuhan), giving broad geographic coverage from the north (Beijing) through the agri-machinery belt (Wuhan) to the south coast (Xiamen/Shenzhen).

## Operator action
- Booth / sponsorship for CIMAE + CIAME (priority 5)
- Robotic farm demo slot at CIMAE + Asia Agriculture & Livestock Expo
- Joint DJI/XAG demo + co-marketing at the UAV / Drone Expo (Shenzhen)
- Talk submission to the WAIC Blockchain Forum (compliant-rail / e-CNY angle -- NOT an onshore-Monero pitch)

## Verification (in-kit)
`scripts/china-check.js` asserts `eventTimeline().length >= 4` and `topEvents` (3) returns the highest-priority trio.
