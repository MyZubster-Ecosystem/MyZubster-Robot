'use strict';
const {
  hubReadinessScore, rankHubs, launchTimeline, hubLaunchChecklist, allHubChecklists,
  governanceModel, ambassadorPipeline, advanceAmbassador, buildHubPlan, HUBS, AMBASSADOR_STAGES,
} = require('../regionalhubs');

describe('hubReadinessScore', () => {
  test('IT scores highest (HQ)', () => { expect(hubReadinessScore('IT')).toBeGreaterThan(80); });
  test('unknown throws', () => { expect(() => hubReadinessScore('XX')).toThrow(); });
  test('case-insensitive', () => { expect(hubReadinessScore('it')).toBe(hubReadinessScore('IT')); });
  test('all 0-100', () => { for (const c of Object.keys(HUBS)) { const s = hubReadinessScore(c); expect(s).toBeGreaterThanOrEqual(0); expect(s).toBeLessThanOrEqual(100); } });
});
describe('rankHubs', () => {
  test('returns 6 hubs sorted', () => { const r = rankHubs(); expect(r).toHaveLength(6); for (let i = 1; i < r.length; i++) expect(r[i-1].score).toBeGreaterThanOrEqual(r[i].score); });
  test('IT first (HQ)', () => { expect(rankHubs()[0].code).toBe('IT'); });
});
describe('launchTimeline', () => {
  test('6 phases numbered 1-6', () => { const tl = launchTimeline(); expect(tl).toHaveLength(6); expect(tl.map(h => h.phase)).toEqual([1,2,3,4,5,6]); });
  test('IT is phase 1', () => { expect(launchTimeline()[0].code).toBe('IT'); });
});
describe('hubLaunchChecklist', () => {
  test('IT has language support', () => { const c = hubLaunchChecklist('IT'); expect(c.languageSupport).toContain('en'); expect(c.hq).toBe(true); });
  test('US is not HQ', () => { expect(hubLaunchChecklist('US').hq).toBe(false); });
  test('has milestones', () => { expect(hubLaunchChecklist('SG').milestones.length).toBeGreaterThan(0); });
  test('unknown throws', () => { expect(() => hubLaunchChecklist('XX')).toThrow(); });
});
describe('allHubChecklists', () => {
  test('returns 6 checklists', () => { expect(allHubChecklists()).toHaveLength(6); });
});
describe('governanceModel', () => {
  test('has reporting cadence', () => { const g = governanceModel(); expect(g.reportingCadence).toHaveProperty('monthly'); expect(g.reportingCadence).toHaveProperty('quarterly'); });
  test('has funding model', () => { expect(governanceModel().fundingModel).toContain('XMR'); });
  test('has milestone structure', () => { expect(governanceModel().milestoneStructure.length).toBeGreaterThan(0); });
});
describe('ambassadorPipeline', () => {
  test('empty -> nextPending=first', () => { expect(ambassadorPipeline().nextPending).toBe('recruiting'); });
  test('all true -> complete', () => { expect(ambassadorPipeline([true,true,true,true,true]).complete).toBe(true); });
  test('partial progress', () => { expect(ambassadorPipeline([true,false,false,false,false]).progressCount).toBe(1); });
});
describe('advanceAmbassador', () => {
  test('advance to interview (index 2)', () => { const r = advanceAmbassador([false,false,false,false,false], 2); expect(r[2]).toBe(true); expect(r[0]).toBe(true); expect(r[3]).toBe(false); });
  test('string stage name', () => { const r = advanceAmbassador([false,false,false,false,false], 'interview'); expect(r[2]).toBe(true); });
  test('invalid throws', () => { expect(() => advanceAmbassador([], 99)).toThrow(); });
});
describe('buildHubPlan', () => {
  test('IT gate passes', () => { const p = buildHubPlan('IT'); expect(p.gate).toBe(true); expect(p.timelinePosition).toBe(1); });
  test('plan has governance + ambassador', () => { const p = buildHubPlan('US'); expect(p.governance).toBeDefined(); expect(p.ambassador).toBeDefined(); });
  test('plan has checklist', () => { const p = buildHubPlan('SG'); expect(p.launchChecklist).toBeDefined(); expect(p.launchChecklist.milestones.length).toBeGreaterThan(0); });
});
