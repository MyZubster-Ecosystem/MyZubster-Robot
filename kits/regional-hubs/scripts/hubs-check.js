'use strict';
const { rankHubs, launchTimeline, allHubChecklists, governanceModel, buildHubPlan } = require('../firmware/lib/regionalhubs/regionalhubs');
let f = 0;
function ok(l, c) { if (!c) f++; console.log('  [' + (c ? '\u2713' : '\u2717') + '] ' + l); }
console.log('Regional hubs kit :: hubs:check');
ok('6 hubs scored + ranked (IT first)', rankHubs().length === 6 && rankHubs()[0].code === 'IT');
ok('6-region launch timeline phases 1-6', launchTimeline().map(h => h.phase).join(',') === '1,2,3,4,5,6');
ok(allHubChecklists().length + ' per-region checklists', allHubChecklists().length === 6);
ok('governance model has monthly+quarterly cadence', governanceModel().reportingCadence.monthly && governanceModel().reportingCadence.quarterly);
const itPlan = buildHubPlan('IT');
ok('IT-HQ plan gate=' + itPlan.gate + ' timeline position=' + itPlan.timelinePosition, itPlan.gate === true && itPlan.timelinePosition === 1);
const usPlan = buildHubPlan('US');
ok('US plan has governance + ambassador', usPlan.governance && usPlan.ambassador);
console.log(f === 0 ? '\n  Regional hubs check OK :: 0 step(s) failed' : '\n  FAILED :: ' + f + ' step(s)');
process.exit(f === 0 ? 0 : 1);
