# EU Expansion Roadmap (issue #17)

MyZubster expansion plan for Europe: Italy (HQ) as home base, then DE, UK, FR, ES, NL.

## 5-Phase Milestone State Machine

The expansion follows a strict forward-only state machine:

```
SURVEY -> REGULATE -> LOCALIZE -> LAUNCH -> SCALE
```

### Phase 1: SURVEY
- Map current MyZubster presence per target country (IT/DE/UK/FR/ES/NL)
- Score each country on regulation clarity, Monero community strength, agricultural robotics market
- Output: ranked country readiness table (`rankCountries()` in the planner)

### Phase 2: REGULATE
- Research per-country crypto/RWA regulatory landscape (see `regulatory-briefing.md`)
- Register with national regulators where needed (BaFin/DE, FCA/UK, AMF/FR, CNMV/ES, DNB/NL)
- Output: per-country compliance checklist

### Phase 3: LOCALIZE
- Translate documentation into French, German, Spanish (fr/de/es locale files, 20 keys each)
- Adapt UI strings and onboarding flow per locale
- Output: i18n coverage validated by `i18nCoverage()` (0 missing keys per locale)

### Phase 4: LAUNCH
- Attend 2-3 key EU events (Paris Blockchain Week, Agritechnica, Web Summit Lisbon)
- Launch Italy HQ hub (first hub, with Coldiretti partnership)
- Recruit 5 beta testers in Italy
- Output: first hub active (`buildExpansionPlan('IT')` gate = true)

### Phase 5: SCALE
- Expand to DE/UK/FR/ES/NL hubs sequentially (by readiness ranking)
- Sign 2+ agri-robotics partner agreements (`partnerOutreachTracker` signed rate > 0)
- Output: multi-hub European network

## Country Readiness Scoring

Readiness score = regClarity * 0.4 + moneroCommunity * 0.2 + agriMarket * 0.4, scaled to 0-100.

| Country | Score | Gate (>=60) | Notes |
|---|---|---|---|
| IT | 88 | YES | Home base; Coldiretti; Castrocaro test site |
| DE | 80 | YES | NEURA Robotics; BaFin framework |
| UK | 84 | YES | Small Robot Company; FCA regime |
| FR | 60 | YES | PACTE framework; Paris Blockchain Week |
| ES | 72 | YES | FIMA; strong agri sector |
| NL | 80 | YES | High crypto adoption; precision-agri greenhouses |

## Sequence

1. Italy HQ launch (Phase 1-4 complete first)
2. Germany (Agritechnica, NEURA Robotics)
3. United Kingdom (Small Robot Company, FCA clearance)
4. Netherlands (Wageningen UR, DNB registration)
5. Spain (FIMA, Monero community growth)
6. France (Paris Blockchain Week, AMF registration)
