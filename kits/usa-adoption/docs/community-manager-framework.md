# Community-Manager Recruitment Framework (issue #29)

Recruitment pipeline for local US community managers -- one of the explicit tasks in issue #29.

## Pipeline states

The `communityManagerPipeline()` in the planner tracks progress through a forward-only pipeline:

```
recruiting -> screening -> interview -> onboarded
```

### Stage 1: recruiting
- Post on: crypto community boards (r/Monero, r/CryptoCurrency jobs), agri-tech community boards (AgFunder, S2G Ventures network), local US tech meetup groups
- Target profile: bilingually comfortable in crypto + agri-tech, local US (TX/IA/CA preferred for state-density strategy), network of 50+ in target domain
- Output: raw applicant pool (10-20 candidates)

### Stage 2: screening
- Filter by: crypto-education background (Monero knowledge why), agri-tech exposure, network size in target states, self-organized event capacity
- Phone screen: motivation, local state network, willingness to run monthly meetups
- Output: 5 candidates advanced to interview

### Stage 3: interview
- Key questions: "Tell me about a Monero-related local event you would organize"; "How would you recruit 5 beta-testers in [pilot state] within 60 days"; "Walk through a Coldiretti-style local-agri association partnership you could replicate in the US"
- Availability check: weekly evening commitment + monthly event planning + quarterly reporting cadence
- Compensation discussion: tokenized incentive structure (XMR per recruited beta-tester, milestone-based)
- Output: 2-3 selected for onboarding

### Stage 4: onboarded
- Training: MyZubster kit walk-through, agri-robotic fleet integration training (docs-only), local regulation briefing (per `regulatory-research.md`)
- Event kit dispatch: branded materials, demo scripts, MyZubster invite cards
- Pipeline follow-through: weekly check-in for first 30 days, monthly thereafter; structured reporting quarterly
- Output: 1-2 community managers with their own local network + event plan

## Funnel metrics

Pipeline funnel rate = fraction of managers who have reached a given stage:
- recruiting: 100% (all starting state)
- screening: tapers as applicant pool narrows
- interview: tapers further
- onboarded: ~10-20% of recruiting pool (industry benchmark for volunteer/part-time community-manager roles)

The `communityManagerPipeline([true, false, false, false]).progressCount` = 1 indicates one step complete.
