'use strict';
// `npm run dna:check` - runs the DNA inheritance + mutation + genealogy helpers across
// a sample mother -> child -> grandchild lineage and prints a deterministic lineage
// summary. No network, local reads only.
const dna = require('../firmware/lib/dna/dna');

// 1. Mother robot: an irrigator kit that has already learned drip scheduling.
const mother = dna.createDNA({
  id: 'mother-0',
  robotType: 'agri',
  reputation: 75,
  jobsCompleted: 30,
  hardwareConfig: { mcu: 'esp32', sensor: 'capacitive-moisture', valve: 'solenoid' },
  walletAddress: '4B3v-INFORMATIONAL-PARENT',
  skills: [{ skill: 'irrigate', level: 60 }, { skill: 'soil-sense', level: 70 }],
  genealogy: { parentRef: null, generation: 0 },
});

// 2. Child robot: inherits from mother, picks up the irrigate skill and adds 'sense'.
const child = dna.inheritance(mother, {
  id: 'child-1',
  skills: [{ skill: 'irrigate', level: 15 }, { skill: 'fast-charge', level: 50 }],
  hardwareConfig: { sensor: 'capacitive-moisture-v2' },
});

// 3. Grandchild robot: the child's child, with a mutation applied.
const rawGrandchild = dna.inheritance(child, { id: 'grandchild-1' });
const grandchild = dna.mutate(rawGrandchild, {
  skill: 'irrigate',
  levelDelta: 25,
  learningLesson: 'learned rain-aware drip scheduling from soil sensor',
  hardwareOverride: { moistureSensor: 'capacitive-v3' },
});

console.log('MyZubster Robot DNA Kit - 3-generation lineage check (issue #79)');
console.log('=' .repeat(64));
console.log('Mother  : id=' + mother.id + ' gen=' + mother.genealogy.generation + ' type=' + mother.robotType
  + ' skills=' + JSON.stringify(mother.skills.map(s => s.skill + ':' + s.level))
  + ' reputation=' + mother.reputation + ' jobs=' + mother.jobsCompleted
  + ' wallet(informational)=' + mother.walletAddress);
console.log('Child   : id=' + child.id + ' gen=' + child.genealogy.generation + ' parentRef=' + child.genealogy.parentRef
  + ' type=' + child.robotType
  + ' skills=' + JSON.stringify(child.skills.map(s => s.skill + ':' + s.level))
  + ' reputation=' + child.reputation + ' jobs=' + child.jobsCompleted
  + ' wallet(inherited-literally)=' + child.walletAddress);
console.log('Grandchild: id=' + grandchild.id + ' gen=' + grandchild.genealogy.generation + ' parentRef=' + grandchild.genealogy.parentRef
  + ' skills=' + JSON.stringify(grandchild.skills.map(s => s.skill + ':' + s.level))
  + ' learningLog=' + JSON.stringify(grandchild.learningLog.map(l => l.lesson)));

console.log('');
console.log('Genealogy tree (rootIds / children map):');
const tree = dna.genealogyTree([mother, child, grandchild]);
console.log('  rootIds=' + JSON.stringify(tree.rootIds));
for (const [id, children] of tree.nodes) {
  console.log('  ' + id + ' -> [' + children.join(', ') + ']');
}

console.log('');
console.log('Genealogy summary (depth-first, deterministic):');
for (const row of dna.genealogySummary([mother, child, grandchild])) {
  const pad = '  '.repeat(row.depth);
  console.log(pad + '- ' + row.id + ' (gen=' + row.generation + ', depth=' + row.depth + ', children=' + row.children + ')');
}

console.log('');
// Sanity invariants:
const ok =
  tree.rootIds.length === 1 && tree.rootIds[0] === 'mother-0' &&
  child.genealogy.parentRef === 'mother-0' && child.genealogy.generation === 1 &&
  grandchild.genealogy.parentRef === 'child-1' && grandchild.genealogy.generation === 2 &&
  child.walletAddress === mother.walletAddress && // wallet inherited literally, no generation
  child.reputation === 0 && grandchild.reputation === 0 && // fresh robots
  grandchild.skills.find(s => s.skill === 'irrigate').level === 60 + 15 + 25; // chain 60 -> +15 child -> +25 mutation

if (!ok) {
  console.error('FAIL: lineage invariants not satisfied');
  process.exit(1);
}
console.log('PASS - 3-generation lineage: inheritance + mutation + genealogy tree deterministically correct (issue #79: eredita del DNA robotico)');
