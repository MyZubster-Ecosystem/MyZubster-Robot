# Regional Hub Setup Plan (issue #22)

Six-region hub plan for MyZubster global expansion, following the issue body's proposed hubs.

## Proposed hubs (issue #22)

| Hub | Region | HQ | Readiness Score | Languages | Launch Phase |
|---|---|---|---|---|---|
| Italy (IT) | Europe | YES | 96 | it, en | Phase 1 (first launch) |
| United States (US) | North America | No | 80 | en | Phase 2 |
| Singapore (SG) | Asia-Pacific | No | 70 | en, zh | Phase 3 |
| Brazil (BR) | Latin America | No | 62 | pt, es | Phase 4 |
| UAE (AE) | Middle East | No | 56 | ar, en | Phase 5 |
| South Africa (ZA) | Africa | No | 62 | en, zu | Phase 6 |

Readiness score = agriScore * 0.3 + moneroScore * 0.3 + launchReady * 0.4, scaled to 0-100. Confidence gate = score >= 60 (4 of 6 hubs pass).

## Each hub will

- **Support local language**: UI localization + onboarding docs in hub language(s) (see EU kit fr/de/es patterns for IT).
- **Organize local events**: launch meetup -> quarterly community event -> annual hub summit.
- **Connect with local farmers/agriculturists**: agri-association outreach + beta tester recruitment (5 per hub) + field demonstration event.
- **Adapt MyZubster to local regulations**: local crypto regulation briefing + KYC/AML setup + tax registration.

## Phased launch sequence

1. **Phase 1 -- Italy HQ** (first hub launch): Coldiretti partnership, Castrocaro test site, 5 beta testers
2. **Phase 2 -- United States**: OM1 partnership, World Agri-Tech, Midwest pilot
3. **Phase 3 -- Singapore**: Precision-agri greenhouse, Asia-Pacific gateway,双语 en/zh
4. **Phase 4 -- Brazil**: Latin America agri leader, pt/es,甘蔗/soy belt
5. **Phase 5 -- UAE**: Middle East financial hub, ar/en, controlled-environment agri
6. **Phase 6 -- South Africa**: Africa gateway, en/zu, South African agri diversity

The `launchTimeline()` in the planner encodes this adaptive sequence -- lower-score hubs launch later, allowing earlier-hub lessons to flow forward.
