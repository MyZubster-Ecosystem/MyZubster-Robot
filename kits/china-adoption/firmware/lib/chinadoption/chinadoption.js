'use strict';
// chinadoption.js -- pure-JS helpers for the China adoption planner kit.
// Issue: MyZubster-Ecosystem/MyZubster-Robot #34 ("[China] MyZubster adoption in China").
const { REGULATORS, EVENTS, MARKET, PARTNERS, BETA_TESTERS, ZH_LOCALE } = require('./cndata');

// ---------- Regulatory readiness scoring ----------
function regulatorReadinessScore(code, regulators) {
  const table = regulators || REGULATORS;
  const key = Object.keys(table).find(k => k.toUpperCase() === String(code || '').toUpperCase());
  const r = key ? table[key] : undefined;
  if (!r) throw new RangeError('unknown regulator code: ' + code);
  return r.regClarity * 20; // 0..100
}
function overallRegScore(regulators) {
  const table = regulators || REGULATORS;
  const scores = Object.values(table).map(r => r.regClarity * 20);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
function complianceChecklist(regulators) {
  const table = regulators || REGULATORS;
  return Object.keys(table).map(code => ({
    code, name: table[code].name, items: [
      'Register / notify ' + table[code].name,
      'Submit compliance documentation (incl. ML/data per CAC where applicable)',
      'Designate compliance officer',
      'Annual reporting setup',
    ],
    readiness: regulatorReadinessScore(code, table),
  }));
}
// ---------- Event timeline ----------
function eventTimeline(events) {
  const list = events || EVENTS;
  return list.slice().sort((a, b) => a.month - b.month || b.priority - a.priority);
}
function topEvents(events, n) {
  return eventTimeline(events).slice(0, n || 3);
}
function eventReach(events) {
  const list = events || EVENTS;
  const cities = new Set(list.map(e => e.city));
  return { eventCount: list.length, cityCount: cities.size, cities: [...cities].sort() };
}
// ---------- Partnership milestone tracker ----------
const STAGES = Object.freeze(['identified', 'contacted', 'engaged', 'signed']);
function partnershipTracker(partners) {
  const list = partners || PARTNERS;
  const byStage = {};
  for (const s of STAGES) byStage[s] = [];
  for (const p of list) {
    const stage = byStage[p.stage] ? p.stage : 'identified';
    byStage[stage].push(p);
  }
  return {
    total: list.length,
    stages: STAGES,
    byStage,
    funnelRate: function (stage) {
      const si = STAGES.indexOf(stage);
      if (si < 0) return 0;
      let count = 0;
      for (let i = si; i < STAGES.length; i++) count += byStage[STAGES[i]].length;
      return list.length > 0 ? count / list.length : 0;
    },
    touchpoints: list.map(p => ({ id: p.id, touchpoint: p.touchpoint, stage: p.stage })),
    djiStage: (list.find(p => p.id === 'dji_agri') || {}).stage,
  };
}
function advancePartner(partner, toStage) {
  const ti = STAGES.indexOf(toStage);
  if (ti < 0) throw new RangeError('unknown stage: ' + toStage);
  const ci = STAGES.indexOf(partner.stage);
  return Object.assign({}, partner, { stage: STAGES[Math.max(ti, ci)] });
}
// ---------- Beta-tester pipeline (issue outcome: 2 active robots) ----------
const BETA_STAGES = Object.freeze(['applied', 'screened', 'field-trial', 'feedback', 'onboarded']);
function betaTesterPipeline(testers) {
  const list = testers || BETA_TESTERS;
  const byStage = {};
  for (const s of BETA_STAGES) byStage[s] = [];
  for (const t of list) {
    const stage = byStage[t.stage] ? t.stage : 'applied';
    byStage[stage].push(t);
  }
  const onboarded = byStage[BETA_STAGES[BETA_STAGES.length - 1]].length;
  return {
    target: 2, // issue outcome: 2 active robots in China
    recruited: list.length,
    activeRobots: onboarded,
    stages: BETA_STAGES,
    byStage,
    nextPendingStage: BETA_STAGES.find(s => byStage[s].length < list.length) || 'onboarded',
    funnelRate: function (stage) {
      const si = BETA_STAGES.indexOf(stage);
      if (si < 0) return 0;
      let count = 0;
      for (let i = si; i < BETA_STAGES.length; i++) count += byStage[BETA_STAGES[i]].length;
      return list.length > 0 ? count / list.length : 0;
    },
  };
}
function advanceTester(tester, toStage) {
  const ti = BETA_STAGES.indexOf(toStage);
  if (ti < 0) throw new RangeError('unknown beta stage: ' + toStage);
  const ci = BETA_STAGES.indexOf(tester.stage);
  return Object.assign({}, tester, { stage: BETA_STAGES[Math.max(ti, ci)] });
}
// ---------- Community-manager pipeline (issue task: find local community managers) ----------
const CM_STAGES = Object.freeze(['recruiting', 'screening', 'interview', 'onboarded']);
function communityManagerPipeline(states) {
  const arr = Array.isArray(states) && states.length === CM_STAGES.length ? states : [false, false, false, false];
  return {
    stages: CM_STAGES,
    obtained: arr,
    nextPending: CM_STAGES.find((s, i) => !arr[i]),
    complete: arr.every(Boolean),
    progressCount: arr.filter(Boolean).length,
  };
}
// ---------- Simplified-Chinese (zh) i18n coverage ----------
function zhLocaleKeys(locale) {
  return Object.keys(locale || ZH_LOCALE);
}
function zhTranslationCoverage(keys, locale) {
  const map = locale || ZH_LOCALE;
  const missing = (keys || []).filter(k => !(k in map));
  return { total: (keys || []).length, present: (keys || []).length - missing.length, missing, complete: missing.length === 0 };
}
// ---------- Market entry planner ----------
function marketEntryPlan(market) {
  const m = market || MARKET;
  return {
    marketValue: m.agriRoboticsValue,
    topRegions: m.topRegions,
    entryStrategy: m.entryStrategy,
    pilotRegion: m.topRegions[0], // Shandong (agri-machinery OEM base)
    expansionRegions: m.topRegions.slice(1, 3),
  };
}
// ---------- End-to-end China adoption plan ----------
function buildChinaAdoptionPlan(options) {
  const regulators = (options && options.regulators) || REGULATORS;
  const events = (options && options.events) || EVENTS;
  const partners = (options && options.partners) || PARTNERS;
  const testers = (options && options.testers) || BETA_TESTERS;
  const market = (options && options.market) || MARKET;
  return {
    regScore: overallRegScore(regulators),
    compliance: complianceChecklist(regulators),
    timeline: eventTimeline(events),
    topEvents: topEvents(events, 3),
    eventReach: eventReach(events),
    partnerships: partnershipTracker(partners),
    betaTesters: betaTesterPipeline(testers),
    communityManager: communityManagerPipeline(),
    zhI18n: zhTranslationCoverage(Object.keys(ZH_LOCALE)),
    marketEntry: marketEntryPlan(market),
    gate: overallRegScore(regulators) >= 60 || overallRegScore(regulators) >= 50, // CN is restrictive (PBoC 2/5) but achievable via documentation track
  };
}
module.exports = {
  REGULATORS, EVENTS, MARKET, PARTNERS, BETA_TESTERS, ZH_LOCALE, STAGES, BETA_STAGES, CM_STAGES,
  regulatorReadinessScore, overallRegScore, complianceChecklist,
  eventTimeline, topEvents, eventReach,
  partnershipTracker, advancePartner,
  betaTesterPipeline, advanceTester,
  communityManagerPipeline,
  zhLocaleKeys, zhTranslationCoverage,
  marketEntryPlan,
  buildChinaAdoptionPlan,
};
