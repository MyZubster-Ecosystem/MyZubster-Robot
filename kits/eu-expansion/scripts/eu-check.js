'use strict';
// eu-check.js -- headless CLI simulation for the EU expansion planner kit.
// Run: npm run eu:check  (no network, no side effects, exits 0 on success)
const {
  countryReadinessScore, rankCountries, eventTimeline, milestoneSequence,
  partnerOutreachTracker, i18nCoverage, buildExpansionPlan, COUNTRIES,
} = require('../firmware/lib/euexpansion/euexpansion');

let failures = 0;
function ok(label, cond) {
  const mark = cond ? '\u2713' : '\u2717';
  if (!cond) failures++;
  console.log('  [' + mark + '] ' + label);
}

console.log('EU expansion kit :: eu:check');

console.log('  - country readiness ranking:');
const ranked = rankCountries();
ok('6 countries scored', ranked.length === 6);
ok('IT ranks first (home base)', ranked[0].code === 'IT');
ok('all scores 0-100', ranked.every(r => r.score >= 0 && r.score <= 100));

console.log('  - event timeline:');
const tl = eventTimeline();
ok(tl.length + ' events across EU', tl.length >= 4);
ok('timeline sorted by month', tl[0].month <= tl[tl.length - 1].month);

console.log('  - milestone sequence (5-phase expansion state machine):');
const seq = milestoneSequence('SURVEY');
ok('5 phases: SURVEY->REGULATE->LOCALIZE->LAUNCH->SCALE',
  seq.map(s => s.phase).join('->') === 'SURVEY->REGULATE->LOCALIZE->LAUNCH->SCALE');

console.log('  - partner outreach funnel:');
const po = partnerOutreachTracker();
ok(po.total + ' agri-robotics partners identified', po.total >= 4);
ok('all in identified stage initially', po.byStage.identified.length === po.total);

console.log('  - i18n fr/de/es locale coverage:');
ok('fr ' + i18nCoverage('fr').covered + ' keys fully covered', i18nCoverage('fr').missing.length === 0);
ok('de ' + i18nCoverage('de').covered + ' keys fully covered', i18nCoverage('de').missing.length === 0);
ok('es ' + i18nCoverage('es').covered + ' keys fully covered', i18nCoverage('es').missing.length === 0);

console.log('  - end-to-end expansion plan (IT-HQ):');
const plan = buildExpansionPlan('IT');
ok('IT readiness score=' + plan.readinessScore + ' gate=' + plan.gate, plan.gate === true);
ok('plan includes milestones + outreach', plan.milestones.length === 5 && plan.partnerOutreach.total > 0);

console.log(failures === 0
  ? '\n  EU expansion check OK :: 0 step(s) failed'
  : '\n  EU expansion check FAILED :: ' + failures + ' step(s) failed');
process.exit(failures === 0 ? 0 : 1);
