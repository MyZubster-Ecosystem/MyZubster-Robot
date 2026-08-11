'use strict';
const {
  regulatorReadinessScore, overallRegScore, complianceChecklist,
  eventTimeline, topEvents, eventReach,
  partnershipTracker, advancePartner,
  communityManagerPipeline,
  marketEntryPlan,
  buildUsaAdoptionPlan, REGULATORS, EVENTS, PARTNERS, STAGES, CM_STAGES,
} = require('../usaadoption');

describe('regulatorReadinessScore', () => {
  test('CFTC scores 80', () => { expect(regulatorReadinessScore('CFTC')).toBe(80); });
  test('unknown throws', () => { expect(() => regulatorReadinessScore('XXX')).toThrow(); });
  test('case-insensitive', () => { expect(regulatorReadinessScore('sec')).toBe(regulatorReadinessScore('SEC')); });
});
describe('overallRegScore', () => {
  test('aggregate 0-100', () => {
    const s = overallRegScore();
    expect(s).toBeGreaterThanOrEqual(0); expect(s).toBeLessThanOrEqual(100);
  });
});
describe('complianceChecklist', () => {
  test('one entry per regulator', () => {
    const c = complianceChecklist();
    expect(c).toHaveLength(Object.keys(REGULATORS).length);
    expect(c[0]).toHaveProperty('items');
    expect(c[0].items.length).toBeGreaterThan(0);
  });
});
describe('eventTimeline', () => {
  test('sorted by month', () => {
    const tl = eventTimeline();
    expect(tl[0].month).toBeLessThanOrEqual(tl[tl.length - 1].month);
  });
  test('has all events', () => { expect(eventTimeline()).toHaveLength(EVENTS.length); });
});
describe('topEvents', () => {
  test('returns top 3', () => { expect(topEvents(null, 3)).toHaveLength(3); });
});
describe('eventReach', () => {
  test('counts cities', () => {
    const r = eventReach();
    expect(r.eventCount).toBe(EVENTS.length);
    expect(r.cityCount).toBeGreaterThan(0);
  });
});
describe('partnershipTracker', () => {
  test('all identified initially', () => {
    const t = partnershipTracker();
    expect(t.total).toBe(PARTNERS.length);
    expect(t.byStage.identified).toHaveLength(PARTNERS.length);
  });
  test('funnelRate identified=1.0', () => { expect(partnershipTracker().funnelRate('identified')).toBe(1); });
  test('funnelRate signed=0', () => { expect(partnershipTracker().funnelRate('signed')).toBe(0); });
  test('touchpoints listed', () => {
    expect(partnershipTracker().touchpoints).toHaveLength(PARTNERS.length);
  });
});
describe('advancePartner', () => {
  test('identified -> contacted', () => {
    expect(advancePartner(PARTNERS[0], 'contacted').stage).toBe('contacted');
  });
  test('no regression', () => {
    const e = { ...PARTNERS[0], stage: 'engaged' };
    expect(advancePartner(e, 'identified').stage).toBe('engaged');
  });
  test('unknown throws', () => { expect(() => advancePartner(PARTNERS[0], 'bad')).toThrow(); });
});
describe('communityManagerPipeline', () => {
  test('empty -> nextPending=first', () => {
    expect(communityManagerPipeline().nextPending).toBe('recruiting');
  });
  test('all true -> complete', () => {
    expect(communityManagerPipeline([true, true, true, true]).complete).toBe(true);
  });
  test('partial progress count', () => {
    expect(communityManagerPipeline([true, false, false, false]).progressCount).toBe(1);
  });
});
describe('marketEntryPlan', () => {
  test('has pilot state', () => {
    const p = marketEntryPlan();
    expect(p.pilotState).toBeDefined();
    expect(p.entryStrategy).toBeTruthy();
  });
  test('topStates is array', () => {
    expect(Array.isArray(marketEntryPlan().topStates)).toBe(true);
  });
});
describe('buildUsaAdoptionPlan', () => {
  test('gate passes', () => {
    const plan = buildUsaAdoptionPlan();
    expect(plan.gate).toBe(true);
  });
  test('plan has all components', () => {
    const plan = buildUsaAdoptionPlan();
    expect(plan.compliance).toBeDefined();
    expect(plan.timeline).toBeDefined();
    expect(plan.partnerships).toBeDefined();
    expect(plan.communityManager).toBeDefined();
    expect(plan.marketEntry).toBeDefined();
  });
  test('regScore >= 60', () => {
    expect(buildUsaAdoptionPlan().regScore).toBeGreaterThanOrEqual(60);
  });
});
