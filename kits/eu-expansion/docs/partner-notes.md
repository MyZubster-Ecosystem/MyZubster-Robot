# Agricultural Robotics Partner Notes (issue #17)

Research notes for potential European agricultural robotics partners. The `partnerOutreachTracker` in the planner tracks each partner through the pipeline: identified -> contacted -> engaged -> signed.

## Partners

### Small Robot Company (UK)
- **Sector**: Agri-robotics -- per-plant autonomous farming
- **Why**: Per-plant data model aligns with MyZubster's POI (point-of-interest) registry; ruggedized autonomous platforms already in field
- **Integration angle**: x402 payment overlay for per-plant service contracts; Monero settlement for micro-payments per field-survey job
- **Outreach stage**: Identified

### NEURA Robotics (DE)
- **Sector**: Cognitive robotics -- collaborative/arm-mounted
- **Why**: Stuttgart HQ; cognitive robot arm IK systems; strong EU R&D position
- **Integration angle**: Robotic arm service contract layer; x402 escrow for collaborative-robot job dispatch
- **Outreach stage**: Identified

### OpenMind OM1 (EU/IT)
- **Sector**: x402 payments -- agent payment infrastructure
- **Why**: x402 pioneer; payment infrastructure for robot agents; aligns with MyZubster x402 integration
- **Integration angle**: Co-integration of OM1 payment rail with MyZubster robot dispatch; joint demo at Agritechnica or Paris Blockchain Week
- **Outreach stage**: Identified

### Coldiretti (IT)
- **Sector**: Agricultural association -- Italy's largest farmers' union
- **Why**: Direct access to Italian farmer base; Castrocaro test site access; existing relationship
- **Integration angle**: Beta-tester recruitment pipeline; farmer onboarding via Coldiretti network
- **Outreach stage**: Identified

### Wageningen UR (NL)
- **Sector**: Agricultural research university -- precision-agri robotics
- **Why**: Leader in precision-agriculture; greenhouse robotics R&D; EU H2020/Horizon Europe grants
- **Integration angle**: Joint research proposal on x402 micropayment for autonomous greenhouse robots; PhD collaboration
- **Outreach stage**: Identified

## Outreach Pipeline States

| Stage | Meaning | Action |
|---|---|---|
| identified | Known but not contacted | Send intro email |
| contacted | First contact made | Schedule call |
| engaged | Call/visit done, expressing interest | Draft MoU |
| signed | Formal agreement signed | Begin joint work |

The `partnerOutreachTracker().funnelRate(stage)` function returns the fraction of partners at or past a given stage (zero-indexed funnel: 1.0 at identified, tapering toward signed).
