"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildLineageSummary,
  createRobotMemory,
  recordExperience,
  summarizeKnowledge,
  transferKnowledge
} = require("../src/robotKnowledgeMemory");

test("creates a structured robot memory format", () => {
  const memory = createRobotMemory({
    robotId: "mother-01",
    generation: 0,
    role: "mother",
    bestPractices: [
      {
        title: "Confirm mower blade lock before job",
        confidence: 0.9,
        successRate: 0.95,
        tags: ["safety", "mower"]
      }
    ],
    terrainMaps: [
      {
        id: "garden-north",
        title: "North garden slope",
        confidence: 0.8,
        tags: ["map"]
      }
    ]
  });

  assert.equal(memory.robotId, "mother-01");
  assert.equal(memory.profile.role, "mother");
  assert.equal(memory.knowledge.bestPractices.length, 1);
  assert.equal(memory.knowledge.terrainMaps[0].id, "garden-north");
  assert.deepEqual(memory.lineage, [
    { robotId: "mother-01", generation: 0, relationship: "self" }
  ]);
});

test("transfers best parent knowledge to a child robot", () => {
  const mother = createRobotMemory({
    robotId: "mother-01",
    generation: 0,
    bestPractices: [
      { id: "safe-mow", title: "Safe mowing", confidence: 0.9, successRate: 0.9 },
      { id: "low-value", title: "Weak hint", confidence: 0.2, successRate: 0.2 }
    ],
    energyTechniques: [
      { id: "eco-slope", title: "Eco mode on slopes", confidence: 0.75, successRate: 0.8 }
    ]
  });
  const father = createRobotMemory({
    robotId: "father-01",
    generation: 0,
    bestPractices: [
      { id: "safe-mow", title: "Safe mowing updated", confidence: 0.95, successRate: 0.92 }
    ],
    disputeExperiences: [
      { id: "photo-proof", title: "Photo proof resolved dispute", confidence: 0.88, successRate: 0.7 }
    ]
  });

  const { childMemory, transferReport } = transferKnowledge([mother, father], {
    robotId: "child-01",
    role: "worker"
  }, {
    minConfidence: 0.5,
    categoryLimits: { bestPractices: 1 }
  });

  assert.equal(childMemory.generation, 1);
  assert.deepEqual(childMemory.parentIds, ["mother-01", "father-01"]);
  assert.equal(childMemory.knowledge.bestPractices.length, 1);
  assert.equal(childMemory.knowledge.bestPractices[0].title, "Safe mowing updated");
  assert.equal(childMemory.knowledge.bestPractices[0].transferCount, 1);
  assert.equal(childMemory.knowledge.energyTechniques.length, 1);
  assert.equal(childMemory.knowledge.disputeExperiences.length, 1);
  assert.equal(transferReport.totalInherited, 3);
  assert.deepEqual(transferReport.inheritedCounts.bestPractices, 1);
});

test("supports category allow-list and per-category limits", () => {
  const parent = createRobotMemory({
    robotId: "teacher-01",
    generation: 2,
    irrigationStrategies: [
      { id: "dry-soil", title: "Dry soil watering", confidence: 0.8 },
      { id: "night-cycle", title: "Night cycle watering", confidence: 0.7 }
    ],
    jobs: [
      { id: "job-1", title: "Trim hedge", confidence: 0.9 }
    ]
  });

  const { childMemory, transferReport } = transferKnowledge([parent], {
    robotId: "grandchild-01"
  }, {
    categories: ["irrigationStrategies"],
    categoryLimits: { irrigationStrategies: 1 }
  });

  assert.equal(childMemory.generation, 3);
  assert.equal(childMemory.knowledge.irrigationStrategies.length, 1);
  assert.equal(childMemory.knowledge.jobs.length, 0);
  assert.ok(transferReport.skippedCategories.includes("jobs"));
});

test("records new experience without mutating the original memory", () => {
  const original = createRobotMemory({
    robotId: "worker-01",
    generation: 1
  });

  const updated = recordExperience(original, "jobs", {
    id: "job-42",
    title: "Collected apples",
    confidence: 0.84,
    successRate: 1,
    tags: ["harvest"]
  });

  assert.equal(original.knowledge.jobs.length, 0);
  assert.equal(updated.knowledge.jobs.length, 1);
  assert.equal(updated.knowledge.jobs[0].id, "job-42");
});

test("summarizes knowledge and lineage across generations", () => {
  const root = createRobotMemory({
    robotId: "root-01",
    generation: 0,
    bestPractices: [{ title: "Root safety rule", confidence: 0.9, tags: ["safety"] }]
  });
  const { childMemory } = transferKnowledge([root], { robotId: "child-01" });
  const { childMemory: grandchild } = transferKnowledge([childMemory], { robotId: "grandchild-01" });

  const summary = summarizeKnowledge(grandchild);
  const lineage = buildLineageSummary([root, childMemory, grandchild]);

  assert.equal(summary.totalEntries, 1);
  assert.deepEqual(summary.tags, ["safety"]);
  assert.equal(lineage.generationCount, 3);
  assert.deepEqual(lineage.robotsByGeneration["2"], ["grandchild-01"]);
  assert.deepEqual(lineage.parentChildEdges, [
    { parentId: "root-01", childId: "child-01" },
    { parentId: "child-01", childId: "grandchild-01" }
  ]);
});
