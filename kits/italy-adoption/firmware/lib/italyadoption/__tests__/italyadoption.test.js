'use strict';
const {
  regulatorReadinessScore, overallRegScore, complianceChecklist,
  eventTimeline, topEvents, eventReach,
  partnershipTracker, advancePartner,
  betaTesterPipeline, advanceTester,
  itLocaleKeys, itTranslationCoverage,
  marketEntryPlan,
  buildItalyAdoptionPlan, REGULATORS, EVENTS, PARTNERS, BETA_TESTERS, IT_LOCALE, STAGES, BETA_STAGES,
} = require('../italyadoption');

describe('regulatorReadinessScore', () => {
  test('CONSOB scores 60 (clarity 3)', () => { expect(regulatorReadinessScore('CONSOB')).toBe(60); });
  test('GARANTEPRIVACY scores 80 (clarity 4)', () => { expect(regulatorReadinessScore('GARANTEPRIVACY')).toBe(80); });
  test('unknown throws', () => { expect(() => regulatorReadinessScore('XXX')).toThrow(); });
  test('case-insensitive', () => { expect(regulatorReadinessScore('consob')).toBe(regulatorReadinessScore('CONSOB')); });
});
describe('overallRegScore', () => {
  test('aggregate is 0-100 int', () => {
    const s = overallRegScore();
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0); expect(s).toBeLessThanOrEqual(100);
  });
  test('matches mean of 4 regulators', () => {
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
  test('names present', () => {
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
  test('first event has priority 5', () => { expect(topEvents(null, 3)[0].priority).toBe(5); });
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
  test('funnelRate identified=1.0', () => { expect(partnershipTracker().funnelRate('identified')).toBe(1); });
  test('funnelRate signed=0', () => { expect(partnershipTracker().funnelRate('signed')).toBe(0); });
  test('touchpoints listed', () => { expect(partnershipTracker().touchpoints).toHaveLength(PARTNERS.length); });
  test('coldiretti stage surfaced', () => { expect(partnershipTracker().coldirettiStage).toBe('identified'); });
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
  test('target is 5 active robots', () => { expect(betaTesterPipeline().target).toBe(5); });
  test('5 testers recruited', () => { expect(betaTesterPipeline().recruited).toBe(5); });
  test('all applied initially -> active robots 0', () => {
    const p = betaTesterPipeline();
    expect(p.byStage.applied).toHaveLength(5);
    expect(p.activeRobots).toBe(0);
  });
  test('stages are the 5-step Castrocaro pipeline', () => {
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
  test('onboard all 5 -> active robots 5', () => {
    const onboarded = BETA_TESTERS.map(t => advanceTester(t, 'onboarded'));
    expect(betaTesterPipeline(onboarded).activeRobots).toBe(5);
    expect(betaTesterPipeline(onboarded).activeRobots).toBe(betaTesterPipeline(onboarded).target);
  });
});
describe('itLocaleKeys', () => {
  test('returns array of locale keys', () => {
    const k = itLocaleKeys();
    expect(Array.isArray(k)).toBe(true);
    expect(k.length).toBe(Object.keys(IT_LOCALE).length);
  });
});
describe('itTranslationCoverage', () => {
  test('complete for own keys', () => {
    const r = itTranslationCoverage(Object.keys(IT_LOCALE));
    expect(r.complete).toBe(true);
    expect(r.missing).toEqual([]);
  });
  test('reports missing keys', () => {
    const r = itTranslationCoverage(['it_adoption_title', 'a_missing_key']);
    expect(r.total).toBe(2); expect(r.present).toBe(1); expect(r.missing).toEqual(['a_missing_key']);
  });
});
describe('marketEntryPlan', () => {
  test('pilot region = Emilia-Romagna (Castrocaro)', () => {
    const p = marketEntryPlan();
    expect(p.pilotRegion).toBe('Emilia-Romagna');
    expect(p.entryStrategy).toBeTruthy();
  });
  test('topRegions is array', () => { expect(Array.isArray(marketEntryPlan().topRegions)).toBe(true); });
  test('expansion regions exclude pilot', () => {
    const p = marketEntryPlan();
    expect(p.expansionRegions).not.toContain(p.pilotRegion);
  });
});
describe('buildItalyAdoptionPlan', () => {
  test('end-to-end plan shapes', () => {
    const plan = buildItalyAdoptionPlan();
    expect(plan.regScore).toBeGreaterThanOrEqual(0);
    expect(plan.compliance).toHaveLength(Object.keys(REGULATORS).length);
    expect(plan.timeline).toHaveLength(EVENTS.length);
    expect(plan.topEvents).toHaveLength(3);
    expect(plan.partnerships.total).toBe(PARTNERS.length);
    expect(plan.betaTesters.target).toBe(5);
    expect(plan.itI18n.complete).toBe(true);
    expect(plan.marketEntry.pilotRegion).toBe('Emilia-Romagna');
    expect(typeof plan.gate).toBe('boolean');
  });
  test('gate true when regScore >= 60', () => {
    const plan = buildItalyAdoptionPlan();
    expect(plan.gate).toBe(plan.regScore >= 60);
  });
  test('respects injected fixtures', () => {
    const miniReg = { X: { name: 'X', sector: 'x', regClarity: 4, notes: '' } };
    const plan = buildItalyAdoptionPlan({ regulators: miniReg });
    expect(plan.regScore).toBe(80);
  });
});
