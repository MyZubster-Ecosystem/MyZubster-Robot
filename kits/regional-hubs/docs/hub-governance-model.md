# Hub Governance Model (issue #22)

Ambassador selection, reporting cadence, milestone structure, and funding model for each regional hub.

## Ambassador selection

1. **Application + network assessment**: candidate submits a short application describing their local MyZubster/crypto network, prior meetup-hosting experience, and agri-robotics domain exposure
2. **Trial event hosting**: candidate hosts a small community event (10-15 attendees) with MyZubster demo kit
3. **Community vote**: post-event feedback collected from attendees; >70% positive feedback + 3+ people who would attend again -> ambassador onboarded

## Reporting cadence

| Frequency | Content |
|---|---|
| Monthly | Activity count (events, beta tests, new community members) + beta tester count |
| Quarterly | Budget report + impact report (bounties completed per hub, payout total, community growth) |
| Annual | Hub summit + renewal decision (continue / replace / expand) |

## Milestone structure

1. **Onboarded**: ambassador selected and trained on MyZubster kit + local regulation briefing
2. **First event**: inaugural hub meetup hosted (minimum 10 attendees)
3. **5 beta testers**: 5 active beta testers using MyZubster robots in the hub's field / greenhouse
4. **First paid bounty completed**: a local beta tester (or the ambassador) completes and receives payment for a MyZubster bounty PR
5. **Self-sustaining events**: hub hosts events without HQ intervention (events planned + executed locally)

Per the issue body: "Each hub will -- Support local language -- Organize local events -- Connect with local farmers/agriculturists -- Adapt MyZubster to local regulations."

## Funding model

XMR bounty per completed milestone (per-hub):
- Onboarded: 0.02 XMR to ambassador (one-time)
- First event: 0.01 XMR event grant
- 5 beta testers: 0.03 XMR
- First paid bounty: 0.02 XMR
- Self-sustaining: 0.02 XMR/quarter (recurring for active ambassador)

The `governanceModel()` in the planner encodes this governance structure.
