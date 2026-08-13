# Community-Manager Recruitment Framework (issue #34)

Recruitment pipeline for local China community managers -- one of the explicit tasks in issue #34 ("Find local community managers"). China-specific screening adds regulatory-communication vetting: candidates must understand and be able to communicate the e-CNY/compliant-rail framing (not an onshore-Monero pitch) given the 2021 PBoC ban.

## Pipeline states

The `communityManagerPipeline()` in the planner tracks progress through a forward-only pipeline:

```
recruiting -> screening -> interview -> onboarded
```

### Stage 1: recruiting
- Post on: Chinese agri-tech community boards (agri-machinery WeCom / industry forums), agri-university alumni networks (China Agricultural University, Nanjing Agricultural University), and local Shandong smart-ag demo-zone networks
- Target profile: comfortable in agri-tech + cross-border fintech framing, mainland-based but e-CNY-aware, network of 50+ in target provinces (Shandong / Jiangsu preferred)
- Output: raw applicant pool (10-20 candidates)

### Stage 2: screening
- Filter by: agri-tech exposure, network size in target provinces, self-organized event capacity, and a **regulatory-communication screening** -- the candidate can articulate the 2021 PBoC ban and the compliant e-CNY/bank-channel framing without proposing illegal onshore crypto activity (see [regulatory-research.md](regulatory-research.md))
- Phone screen: motivation, local provincial network, willingness to run monthly meetups under the documentation/field-trial scope
- Output: 5 candidates advanced to interview

### Stage 3: interview
- Key questions: "Describe how you would introduce MyZubster at a CIMAE booth without pitching an onshore crypto exchange"; "How would you recruit 2 beta-testers in Shandong/Jiangsu within 60 days under MARA field-trial scope"; "Walk through a CAAMM-style local-association partnership you could open"
- Availability check: weekly evening commitment + monthly event planning + quarterly reporting cadence
- Compensation discussion: milestone-based incentive (XMR per onboarded beta-tester, paid off-mainland)
- Output: 1-2 selected for onboarding

### Stage 4: onboarded
- Training: MyZubster kit walk-through, agri-robotic fleet integration training (docs-only), local-regulation briefing (per [regulatory-research.md](regulatory-research.md))
- Event kit dispatch: branded materials, demo scripts (compliant-rail framing), MyZubster invite cards
- Pipeline follow-through: weekly check-in for first 30 days, monthly thereafter; structured reporting quarterly
- Output: 1 community manager with their own local network + event plan

## Funnel metrics

Pipeline funnel rate = fraction of managers who have reached a given stage:
- recruiting: 100% (all starting state)
- screening: tapers as applicant pool narrows
- interview: tapers further
- onboarded: ~10-15% of recruiting pool (industry benchmark for mainland community-manager roles under regulatory caution)

The `communityManagerPipeline([true,false,false,false]).progressCount` = 1 indicates one step complete; `communityManagerPipeline().nextPending === 'recruiting'` is the seeded starting state asserted by `scripts/china-check.js`.
