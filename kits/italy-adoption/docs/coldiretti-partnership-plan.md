# Coldiretti Partnership Plan (issue #24)

Outreach strategy for partnering with **Coldiretti**, the largest Italian agricultural association (~1.4M member farms). The partnership is the central adoption lever named by issue #24.

## Why Coldiretti
- Largest Italian agri-trade body; deep reach into Emilia-Romagna, Veneto, Lombardia, Toscana -- the regions of focus
- Runs regional delegations suitable for beta-tester referral (Castrocaro pipeline)
- Operates youth-agriculture programmes (Coldiretti Giovani) aligned with MyZubster's robotics-narrative
- Owns "Campagna Amica" farmer-marketplace infra -- potential co-marketing surface

## Outreach strategy (milestoned in `partnershipTracker`)

1. **identified** (planner seed): map Coldiretti regional delegates in Emilia-Romagna; find the agri-innovation desk contact
2. **contacted**: open formal introductory letter; share the Castrocaro beta-plan + safe-harbor scope
3. **engaged**: co-design a field-trial protocol with Coldiretti agronomists; agree beta-tester referral funnel
4. **signed**: MoU with defined co-marketing (Campagna Amica visibility) + member-farm field-trial access

## Integration touchpoints
- **Beta-tester referral**: Coldiretti -> Castrocaro pipeline (5 testers) via Coldiretti regional delegate
- **Field-trial protocol**: joint with Coldiretti agronomists + CRPA research partner (see CRPA partner entry)
- **Member marketplace**: Campagna Amica co-marketing once signed
- **Training**: operator-training plan documented in the MIPAAF field-trial filing

## Joint value proposition
- Robotic agriculture is labour-scarce in Italian agri country; MyZubster delivers autonomous field units and a Monero payment rail for service hire
- Coldiretti gains member-access to modern agri-tech; MyZubster gains a credible, association-blessed adoption pipeline in its home base

## Verification (in-kit)
`scripts/italy-check.js` asserts `partnershipTracker().coldirettiStage === 'identified'` (the seeded state); `advancePartner(coldiretti,'contacted')` models the next pipeline move. Operators run the outreach; the kit tracks stage progress.
