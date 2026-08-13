# Italy Agri-Robotics Market Analysis (issue #24)

Sizing + entry strategy for the Italian home-base market. The issue rationale calls out Italy's Monero community + agricultural robotics potential.

## Market size
- Italy agri-tech spend estimated ~1.2B EUR (2026 est) -- captures machinery + precision-ag + autonomous systems
- Within the EU-27, Italy sits in the agri-tech top tier alongside France/Germany/Spain; strong agri machinery OEM base (Bologna is Italy's agri-machinery cluster)
- Monero community concentration: northern Italy (Milan + Bologna + Torino) per public-meetup history

## Regional priority (frozen in `MARKET.topRegions`)
1. **Emilia-Romagna** -- pilot region (Castrocaro site + Bologna EIMA cluster + CRPA research)
2. **Lombardia** -- high Monero community density, dairy farming (robotic milking base)
3. **Veneto** -- Verona Fieragricola + horticulture + wine (high-value per-hectare)
4. **Toscana** -- olive + viticulture; lighter agri density but premium PPP spend

## Entry strategy (`marketEntryPlan`)
**Castrocaro (Emilia-Romagna) pilot -> Emilia-Romagna/Veneto agri-belt expansion.**

- Pilot a single site at Castrocaro (the named test location)
- Use the 5-beta-tester pipeline [castrocaro-beta-plan.md](castrocaro-beta-plan.md) to validate units
- After successful pilot, expand along the Via Emilia corridor (BO -> MO -> PR -> RE) into Veneto

## Demand levers
- Italian labour scarcity in seasonal agri work raises demand for autonomous field units
- Cooperative farming structures (Consortia di bonifica) are natural distribution channels
- Existing Monero community lowers the crypto-rail adoption friction

## Caution
- All figures are research snapshots; operators must validate with live sources (ISTAT + Coldiretti data + most-recent EIMA market reports)
- This analysis is documentation-only; no market-data API calls

## Verification (in-kit)
`scripts/italy-check.js` asserts `marketEntryPlan().pilotRegion === 'Emilia-Romagna'` and `topRegions` array shape.
