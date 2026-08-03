'use strict';
// `npm run genealogy:check` - renders the Dashboard component server-side to
// static markup against the sample-lineage fixture and prints a deterministic
// family summary. No network, no wallet signing. Mirrors the #79 dna:check pattern.
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Dashboard = require('../src/ui/Dashboard');
const api = require('../src/api/genealogy');
const { RECORDS } = require('../src/data/sample-lineage');

console.log('MyZubster Robot Genealogy Dashboard Kit - fixture check (issue #82)');
console.log('='.repeat(64));

// 1. Print the family metrics (count / jobs / fee / active).
const metrics = api.getMetrics(RECORDS);
console.log('Metrics: robots=' + metrics.totalRobots
  + ' jobs=' + metrics.totalJobs
  + ' fee=' + metrics.totalFee.toFixed(6)
  + ' active=' + metrics.activeCount);

// 2. Print the genealogy tree (rootIds / children map).
const tree = api.getGenealogyTree(RECORDS);
console.log('');
console.log('Genealogy tree (rootIds / children map):');
console.log('  rootIds=' + JSON.stringify(tree.rootIds));
for (const id of Object.keys(tree.nodes)) {
  console.log('  ' + id + ' -> [' + tree.nodes[id].join(', ') + ']');
}

// 3. Print a depth-first lineage summary.
console.log('');
console.log('Lineage summary (depth-first, deterministic):');
function walk(rootId, nodes, depth) {
  const pad = '  '.repeat(depth);
  const kids = nodes[rootId] || [];
  console.log(pad + '- ' + rootId + ' (depth=' + depth + ', children=' + kids.length + ')');
  for (const cid of kids) walk(cid, nodes, depth + 1);
}
for (const rid of tree.rootIds) walk(rid, tree.nodes, 0);

// 4. Server-render the Dashboard to static markup (the "visualizzare" deliverable).
console.log('');
const markup = ReactDOMServer.renderToStaticMarkup(
  React.createElement(Dashboard, { records: RECORDS })
);
const hasTitle = markup.indexOf('genealogy dashboard') >= 0;
const hasMother = markup.indexOf('mother-0') >= 0;
const hasGrandchild = markup.indexOf('grandchild-1') >= 0;
const hasMetrics = markup.indexOf('metric-total-robots') >= 0 || markup.indexOf('robots') >= 0;
console.log('Server-rendered dashboard markup length=' + markup.length);
console.log('  contains title: ' + hasTitle);
console.log('  contains mother-0: ' + hasMother);
console.log('  contains grandchild-1: ' + hasGrandchild);

// 5. Sanity invariants.
const ok =
  metrics.totalRobots === 3 &&
  metrics.totalJobs === 30 &&
  Math.abs(metrics.totalFee - 0.0012) < 1e-9 &&
  metrics.activeCount === 2 &&
  tree.rootIds.length === 1 && tree.rootIds[0] === 'mother-0' &&
  tree.nodes['mother-0'].join() === 'child-1' &&
  tree.nodes['child-1'].join() === 'grandchild-1' &&
  hasTitle && hasMother && hasGrandchild;

console.log('');
if (!ok) {
  console.error('FAIL: genealogy fixture invariants not satisfied');
  process.exit(1);
}
console.log('PASS - genealogy dashboard renders the 3-generation lineage + metrics deterministically (issue #82: dashboard genealogico robot)');
process.exit(0);
