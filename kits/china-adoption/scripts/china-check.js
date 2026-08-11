'use strict';
const {
  overallRegScore, complianceChecklist, eventTimeline, partnershipTracker,
  betaTesterPipeline, communityManagerPipeline, zhTranslationCoverage, buildChinaAdoptionPlan,
} = require('../firmware/lib/chinadoption/chinadoption');
let f = 0;
function ok(l, c) { if (!c) f++; console.log('  [' + (c ? '\u2713' : '\u2717') + '] ' + l); }
console.log('China adoption kit :: cn:check');
const plan = buildChinaAdoptionPlan();
ok('reg score=' + plan.regScore + ' gate=' + plan.gate, plan.gate === true);
ok(complianceChecklist().length + ' regulators (PBoC/CAC/SAFE/MARA/MIIT)', complianceChecklist().length === 5);
ok(eventTimeline().length + ' events sorted', eventTimeline().length >= 4);
ok('top 3 events: ' + plan.topEvents.map(e => e.name).join(', '), plan.topEvents.length === 3);
ok(partnershipTracker().total + ' partners identified', partnershipTracker().total >= 2);
ok('DJI partner stage=' + partnershipTracker().djiStage, partnershipTracker().djiStage === 'identified');
ok('beta testers target=' + plan.betaTesters.target + ' recruited=' + plan.betaTesters.recruited, plan.betaTesters.target === 2 && plan.betaTesters.recruited === 2);
ok('CM pipeline next=' + communityManagerPipeline().nextPending, communityManagerPipeline().nextPending === 'recruiting');
ok('zh i18n coverage complete=' + plan.zhI18n.complete, plan.zhI18n.complete === true);
ok('pilot region=' + plan.marketEntry.pilotRegion, plan.marketEntry.pilotRegion === 'Shandong');
console.log(f === 0 ? '\n  China adoption check OK :: 0 step(s) failed' : '\n  FAILED :: ' + f + ' step(s)');
process.exit(f === 0 ? 0 : 1);
