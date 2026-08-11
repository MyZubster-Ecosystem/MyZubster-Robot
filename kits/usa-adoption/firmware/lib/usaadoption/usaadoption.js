'use strict';
// usaadoption.js -- pure-JS helpers for the USA adoption planner kit.
// Issue: MyZubster-Ecosystem/MyZubster-Robot #29 ("[USA] MyZubster adoption in United States").
const { REGULATORS, EVENTS, MARKET, PARTNERS } = require('./usadata');
// ---------- Regulatory readiness scoring ----------
function regulatorReadinessScore(code, regulators) {
  const table = regulators || REGULATORS;
  const key = Object.keys(table).find(k => k.toUpperCase() === String(code || '').toUpperCase());
  const r = key ? table[key] : undefined;
  if (!r) throw new RangeError('unknown regulator code: ' + code);
  return r.regClarity * 20;
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
      'Register with ' + table[code].name,
      'Submit compliance documentation',
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
  };
}
function advancePartner(partner, toStage) {
  const ti = STAGES.indexOf(toStage);
  if (ti < 0) throw new RangeError('unknown stage: ' + toStage);
  const ci = STAGES.indexOf(partner.stage);
  return Object.assign({}, partner, { stage: STAGES[Math.max(ti, ci)] });
}
// ---------- Community-manager pipeline ----------
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
// ---------- Market entry planner ----------
function marketEntryPlan(market) {
  const m = market || MARKET;
  return {
    marketValue: m.agriRoboticsValue,
    topStates: m.topStates,
    entryStrategy: m.entryStrategy,
    pilotState: m.topStates[2],
    expansionStates: m.topStates.slice(0, 2),
  };
}
// ---------- End-to-end USA adoption plan ----------
function buildUsaAdoptionPlan(options) {
  const regulators = (options && options.regulators) || REGULATORS;
  const events = (options && options.events) || EVENTS;
  const partners = (options && options.partners) || PARTNERS;
  const market = (options && options.market) || MARKET;
  return {
    regScore: overallRegScore(regulators),
    compliance: complianceChecklist(regulators),
    timeline: eventTimeline(events),
    topEvents: topEvents(events, 3),
    eventReach: eventReach(events),
    partnerships: partnershipTracker(partners),
    communityManager: communityManagerPipeline(),
    marketEntry: marketEntryPlan(market),
    gate: overallRegScore(regulators) >= 60,
  };
}
module.exports = {
  REGULATORS, EVENTS, MARKET, PARTNERS, STAGES, CM_STAGES,
  regulatorReadinessScore, overallRegScore, complianceChecklist,
  eventTimeline, topEvents, eventReach,
  partnershipTracker, advancePartner,
  communityManagerPipeline,
  marketEntryPlan,
  buildUsaAdoptionPlan,
};
