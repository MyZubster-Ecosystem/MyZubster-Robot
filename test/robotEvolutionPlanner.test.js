"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  analyzeChildPerformance,
  createEvolutionPlan,
  scoreEvolutionCandidate,
  simulateGenerations
} = require("../src/robotEvolutionPlanner");

const children = [
  {
    robotId: "child-a",
    generation: 1,
    productionCostEur: 225,
    hardware: {
      cutterWidthCm: 18,
      batteryWh: 80,
      optionalModules: ["rgb-led", "speaker", "extra-cover"]
    },
    jobs: [
      { id: "job-1", skill: "mowing", status: "completed", energyWh: 72, rating: 4.8, revenueXmr: 0.01 },
      { id: "job-2", skill: "mowing", status: "completed", energyWh: 68, rating: 4.6, revenueXmr: 0.01 },
      { id: "job-3", skill: "irrigation", status: "failed", energyWh: 48, rating: 2.5, revenueXmr: 0 }
    ]
  },
  {
    robotId: "child-b",
    generation: 1,
    productionCostEur: 215,
    hardware: {
      cutterWidthCm: 24,
      batteryWh: 100,
      optionalModules: ["rgb-led", "speaker"]
    },
    jobs: [
      { id: "job-4", skill: "mowing", status: "completed", energyWh: 58, rating: 4.9, revenueXmr: 0.012 },
      { id: "job-5", skill: "weeding", status: "completed", energyWh: 52, rating: 4.3, revenueXmr: 0.008 },
      { id: "job-6", skill: "irrigation", status: "completed", energyWh: 42, rating: 4.2, revenueXmr: 0.006 }
    ]
  }
];

test("analyzes completed jobs, demanded skills, energy, and cost", () => {
  const analysis = analyzeChildPerformance(children, {
    targetEnergyPerJobWh: 50,
    targetCostEur: 200
  });

  assert.equal(analysis.childrenAnalyzed, 2);
  assert.equal(analysis.totals.jobs, 6);
  assert.equal(analysis.totals.completedJobs, 5);
  assert.equal(analysis.successRate, 0.8333);
  assert.equal(analysis.averageCostPerRobotEur, 220);
  assert.equal(analysis.skillDemand[0].skill, "mowing");
  assert.ok(analysis.bottlenecks.includes("energy"));
  assert.ok(analysis.bottlenecks.includes("production_cost"));
});

test("creates an evolution plan that improves skills, hardware, energy, and cost", () => {
  const analysis = analyzeChildPerformance(children, {
    targetEnergyPerJobWh: 50,
    targetCostEur: 200
  });
  const plan = createEvolutionPlan({
    robotId: "mother-01",
    generation: 1,
    dnaVersion: "2.0.0",
    skills: ["mapping"],
    hardware: {
      batteryWh: 80,
      optionalModules: ["rgb-led", "speaker", "decorative-shell", "extra-cover", "debug-screen"]
    },
    energy: { mode: "balanced", maxMotorPowerPercent: 100 },
    production: { targetCostEur: 230 }
  }, analysis, {
    targetEnergyPerJobWh: 50,
    targetCostEur: 200,
    maxOptionalModules: 3
  });

  assert.equal(plan.recommendedDna.generation, 2);
  assert.equal(plan.recommendedDna.dnaVersion, "2.1.0");
  assert.ok(plan.recommendedDna.skills.includes("mowing"));
  assert.ok(plan.recommendedDna.skills.includes("irrigation"));
  assert.equal(plan.recommendedDna.hardware.cutterWidthCm, 24);
  assert.equal(plan.recommendedDna.hardware.soilMoistureSensor, true);
  assert.equal(plan.recommendedDna.energy.mode, "eco");
  assert.equal(plan.recommendedDna.production.targetCostEur, 200);
  assert.equal(plan.recommendedDna.hardware.optionalModules.length, 3);
  assert.ok(plan.expectedImpact.expectedSuccessRateGain > 0);
  assert.ok(plan.expectedImpact.expectedEnergyReductionWh > 0);
});

test("scores candidates based on skill coverage, efficiency, cost, and success", () => {
  const analysis = analyzeChildPerformance(children);
  const baseScore = scoreEvolutionCandidate({
    skills: ["mapping"],
    production: { targetCostEur: 260 }
  }, analysis);
  const improvedScore = scoreEvolutionCandidate({
    skills: ["mapping", "mowing", "irrigation", "weeding"],
    production: { targetCostEur: 190 }
  }, analysis);

  assert.ok(improvedScore > baseScore);
});

test("simulates improvements across robot generations", () => {
  const simulation = simulateGenerations({
    robotId: "mother-01",
    generation: 0,
    dnaVersion: "1.0.0",
    skills: ["mapping"],
    hardware: { optionalModules: ["rgb-led", "speaker", "debug-screen", "extra-cover", "decorative-shell"] },
    energy: { mode: "balanced", maxMotorPowerPercent: 100 },
    production: { targetCostEur: 240 }
  }, [
    { children },
    {
      children: [
        {
          robotId: "grandchild-a",
          generation: 2,
          productionCostEur: 195,
          hardware: { cutterWidthCm: 24, soilMoistureSensor: true },
          jobs: [
            { skill: "mowing", status: "completed", energyWh: 48, rating: 4.9, revenueXmr: 0.012 },
            { skill: "irrigation", status: "completed", energyWh: 36, rating: 4.6, revenueXmr: 0.009 }
          ]
        }
      ]
    }
  ], {
    targetEnergyPerJobWh: 50,
    targetCostEur: 200
  });

  assert.equal(simulation.generations.length, 2);
  assert.equal(simulation.finalDna.generation, 2);
  assert.ok(simulation.finalDna.skills.includes("mowing"));
  assert.ok(simulation.finalDna.skills.includes("irrigation"));
  assert.ok(simulation.generations[1].score >= simulation.generations[0].score);
});

test("handles empty child performance without throwing", () => {
  const analysis = analyzeChildPerformance([]);
  const plan = createEvolutionPlan({ skills: ["mapping"] }, analysis);

  assert.equal(analysis.childrenAnalyzed, 0);
  assert.equal(analysis.successRate, 0);
  assert.deepEqual(plan.recommendedDna.skills, ["mapping"]);
  assert.equal(plan.changes.length, 0);
});
