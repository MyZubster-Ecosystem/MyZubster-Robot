'use strict';
const {
  overallRegScore, complianceChecklist, eventTimeline, partnershipTracker,
  communityManagerPipeline, marketEntryPlan, buildUsaAdoptionPlan,
} = require('../firmware/lib/usaadoption/usaadoption');
let f = 0;
function ok(l, c) { if (!c) f++; console.log('  [' + (c ? '\u2713' : '\u2717') + '] ' + l); }
console.log('USA adoption kit :: usa:check');
const plan = buildUsaAdoptionPlan();
ok('reg score=' + plan.regScore + ' gate=' + plan.gate, plan.gate === true);
ok(complianceChecklist().length + ' regulators (SEC/CFTC/IRS/FinCEN)', complianceChecklist().length === 4);
ok(eventTimeline().length + ' events sorted', eventTimeline().length >= 4);
ok('top 3 events: ' + plan.topEvents.map(e => e.name).join(', '), plan.topEvents.length === 3);
ok(partnershipTracker().total + ' partners identified', partnershipTracker().total >= 3);
ok('CM pipeline next=' + communityManagerPipeline().nextPending, communityManagerPipeline().nextPending === 'recruiting');
ok('pilot state=' + marketEntryPlan().pilotState, !!marketEntryPlan().pilotState);
console.log(f === 0 ? '\n  USA adoption check OK :: 0 step(s) failed' : '\n  FAILED :: ' + f + ' step(s)');
process.exit(f === 0 ? 0 : 1);
