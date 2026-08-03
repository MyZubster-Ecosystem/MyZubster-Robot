'use strict';
// Deterministic genealogy fixture derived from the #79 dna:check scenario so the
// dashboard ships with "real" data (task: Testare con dati reali). The records mirror
// exactly the mother -> child -> grandchild lineage produced by the #79 dna.js helpers,
// not a mock generator: the same shape a fleet telemetry feed would deliver.

// Sample robot records (matches kits/myzubster-dna-kit scripts/dna-check.js output).
// `fee` and `status` are dashboard-side metrics drawn from the genealogy record - no
// wallet lookup, no signing (see docs/dashboard-architecture.md).
const RECORDS = [
  {
    id: 'mother-0',
    robotType: 'agri',
    generation: 0,
    reputation: 75,
    jobsCompleted: 30,
    fee: 0.0012,
    status: 'active',
    skills: [{ skill: 'irrigate', level: 60 }, { skill: 'soil-sense', level: 70 }],
    walletAddress: '4B3v-INFORMATIONAL-PARENT',
    genealogy: { parentRef: null, generation: 0 },
  },
  {
    id: 'child-1',
    robotType: 'agri',
    generation: 1,
    reputation: 0,
    jobsCompleted: 0,
    fee: 0,
    status: 'idle',
    skills: [
      { skill: 'irrigate', level: 75 },
      { skill: 'soil-sense', level: 70 },
      { skill: 'fast-charge', level: 50 },
    ],
    walletAddress: '4B3v-INFORMATIONAL-PARENT',
    genealogy: { parentRef: 'mother-0', generation: 1 },
  },
  {
    id: 'grandchild-1',
    robotType: 'agri',
    generation: 2,
    reputation: 0,
    jobsCompleted: 0,
    fee: 0,
    status: 'learning',
    skills: [
      { skill: 'irrigate', level: 100 },
      { skill: 'soil-sense', level: 70 },
      { skill: 'fast-charge', level: 50 },
    ],
    walletAddress: '4B3v-INFORMATIONAL-PARENT',
    genealogy: { parentRef: 'child-1', generation: 2 },
  },
];

module.exports = { RECORDS };
