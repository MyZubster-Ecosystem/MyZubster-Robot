# Robot Knowledge Transfer

Issue #84 asks for a way for older robots to pass useful knowledge to younger
robots. This implementation keeps the feature dependency-free so it can be used
by the robot gateway, firmware tooling, or future dashboards without requiring a
database first.

## What Is Included

- A structured robot memory format with `robotId`, `generation`, `parentIds`,
  profile data, lineage, and categorized knowledge.
- Knowledge categories for best practices, terrain maps, energy techniques,
  irrigation strategies, dispute experiences, and completed jobs.
- Parent-to-child transfer with confidence filtering, per-category limits,
  duplicate handling, inherited source tracking, and transfer reports.
- Memory updates for newly learned job/dispute/terrain/strategy entries.
- Multi-generation lineage summaries for mother, child, and grandchild robot
  chains.

## API Surface

```js
const {
  createRobotMemory,
  transferKnowledge,
  recordExperience,
  summarizeKnowledge,
  buildLineageSummary
} = require("./src/robotKnowledgeMemory");
```

### Create A Parent Memory

```js
const mother = createRobotMemory({
  robotId: "mother-01",
  generation: 0,
  role: "mother",
  bestPractices: [
    {
      id: "safe-mow",
      title: "Confirm mower blade lock before job",
      confidence: 0.9,
      successRate: 0.95,
      tags: ["safety", "mower"]
    }
  ]
});
```

### Transfer To A Child

```js
const { childMemory, transferReport } = transferKnowledge([mother], {
  robotId: "child-01",
  role: "worker"
}, {
  minConfidence: 0.5,
  categoryLimits: { bestPractices: 3, terrainMaps: 2 }
});
```

The child memory stores inherited entries with source metadata, while the report
shows inherited counts and parent contribution. That gives reviewers and future
robots a deterministic audit trail for where each piece of knowledge came from.

## Validation

Run:

```bash
node --test test/robotKnowledgeMemory.test.js
node --check src/robotKnowledgeMemory.js
node --check test/robotKnowledgeMemory.test.js
git diff --check
```

The tests cover memory formatting, inheritance, category limits, immutable
experience recording, and lineage summaries across three generations.
