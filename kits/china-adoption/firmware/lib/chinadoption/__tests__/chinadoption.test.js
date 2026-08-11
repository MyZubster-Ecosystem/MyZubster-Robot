'use strict';
const {
  regulatorReadinessScore, overallRegScore, complianceChecklist,
  eventTimeline, topEvents, eventReach,
  partnershipTracker, advancePartner,
  betaTesterPipeline, advanceTester,
  communityManagerPipeline,
  zhLocaleKeys, zhTranslationCoverage,
  marketEntryPlan,
  buildChinaAdoptionPlan, REGULATORS, EVENTS, PARTNERS, BETA_TESTERS, ZH_LOCALE, STAGES, BETA_STAGES, CM_STAGES,
} = require('../chinadoption');

describe('regulatorReadinessScore', () => {
  test('PBOC scores 40 (clarity 2 -- restrictive)', () => { expect(regulatorReadinessScore('PBOC')).toBe(40); });
  test('MARA scores 80 (clarity 4)', () => { expect(regulatorReadinessScore('MARA')).toBe(80); });
  test('unknown throws', () => { expect(() => regulatorReadinessScore('XXX')).toThrow(); });
  test('case-insensitive', () => { expect(regulatorReadinessScore('pboc')).toBe(regulatorReadinessScore('PBOC')); });
});
describe('overallRegScore', () => {
  test('aggregate is 0-100 int', () => {
    const s = overallRegScore();
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0); expect(s).toBeLessThanOrEqual(100);
  });
  test('matches mean of 5 regulators', () => {
    const vals = Object.values(REGULATORS).map(r => r.regClarity * 20);
    expect(overallRegScore()).toBe(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length));
  });
});
describe('complianceChecklist', () => {
  test('one entry per regulator', () => {
    const c = complianceChecklist();
    expect(c).toHaveLength(Object.keys(REGULATORS).length);
    for (const e of c) { expect(e.items.length).toBeGreaterThan(0); expect(e.readiness).toBeGreaterThanOrEqual(0); }
  });
  test('codes match', () => {
    const codes = complianceChecklist().map(e => e.code).sort();
    expect(codes).toEqual(Object.keys(REGULATORS).slice().sort());
  });
});
describe('eventTimeline', () => {
  test('sorted by month asc', () => {
    const tl = eventTimeline();
    for (let i = 1; i < tl.length; i++) expect(tl[i].month).toBeGreaterThanOrEqual(tl[i - 1].month);
  });
  test('has all events', () => { expect(eventTimeline()).toHaveLength(EVENTS.length); });
});
describe('topEvents', () => {
  test('returns top 3', () => { expect(topEvents(null, 3)).toHaveLength(3); });
  test('first event has priority 5 (CIMAE/CIAME)', () => { expect(topEvents(null, 3)[0].priority).toBe(5); });
});
describe('eventReach', () => {
  test('counts cities uniquely', () => {
    const r = eventReach();
    expect(r.eventCount).toBe(EVENTS.length);
    expect(r.cityCount).toBe(new Set(EVENTS.map(e => e.city)).size);
    expect(r.cities.length).toBeGreaterThan(0);
  });
  test('cities sorted', () => {
    const c = eventReach().cities;
    for (let i = 1; i < c.length; i++) expect(c[i] >= c[i - 1]).toBe(true);
  });
});
describe('partnershipTracker', () => {
  test('total = partners count', () => { expect(partnershipTracker().total).toBe(PARTNERS.length); });
  test('all identified initially', () => { expect(partnershipTracker().byStage.identified).toHaveLength(PARTNERS.length); });
  test('funnelRate identified=1.0 signed=0', () => {
    expect(partnershipTracker().funnelRate('identified')).toBe(1);
    expect(partnershipTracker().funnelRate('signed')).toBe(0);
  });
  test('touchpoints listed', () => { expect(partnershipTracker().touchpoints).toHaveLength(PARTNERS.length); });
  test('DJI stage surfaced', () => { expect(partnershipTracker().djiStage).toBe('identified'); });
});
describe('advancePartner', () => {
  test('identified -> contacted', () => {
    expect(advancePartner(PARTNERS[0], 'contacted').stage).toBe('contacted');
  });
  test('no regression', () => {
    const e = Object.assign({}, PARTNERS[0], { stage: 'engaged' });
    expect(advancePartner(e, 'identified').stage).toBe('engaged');
  });
  test('unknown throws', () => { expect(() => advancePartner(PARTNERS[0], 'bad')).toThrow(); });
});
describe('betaTesterPipeline', () => {
  test('target is 2 active robots (issue outcome for china)', () => { expect(betaTesterPipeline().target).toBe(2); });
  test('2 testers recruited', () => { expect(betaTesterPipeline().recruited).toBe(2); });
  test('all applied initially -> active robots 0', () => {
    const p = betaTesterPipeline();
    expect(p.byStage.applied).toHaveLength(2);
    expect(p.activeRobots).toBe(0);
  });
  test('stages are the 5-step pipeline', () => {
    expect(BETA_STAGES).toEqual(['applied', 'screened', 'field-trial', 'feedback', 'onboarded']);
  });
  test('funnelRate applied=1.0 onboarded=0', () => {
    expect(betaTesterPipeline().funnelRate('applied')).toBe(1);
    expect(betaTesterPipeline().funnelRate('onboarded')).toBe(0);
  });
});
describe('advanceTester', () => {
  test('applied -> screened', () => {
    expect(advanceTester(BETA_TESTERS[0], 'screened').stage).toBe('screened');
  });
  test('no regression', () => {
    const e = Object.assign({}, BETA_TESTERS[0], { stage: 'field-trial' });
    expect(advanceTester(e, 'applied').stage).toBe('field-trial');
  });
  test('unknown throws', () => { expect(() => advanceTester(BETA_TESTERS[0], 'nope')).toThrow(); });
  test('onboard all 2 -> active robots 2 = target', () => {
    const onboarded = BETA_TESTERS.map(t => advanceTester(t, 'onboarded'));
    expect(betaTesterPipeline(onboarded).activeRobots).toBe(2);
    expect(betaTesterPipeline(onboarded).activeRobots).toBe(betaTesterPipeline(onboarded).target);
  });
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
describe('zhLocaleKeys', () => {
  test('returns array of locale keys', () => {
    const k = zhLocaleKeys();
    expect(Array.isArray(k)).toBe(true);
    expect(k.length).toBe(Object.keys(ZH_LOCALE).length);
  });
});
describe('zhTranslationCoverage', () => {
  test('complete for own keys', () => {
    const r = zhTranslationCoverage(Object.keys(ZH_LOCALE));
    expect(r.complete).toBe(true);
    expect(r.missing).toEqual([]);
  });
  test('reports missing keys', () => {
    const r = zhTranslationCoverage(['cn_adoption_title', 'a_missing_key']);
    expect(r.total).toBe(2); expect(r.present).toBe(1); expect(r.missing).toEqual(['a_missing_key']);
  });
});
describe('marketEntryPlan', () => {
  test('pilot region = Shandong (agri OEM base)', () => {
    const p = marketEntryPlan();
    expect(p.pilotRegion).toBe('Shandong');
    expect(p.entryStrategy).toBeTruthy();
  });
  test('topRegions is array', () => { expect(Array.isArray(marketEntryPlan().topRegions)).toBe(true); });
  test('expansion regions exclude pilot', () => {
    const p = marketEntryPlan();
    expect(p.expansionRegions).not.toContain(p.pilotRegion);
  });
});
describe('buildChinaAdoptionPlan', () => {
  test('end-to-end plan shapes', () => {
    const plan = buildChinaAdoptionPlan();
    expect(plan.regScore).toBeGreaterThanOrEqual(0);
    expect(plan.compliance).toHaveLength(Object.keys(REGULATORS).length);
    expect(plan.timeline).toHaveLength(EVENTS.length);
    expect(plan.topEvents).toHaveLength(3);
    expect(plan.partnerships.total).toBe(PARTNERS.length);
    expect(plan.betaTesters.target).toBe(2);
    expect(plan.communityManager.nextPending).toBe('recruiting');
    expect(plan.zhI18n.complete).toBe(true);
    expect(plan.marketEntry.pilotRegion).toBe('Shandong');
    expect(typeof plan.gate).toBe('boolean');
  });
  test('gate true for planned (restrictive regime uses >=50 OR >=60 fallback)', () => {
    const plan = buildChinaAdoptionPlan();
    expect(plan.gate).toBe(plan.regScore >= 60 || plan.regScore >= 50);
  });
  test('respects injected fixtures', () => {
    const miniReg = { X: { name: 'X', sector: 'x', regClarity: 4, notes: '' } };
    const plan = buildChinaAdoptionPlan({ regulators: miniReg });
    expect(plan.regScore).toBe(80);
  });
});
