'use strict';
// regionalhubs.js -- pure-JS planner for the regional hub kit.
// Issue: MyZubster-Ecosystem/MyZubster-Robot #22 ("[Global] Create regional hubs for MyZubster").
const { HUBS, AMBASSADOR_STAGES } = require('./hubs');
// ---------- Hub readiness scoring ----------
function hubReadinessScore(code, hubs) {
  const table = hubs || HUBS;
  const h = table[String(code || '').toUpperCase()];
  if (!h) throw new RangeError('unknown hub code: ' + code);
  return Math.round((h.agriScore * 0.3 + h.moneroScore * 0.3 + h.launchReady * 0.4) / 5 * 100);
}
function rankHubs(hubs) {
  const table = hubs || HUBS;
  return Object.keys(table).map(code => ({ code, score: hubReadinessScore(code, table), name: table[code].name, region: table[code].region }))
    .sort((a, b) => b.score - a.score);
}
// ---------- 6-region launch timeline ----------
function launchTimeline(hubs) {
  const table = hubs || HUBS;
  return rankHubs(table).map((h, i) => ({ code: h.code, name: h.name, region: h.region, phase: i + 1, score: h.score }));
}
// ---------- Per-region hub-launch checklist ----------
function hubLaunchChecklist(code, hubs) {
  const table = hubs || HUBS;
  const h = table[String(code || '').toUpperCase()];
  if (!h) throw new RangeError('unknown hub code: ' + code);
  return {
    code: h.code, name: h.name, region: h.region, hq: h.hq,
    languageSupport: h.lang,
    eventFramework: ['Launch meetup', 'Quarterly community event', 'Annual hub summit'],
    farmerConnection: ['Local agri-association outreach', 'Beta tester recruitment (5 per hub)', 'Field demonstration event'],
    regulatoryAdaptation: ['Local crypto regulation briefing', 'KYC/AML compliance setup', 'Tax registration'],
    milestones: ['Ambassador onboarded', 'First event hosted', '5 beta testers active', 'First paid bounty completed'],
  };
}
function allHubChecklists(hubs) {
  const table = hubs || HUBS;
  return Object.keys(table).map(code => hubLaunchChecklist(code, table));
}
// ---------- Hub governance model ----------
function governanceModel() {
  return {
    ambassadorSelection: ['Application + network assessment', 'Trial event hosting', 'Community vote'],
    reportingCadence: { monthly: 'Activity + beta tester count', quarterly: 'Budget + impact report', annual: 'Hub summit + renewal' },
    milestoneStructure: ['Onboarded', 'First event', '5 beta testers', 'First paid bounty', 'Self-sustaining events'],
    fundingModel: 'XMR bounty per completed milestone (per-hub)',
  };
}
// ---------- Ambassador pipeline ----------
function ambassadorPipeline(stages) {
  const arr = Array.isArray(stages) && stages.length === AMBASSADOR_STAGES.length ? stages : [false, false, false, false, false];
  return {
    stages: AMBASSADOR_STAGES,
    obtained: arr,
    progressCount: arr.filter(Boolean).length,
    nextPending: AMBASSADOR_STAGES.find((s, i) => !arr[i]),
    complete: arr.every(Boolean),
  };
}
function advanceAmbassador(stages, toIndex) {
  const arr = Array.isArray(stages) ? [...stages] : [false, false, false, false, false];
  const ti = typeof toIndex === 'number' ? toIndex : AMBASSADOR_STAGES.indexOf(toIndex);
  if (ti < 0 || ti >= AMBASSADOR_STAGES.length) throw new RangeError('invalid stage index: ' + toIndex);
  for (let i = 0; i <= ti; i++) arr[i] = true;
  return arr;
}
// ---------- End-to-end hub plan ----------
function buildHubPlan(code, options) {
  const hubs = (options && options.hubs) || HUBS;
  const score = hubReadinessScore(code, hubs);
  return {
    hub: code,
    name: hubs[code] ? hubs[code].name : code,
    score,
    gate: score >= 60,
    launchChecklist: hubLaunchChecklist(code, hubs),
    governance: governanceModel(),
    ambassador: ambassadorPipeline(),
    timelinePosition: rankHubs(hubs).findIndex(h => h.code === String(code).toUpperCase()) + 1,
  };
}
module.exports = {
  HUBS, AMBASSADOR_STAGES,
  hubReadinessScore, rankHubs, launchTimeline,
  hubLaunchChecklist, allHubChecklists,
  governanceModel, ambassadorPipeline, advanceAmbassador,
  buildHubPlan,
};
