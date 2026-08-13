'use strict';
// hubs.js -- frozen regional hub table for issue #22
// MyZubster-Ecosystem/MyZubster-Robot #22 ("[Global] Create regional hubs for MyZubster").
const HUBS = Object.freeze({
  IT: Object.freeze({ code: 'IT', name: 'Italy (HQ)', region: 'Europe', hq: true, lang: ['it','en'], agriScore: 4, moneroScore: 5, launchReady: 5 }),
  US: Object.freeze({ code: 'US', name: 'United States', region: 'North America', hq: false, lang: ['en'], agriScore: 5, moneroScore: 3, launchReady: 4 }),
  SG: Object.freeze({ code: 'SG', name: 'Singapore', region: 'Asia-Pacific', hq: false, lang: ['en','zh'], agriScore: 3, moneroScore: 4, launchReady: 4 }),
  BR: Object.freeze({ code: 'BR', name: 'Brazil', region: 'Latin America', hq: false, lang: ['pt','es'], agriScore: 4, moneroScore: 3, launchReady: 3 }),
  AE: Object.freeze({ code: 'AE', name: 'UAE', region: 'Middle East', hq: false, lang: ['ar','en'], agriScore: 2, moneroScore: 3, launchReady: 3 }),
  ZA: Object.freeze({ code: 'ZA', name: 'South Africa', region: 'Africa', hq: false, lang: ['en','zu'], agriScore: 4, moneroScore: 3, launchReady: 3 }),
});
const AMBASSADOR_STAGES = Object.freeze(['recruiting', 'screening', 'interview', 'onboarded', 'active']);
module.exports = { HUBS, AMBASSADOR_STAGES };
