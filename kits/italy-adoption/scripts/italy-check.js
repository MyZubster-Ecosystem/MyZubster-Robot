'use strict';
const {
  overallRegScore, complianceChecklist, eventTimeline, partnershipTracker,
  betaTesterPipeline, buildItalyAdoptionPlan,
} = require('../firmware/lib/italyadoption/italyadoption');
let f = 0;
function ok(l, c) { if (!c) f++; console.log('  [' + (c ? '\u2713' : '\u2717') + '] ' + l); }
console.log('Italy adoption kit :: it:check');
const plan = buildItalyAdoptionPlan();
ok('reg score=' + plan.regScore + ' gate=' + plan.gate, plan.gate === true);
ok(complianceChecklist().length + ' regulators (BDI/CONSOB/Garante Privacy/MIPAAF)', complianceChecklist().length === 4);
ok(eventTimeline().length + ' events sorted', eventTimeline().length >= 4);
ok('top 3 events: ' + plan.topEvents.map(e => e.name).join(', '), plan.topEvents.length === 3);
ok(partnershipTracker().total + ' partners identified', partnershipTracker().total >= 2);
ok('Coldiretti partner stage=' + partnershipTracker().coldirettiStage, partnershipTracker().coldirettiStage === 'identified');
ok('beta testers target=' + plan.betaTesters.target + ' recruited=' + plan.betaTesters.recruited, plan.betaTesters.target === 5 && plan.betaTesters.recruited === 5);
ok('it i18n coverage complete=' + plan.itI18n.complete, plan.itI18n.complete === true);
ok('pilot region=' + plan.marketEntry.pilotRegion, plan.marketEntry.pilotRegion === 'Emilia-Romagna');
console.log(f === 0 ? '\n  Italy adoption check OK :: 0 step(s) failed' : '\n  FAILED :: ' + f + ' step(s)');
process.exit(f === 0 ? 0 : 1);
