# China Partnership Plan (issue #34)

Outreach strategy for partnering with Chinese agri-robotics actors. Four partners are seeded in the planner at stage `identified`; the `partnershipTracker()` models the funnel `identified -> contacted -> engaged -> signed` and exposes a DJI-stage probe.

## Why these partners (seeded in `PARTNERS`)
- **DJI Agriculture** -- dominant Chinese agri-drone maker (A3/N3 flight controllers, MG series); the natural co-integration target for a MyZubster payment surface over DJI mission plans
- **XAG (Xianfeng)** -- leading agri-drone + autopilot specialist; strong field-robotics R&D; co-research fit for autonomous-unit rollout
- **Zoomlion** -- major Chinese agri-machinery OEM (tractors, harvesters); autonomous-tractor + smart-farm cooperation angle
- **China Association of Agricultural Machinery Manufacturers (CAAMM)** -- industry body; community-manager recruitment pipeline + access to CIMAE/CIAME events; association-blessed referral funnel

## Outreach strategy (milestoned in `partnershipTracker` / `advancePartner`)

1. **identified** (planner seed): map the agri-innovation / business-development desk at each partner; the kit seeds all four at this stage and `partnershipTracker().djiStage === 'identified'` asserts it
2. **contacted**: open formal introductory contact; share the China safe-harbor scope (documentation track, e-CNY-compliant rail, no onshore crypto custody) + Shandong pilot plan
3. **engaged**: co-design a field-trial protocol with the partner's agronomists; agree a beta-tester referral funnel into the 2-tester Shandong/Jiangsu pipeline
4. **signed**: MoU with defined co-marketing (CIMAE/CIAME visibility) + member-farm field-trial access; integration plan for the MyZubster payment surface

## Integration touchpoints
- **DJI / XAG**: co-integration of the MyZubster payment rail over DJI-A3/XAG mission plans (the kit's `touchpoint` field documents this; execution is operator-side)
- **Zoomlion**: autonomous tractor + smart-farm cooperation; Shandong OEM-base synergy
- **CAAMM**: community-manager recruitment pipeline (see [community-manager-framework.md](community-manager-framework.md)) + CIMAE/CIAME booth access (see [event-calendar.md](event-calendar.md))

## Joint value proposition
- Robotic agriculture is a national priority (smart-agriculture demonstration zones); MyZubster delivers autonomous field units and, for cross-border payments, an e-CNY/compliant-rail-aware payment surface -- never an onshore crypto exchange
- Partners gain co-marketing visibility at CIMAE/CIAME + member-farm field-trial access; MyZubster gains a credible, association-blessed adoption pipeline

## Verification (in-kit)
`scripts/china-check.js` asserts `partnershipTracker().total >= 2` and `partnershipTracker().djiStage === 'identified'`; `advancePartner(PARTNERS[0],'contacted')` models the next pipeline move. Operators run the outreach; the kit tracks stage progress.
