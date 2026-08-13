'use strict';
// euexpansion.test.js -- deterministic jest tests for the EU expansion planner.
// No network, no live data, no Date.now(). Pure fixtures only.
const {
  countryReadinessScore, rankCountries, thresholdGate,
  eventTimeline, eventsByCountry, eventReach,
  milestoneStateMachine, milestoneSequence, phaseProgress,
  partnerOutreachTracker, advancePartner,
  i18nCoverage, i18nCompare,
  buildExpansionPlan, COUNTRIES, EVENTS, PARTNERS, PHASES, I18N_KEYS,
} = require('../euexpansion');

describe('countryReadinessScore', () => {
  test('IT scores highest (home base)', () => {
    expect(countryReadinessScore('IT')).toBeGreaterThan(75);
  });
  test('unknown country throws', () => {
    expect(() => countryReadinessScore('XX')).toThrow();
  });
  test('case-insensitive', () => {
    expect(countryReadinessScore('it')).toBe(countryReadinessScore('IT'));
  });
  test('score range 0-100', () => {
    for (const c of Object.keys(COUNTRIES)) {
      const s = countryReadinessScore(c);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});

describe('rankCountries', () => {
  test('returns all countries sorted by score desc', () => {
    const r = rankCountries();
    expect(r).toHaveLength(6);
    for (let i = 1; i < r.length; i++) expect(r[i-1].score).toBeGreaterThanOrEqual(r[i].score);
  });
  test('first entry is IT (home base, highest score)', () => {
    expect(rankCountries()[0].code).toBe('IT');
  });
});

describe('thresholdGate', () => {
  test('IT passes default threshold 60', () => { expect(thresholdGate('IT')).toBe(true); });
  test('custom threshold 90 only IT', () => {
    expect(thresholdGate('IT', COUNTRIES, 90)).toBe(true);
  });
  test('threshold 100 no country passes', () => {
    for (const c of Object.keys(COUNTRIES)) expect(thresholdGate(c, COUNTRIES, 100)).toBe(false);
  });
});

describe('eventTimeline', () => {
  test('sorted by month asc then priority desc', () => {
    const tl = eventTimeline();
    expect(tl[0].month).toBeLessThanOrEqual(tl[tl.length - 1].month);
  });
  test('includes all events', () => {
    expect(eventTimeline()).toHaveLength(EVENTS.length);
  });
});

describe('eventsByCountry', () => {
  test('FR has Paris Blockchain Week', () => {
    const fr = eventsByCountry('FR');
    expect(fr.some(e => e.id === 'pbw2026')).toBe(true);
  });
  test('country with 0 events returns empty', () => {
    expect(eventsByCountry('UK')).toHaveLength(0);
  });
});

describe('eventReach', () => {
  test('event count and country count sum', () => {
    const r = eventReach();
    expect(r.eventCount).toBe(EVENTS.length);
    expect(r.countryCount).toBeGreaterThan(0);
    expect(r.countryCount).toBeLessThanOrEqual(EVENTS.length);
  });
});

describe('milestoneStateMachine', () => {
  test('SURVEY transitions to REGULATE', () => {
    expect(milestoneStateMachine('SURVEY').next).toBe('REGULATE');
  });
  test('SCALE is terminal', () => {
    expect(milestoneStateMachine('SCALE').terminal).toBe(true);
    expect(milestoneStateMachine('SCALE').next).toBe(null);
  });
  test('unknown phase throws', () => {
    expect(() => milestoneStateMachine('TAXI')).toThrow();
  });
});

describe('milestoneSequence', () => {
  test('full sequence has 5 phases', () => {
    expect(milestoneSequence('SURVEY')).toHaveLength(5);
  });
  test('default from starts at SURVEY', () => {
    expect(milestoneSequence()[0].phase).toBe('SURVEY');
  });
  test('sequence covers all phases in order', () => {
    const seq = milestoneSequence('SURVEY');
    expect(seq.map(s => s.phase)).toEqual([...PHASES]);
  });
});

describe('phaseProgress', () => {
  test('empty certs => nextPending=first phase', () => {
    expect(phaseProgress([]).nextPending).toBe('SURVEY');
  });
  test('all true => complete', () => {
    expect(phaseProgress([true, true, true, true, true]).complete).toBe(true);
  });
  test('partial certs => not complete', () => {
    expect(phaseProgress([true, false]).complete).toBe(false);
  });
});

describe('partnerOutreachTracker', () => {
  test('all identified stage initially', () => {
    const t = partnerOutreachTracker();
    expect(t.total).toBe(PARTNERS.length);
    expect(t.byStage.identified).toHaveLength(PARTNERS.length);
  });
  test('funnelRate identified=1.0', () => {
    expect(partnerOutreachTracker().funnelRate('identified')).toBe(1);
  });
  test('funnelRate signed=0 initially', () => {
    expect(partnerOutreachTracker().funnelRate('signed')).toBe(0);
  });
  test('partial funnel outreach', () => {
    const partial = PARTNERS.map((p, i) => i < 2 ? { ...p, stage: 'contacted' } : p);
    expect(partnerOutreachTracker(partial).funnelRate('contacted')).toBe(0.4);
  });
});

describe('advancePartner', () => {
  test('identified -> contacted', () => {
    const p = advancePartner(PARTNERS[0], 'contacted');
    expect(p.stage).toBe('contacted');
  });
  test('cannot regress stage', () => {
    const engaged = { ...PARTNERS[0], stage: 'engaged' };
    expect(advancePartner(engaged, 'identified').stage).toBe('engaged');
  });
  test('unknown stage throws', () => {
    expect(() => advancePartner(PARTNERS[0], 'taco')).toThrow();
  });
});

describe('i18nCoverage', () => {
  test('fr locale fully covered', () => {
    const c = i18nCoverage('fr');
    expect(c.covered).toBe(I18N_KEYS.length);
    expect(c.missing).toHaveLength(0);
  });
  test('de locale fully covered', () => {
    const c = i18nCoverage('de');
    expect(c.missing).toHaveLength(0);
  });
  test('es locale fully covered', () => {
    const c = i18nCoverage('es');
    expect(c.missing).toHaveLength(0);
  });
  test('unknown locale throws', () => {
    expect(() => i18nCoverage('xx')).toThrow();
  });
});

describe('i18nCompare', () => {
  test('fr and de parity', () => {
    expect(i18nCompare('fr', 'de').parity).toBe(true);
  });
  test('fr and es parity', () => {
    expect(i18nCompare('fr', 'es').parity).toBe(true);
  });
});

describe('buildExpansionPlan (end-to-end)', () => {
  test('IT plan gate passes', () => {
    const plan = buildExpansionPlan('IT');
    expect(plan.gate).toBe(true);
    expect(plan.country).toBe('IT');
  });
  test('plan includes timeline and milestones', () => {
    const plan = buildExpansionPlan('DE');
    expect(plan.milestones).toHaveLength(5);
    expect(plan.readinessScore).toBeGreaterThan(0);
  });
  test('IT plan includes partner outreach (home base)', () => {
    const plan = buildExpansionPlan('IT');
    expect(plan.partnerOutreach.total).toBeGreaterThan(0);
  });
});
