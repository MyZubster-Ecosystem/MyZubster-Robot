# Robot Evolution Planner

Issue #83 asks the mother robot to analyze child performance and improve the DNA
for the next robot generation. This implementation provides a deterministic,
dependency-free planning module that can run in the gateway, a robot dashboard,
or an offline factory workflow.

## Covered Scope

- Performance analysis for child robots and their completed/failed jobs.
- Detection of high-demand skills from job history, revenue, rating, and
  completion rate.
- Hardware hints for demanded work such as mowing, irrigation, weeding, mapping,
  planting, and charging.
- Energy optimization when average job consumption is above target.
- Production-cost reduction by trimming optional modules and enabling recycled
  part reuse when children exceed the cost target.
- Multi-generation simulation so improvements can be tested before building the
  next physical robot.

## Data Shape

```js
const child = {
  robotId: "child-a",
  generation: 1,
  productionCostEur: 225,
  hardware: {
    cutterWidthCm: 18,
    batteryWh: 80
  },
  jobs: [
    {
      skill: "mowing",
      status: "completed",
      energyWh: 72,
      rating: 4.8,
      revenueXmr: 0.01
    }
  ]
};
```

## Usage

```js
const {
  analyzeChildPerformance,
  createEvolutionPlan,
  simulateGenerations
} = require("./src/robotEvolutionPlanner");

const analysis = analyzeChildPerformance([child], {
  targetEnergyPerJobWh: 50,
  targetCostEur: 200
});

const plan = createEvolutionPlan(parentDna, analysis);
```

The returned plan includes:

- `recommendedDna`: next-generation skills, hardware, energy, and production
  targets.
- `changes`: an auditable list of why each skill, hardware hint, energy setting,
  or cost target changed.
- `expectedImpact`: estimated success-rate gain, energy reduction, cost
  reduction, and focus areas.
- `evolutionScore`: a deterministic score for comparing generation plans.

## Validation

Run:

```bash
node --test test/robotEvolutionPlanner.test.js
node --check src/robotEvolutionPlanner.js
node --check test/robotEvolutionPlanner.test.js
git diff --check
```

The tests cover performance analysis, demanded-skill detection, hardware
selection, energy/cost optimization, candidate scoring, multi-generation
simulation, and empty-input safety.
