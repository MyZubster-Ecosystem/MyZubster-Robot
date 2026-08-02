"use strict";

const DEFAULT_OPTIONS = Object.freeze({
  topSkillLimit: 4,
  minimumSkillDemand: 0.15,
  targetEnergyPerJobWh: 55,
  targetCostEur: 200,
  minimumSuccessRate: 0.82,
  maxOptionalModules: 4
});

const SKILL_HARDWARE_HINTS = Object.freeze({
  mowing: { cutterWidthCm: 24, proximitySensors: true },
  irrigation: { soilMoistureSensor: true, waterFlowMeter: true },
  weeding: { weedCamera: true, precisionServo: true },
  mapping: { gps: true, imu: true },
  planting: { seedDispenser: true, soilMoistureSensor: true },
  charging: { dockConnector: true, batteryMonitor: true }
});

function analyzeChildPerformance(childrenInput = [], options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const children = ensureArray(childrenInput).map(normalizeChild);
  const totals = {
    robots: children.length,
    jobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    revenueXmr: 0,
    energyWh: 0,
    ratingTotal: 0,
    ratedJobs: 0,
    productionCostEur: 0
  };
  const skillStats = new Map();
  const hardwareStats = new Map();

  for (const child of children) {
    totals.productionCostEur += child.productionCostEur;

    for (const [key, value] of Object.entries(child.hardware)) {
      addHardwareSample(hardwareStats, key, value, child);
    }

    for (const job of child.jobs) {
      totals.jobs += 1;
      totals.energyWh += job.energyWh;
      totals.revenueXmr += job.revenueXmr;

      if (job.status === "completed") {
        totals.completedJobs += 1;
      } else {
        totals.failedJobs += 1;
      }

      if (job.rating !== null) {
        totals.ratingTotal += job.rating;
        totals.ratedJobs += 1;
      }

      addSkillSample(skillStats, job);
    }
  }

  const averageCostPerRobotEur = children.length ? round(totals.productionCostEur / children.length, 2) : 0;
  const averageEnergyPerJobWh = totals.jobs ? round(totals.energyWh / totals.jobs, 2) : 0;
  const successRate = totals.jobs ? round(totals.completedJobs / totals.jobs, 4) : 0;
  const averageRating = totals.ratedJobs ? round(totals.ratingTotal / totals.ratedJobs, 3) : 0;
  const skillDemand = rankSkills(skillStats, totals.jobs, settings);
  const hardwarePerformance = rankHardware(hardwareStats);

  return {
    children,
    childrenAnalyzed: children.length,
    totals: {
      ...totals,
      revenueXmr: round(totals.revenueXmr, 6),
      energyWh: round(totals.energyWh, 2),
      productionCostEur: round(totals.productionCostEur, 2)
    },
    successRate,
    averageRating,
    averageEnergyPerJobWh,
    averageCostPerRobotEur,
    skillDemand,
    hardwarePerformance,
    bottlenecks: detectBottlenecks({
      successRate,
      averageEnergyPerJobWh,
      averageCostPerRobotEur,
      skillDemand
    }, settings)
  };
}

function createEvolutionPlan(parentDnaInput = {}, performanceAnalysisInput = {}, options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const parentDna = normalizeDna(parentDnaInput);
  const analysis = normalizeAnalysis(performanceAnalysisInput, settings);
  const changes = [];
  const recommendedDna = {
    ...parentDna,
    generation: parentDna.generation + 1,
    dnaVersion: nextDnaVersion(parentDna.dnaVersion),
    skills: parentDna.skills.slice(),
    hardware: { ...parentDna.hardware },
    energy: { ...parentDna.energy },
    production: { ...parentDna.production },
    inheritedFrom: parentDna.robotId || parentDna.dnaId || null
  };

  promoteDemandedSkills(recommendedDna, analysis.skillDemand, settings, changes);
  optimizeHardware(recommendedDna, analysis, settings, changes);
  optimizeEnergy(recommendedDna, analysis, settings, changes);
  reduceProductionCost(recommendedDna, analysis, settings, changes);

  return {
    parentDna,
    recommendedDna,
    changes,
    expectedImpact: estimateImpact(changes, analysis),
    evolutionScore: scoreEvolutionCandidate(recommendedDna, analysis),
    analysisSummary: {
      childrenAnalyzed: analysis.childrenAnalyzed,
      successRate: analysis.successRate,
      averageEnergyPerJobWh: analysis.averageEnergyPerJobWh,
      averageCostPerRobotEur: analysis.averageCostPerRobotEur,
      topSkills: analysis.skillDemand.slice(0, settings.topSkillLimit).map((skill) => skill.skill),
      bottlenecks: analysis.bottlenecks
    }
  };
}

function simulateGenerations(initialDnaInput, generationSamples = [], options = {}) {
  const generations = [];
  let currentDna = normalizeDna(initialDnaInput);
  let previousScore = 0;

  for (const sample of ensureArray(generationSamples)) {
    const analysis = analyzeChildPerformance(sample.children || sample, options);
    const plan = createEvolutionPlan(currentDna, analysis, options);
    const improvement = previousScore ? round(plan.evolutionScore - previousScore, 4) : 0;

    generations.push({
      generation: plan.recommendedDna.generation,
      dnaVersion: plan.recommendedDna.dnaVersion,
      score: plan.evolutionScore,
      improvement,
      changes: plan.changes,
      topSkills: plan.analysisSummary.topSkills
    });

    previousScore = plan.evolutionScore;
    currentDna = plan.recommendedDna;
  }

  return {
    initialDna: normalizeDna(initialDnaInput),
    finalDna: currentDna,
    generations,
    totalImprovement: generations.length
      ? round(generations[generations.length - 1].score - generations[0].score, 4)
      : 0
  };
}

function scoreEvolutionCandidate(dnaInput, analysisInput = {}) {
  const dna = normalizeDna(dnaInput);
  const analysis = normalizeAnalysis(analysisInput, DEFAULT_OPTIONS);
  const skillCoverage = analysis.skillDemand.length
    ? analysis.skillDemand.filter((skill) => dna.skills.includes(skill.skill)).length / analysis.skillDemand.length
    : 0;
  const energyScore = analysis.averageEnergyPerJobWh
    ? clamp(DEFAULT_OPTIONS.targetEnergyPerJobWh / analysis.averageEnergyPerJobWh, 0, 1.4)
    : 0.5;
  const costScore = dna.production.targetCostEur
    ? clamp(DEFAULT_OPTIONS.targetCostEur / dna.production.targetCostEur, 0, 1.4)
    : 0.5;

  return round(
    analysis.successRate * 35 +
      skillCoverage * 25 +
      energyScore * 20 +
      costScore * 20,
    4
  );
}

function promoteDemandedSkills(dna, skillDemand, settings, changes) {
  const candidates = skillDemand
    .filter((skill) => skill.demandScore >= settings.minimumSkillDemand)
    .slice(0, settings.topSkillLimit);

  for (const candidate of candidates) {
    if (!dna.skills.includes(candidate.skill)) {
      dna.skills.push(candidate.skill);
      changes.push({
        type: "skill_added",
        skill: candidate.skill,
        reason: `Demand score ${candidate.demandScore} from ${candidate.totalJobs} jobs`
      });
    }

    if (candidate.successRate < settings.minimumSuccessRate) {
      changes.push({
        type: "training_focus",
        skill: candidate.skill,
        reason: `Success rate ${candidate.successRate} is below target ${settings.minimumSuccessRate}`
      });
    }
  }

  dna.skills = uniqueStrings(dna.skills).sort();
}

function optimizeHardware(dna, analysis, settings, changes) {
  for (const skill of analysis.skillDemand.slice(0, settings.topSkillLimit)) {
    const hints = SKILL_HARDWARE_HINTS[skill.skill] || {};
    for (const [key, value] of Object.entries(hints)) {
      if (dna.hardware[key] !== value) {
        dna.hardware[key] = value;
        changes.push({
          type: "hardware_hint",
          skill: skill.skill,
          field: key,
          value,
          reason: `Hardware supports high-demand ${skill.skill} work`
        });
      }
    }
  }

  const bestVariants = analysis.hardwarePerformance.filter((item) => item.successRate >= settings.minimumSuccessRate);
  for (const variant of bestVariants) {
    if (variant.samples >= 2 && dna.hardware[variant.field] !== variant.value) {
      dna.hardware[variant.field] = variant.value;
      changes.push({
        type: "hardware_variant_selected",
        field: variant.field,
        value: variant.value,
        reason: `Observed success ${variant.successRate} across ${variant.samples} robots`
      });
    }
  }
}

function optimizeEnergy(dna, analysis, settings, changes) {
  const currentMode = dna.energy.mode || "balanced";

  if (analysis.averageEnergyPerJobWh > settings.targetEnergyPerJobWh) {
    dna.energy.mode = "eco";
    dna.energy.maxMotorPowerPercent = Math.max(60, Number(dna.energy.maxMotorPowerPercent || 100) - 10);
    dna.energy.sleepAfterIdleSeconds = Math.min(Number(dna.energy.sleepAfterIdleSeconds || 180), 90);
    changes.push({
      type: "energy_optimized",
      fromMode: currentMode,
      toMode: "eco",
      reason: `Average energy ${analysis.averageEnergyPerJobWh}Wh/job exceeds target ${settings.targetEnergyPerJobWh}Wh/job`
    });
  }
}

function reduceProductionCost(dna, analysis, settings, changes) {
  const currentTarget = Number(dna.production.targetCostEur || analysis.averageCostPerRobotEur || settings.targetCostEur);
  dna.production.targetCostEur = currentTarget;

  if (analysis.averageCostPerRobotEur > settings.targetCostEur || currentTarget > settings.targetCostEur) {
    const modules = ensureArray(dna.hardware.optionalModules);
    const trimmedModules = modules.slice(0, settings.maxOptionalModules);
    dna.hardware.optionalModules = trimmedModules;
    dna.production.targetCostEur = Math.min(currentTarget, settings.targetCostEur);
    dna.production.reuseRecycledParts = true;
    changes.push({
      type: "cost_reduced",
      targetCostEur: dna.production.targetCostEur,
      reason: `Average child cost ${analysis.averageCostPerRobotEur}EUR exceeds target ${settings.targetCostEur}EUR`
    });
  }
}

function estimateImpact(changes, analysis) {
  const impact = {
    expectedSuccessRateGain: 0,
    expectedEnergyReductionWh: 0,
    expectedCostReductionEur: 0,
    focusAreas: []
  };

  for (const change of changes) {
    if (change.type === "skill_added" || change.type === "training_focus") {
      impact.expectedSuccessRateGain += 0.03;
      impact.focusAreas.push(change.skill);
    }
    if (change.type === "hardware_hint" || change.type === "hardware_variant_selected") {
      impact.expectedSuccessRateGain += 0.02;
    }
    if (change.type === "energy_optimized") {
      impact.expectedEnergyReductionWh += Math.max(0, analysis.averageEnergyPerJobWh * 0.12);
    }
    if (change.type === "cost_reduced") {
      impact.expectedCostReductionEur += Math.max(0, analysis.averageCostPerRobotEur - change.targetCostEur);
    }
  }

  return {
    expectedSuccessRateGain: round(Math.min(impact.expectedSuccessRateGain, 0.2), 4),
    expectedEnergyReductionWh: round(impact.expectedEnergyReductionWh, 2),
    expectedCostReductionEur: round(impact.expectedCostReductionEur, 2),
    focusAreas: uniqueStrings(impact.focusAreas)
  };
}

function normalizeAnalysis(input = {}, settings = DEFAULT_OPTIONS) {
  if (Array.isArray(input)) {
    return analyzeChildPerformance(input, settings);
  }

  return {
    childrenAnalyzed: Number(input.childrenAnalyzed || 0),
    successRate: Number(input.successRate || 0),
    averageRating: Number(input.averageRating || 0),
    averageEnergyPerJobWh: Number(input.averageEnergyPerJobWh || 0),
    averageCostPerRobotEur: Number(input.averageCostPerRobotEur || 0),
    skillDemand: ensureArray(input.skillDemand),
    hardwarePerformance: ensureArray(input.hardwarePerformance),
    bottlenecks: ensureArray(input.bottlenecks)
  };
}

function normalizeChild(input = {}) {
  const jobs = ensureArray(input.jobs).map(normalizeJob);
  return {
    robotId: String(input.robotId || input.id || "unknown-child"),
    generation: normalizeInteger(input.generation, 0),
    productionCostEur: normalizeNumber(input.productionCostEur, input.costEur || 0),
    hardware: { ...(input.hardware || {}) },
    jobs
  };
}

function normalizeJob(input = {}) {
  return {
    id: String(input.id || input.jobId || "job"),
    skill: normalizeSkill(input.skill || input.type || "general"),
    status: normalizeStatus(input.status),
    revenueXmr: normalizeNumber(input.revenueXmr, input.amountXmr || 0),
    energyWh: normalizeNumber(input.energyWh, 0),
    rating: input.rating === undefined || input.rating === null ? null : clamp(Number(input.rating), 0, 5),
    durationMinutes: normalizeNumber(input.durationMinutes, 0)
  };
}

function normalizeDna(input = {}) {
  return {
    dnaId: String(input.dnaId || input.id || "dna-root"),
    robotId: input.robotId ? String(input.robotId) : null,
    generation: normalizeInteger(input.generation, 0),
    dnaVersion: String(input.dnaVersion || input.version || "1.0.0"),
    skills: uniqueStrings(input.skills || []),
    hardware: { ...(input.hardware || {}) },
    energy: { ...(input.energy || {}) },
    production: { ...(input.production || {}) }
  };
}

function addSkillSample(skillStats, job) {
  const current = skillStats.get(job.skill) || {
    skill: job.skill,
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    revenueXmr: 0,
    energyWh: 0,
    ratingTotal: 0,
    ratedJobs: 0
  };

  current.totalJobs += 1;
  current.completedJobs += job.status === "completed" ? 1 : 0;
  current.failedJobs += job.status === "completed" ? 0 : 1;
  current.revenueXmr += job.revenueXmr;
  current.energyWh += job.energyWh;
  if (job.rating !== null) {
    current.ratingTotal += job.rating;
    current.ratedJobs += 1;
  }
  skillStats.set(job.skill, current);
}

function addHardwareSample(hardwareStats, field, value, child) {
  const key = `${field}:${JSON.stringify(value)}`;
  const current = hardwareStats.get(key) || {
    field,
    value,
    samples: 0,
    jobs: 0,
    completedJobs: 0,
    energyWh: 0,
    costEur: 0
  };

  current.samples += 1;
  current.jobs += child.jobs.length;
  current.completedJobs += child.jobs.filter((job) => job.status === "completed").length;
  current.energyWh += child.jobs.reduce((sum, job) => sum + job.energyWh, 0);
  current.costEur += child.productionCostEur;
  hardwareStats.set(key, current);
}

function rankSkills(skillStats, totalJobs, settings) {
  return [...skillStats.values()]
    .map((skill) => {
      const successRate = skill.totalJobs ? skill.completedJobs / skill.totalJobs : 0;
      const demandShare = totalJobs ? skill.totalJobs / totalJobs : 0;
      const averageRating = skill.ratedJobs ? skill.ratingTotal / skill.ratedJobs : 0;
      const averageEnergyWh = skill.totalJobs ? skill.energyWh / skill.totalJobs : 0;
      const demandScore = demandShare * 0.45 + successRate * 0.25 + (averageRating / 5) * 0.2 + Math.min(skill.revenueXmr, 1) * 0.1;

      return {
        skill: skill.skill,
        totalJobs: skill.totalJobs,
        completedJobs: skill.completedJobs,
        failedJobs: skill.failedJobs,
        successRate: round(successRate, 4),
        demandShare: round(demandShare, 4),
        averageRating: round(averageRating, 3),
        averageEnergyWh: round(averageEnergyWh, 2),
        revenueXmr: round(skill.revenueXmr, 6),
        demandScore: round(demandScore, 4),
        needsTraining: successRate < settings.minimumSuccessRate
      };
    })
    .sort((left, right) => right.demandScore - left.demandScore || left.skill.localeCompare(right.skill));
}

function rankHardware(hardwareStats) {
  return [...hardwareStats.values()]
    .map((sample) => ({
      field: sample.field,
      value: sample.value,
      samples: sample.samples,
      successRate: sample.jobs ? round(sample.completedJobs / sample.jobs, 4) : 0,
      averageEnergyWh: sample.jobs ? round(sample.energyWh / sample.jobs, 2) : 0,
      averageCostEur: sample.samples ? round(sample.costEur / sample.samples, 2) : 0
    }))
    .sort((left, right) => right.successRate - left.successRate || left.averageEnergyWh - right.averageEnergyWh);
}

function detectBottlenecks(metrics, settings) {
  const bottlenecks = [];
  if (metrics.successRate < settings.minimumSuccessRate) {
    bottlenecks.push("success_rate");
  }
  if (metrics.averageEnergyPerJobWh > settings.targetEnergyPerJobWh) {
    bottlenecks.push("energy");
  }
  if (metrics.averageCostPerRobotEur > settings.targetCostEur) {
    bottlenecks.push("production_cost");
  }
  if (metrics.skillDemand.some((skill) => skill.needsTraining)) {
    bottlenecks.push("skill_training");
  }
  return bottlenecks;
}

function normalizeSkill(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "general";
}

function normalizeStatus(value) {
  const normalized = String(value || "completed").toLowerCase();
  return ["done", "success", "completed", "released"].includes(normalized) ? "completed" : "failed";
}

function nextDnaVersion(version) {
  const parts = String(version).split(".").map((part) => Number(part));
  const major = Number.isFinite(parts[0]) ? parts[0] : 1;
  const minor = Number.isFinite(parts[1]) ? parts[1] : 0;
  const patch = Number.isFinite(parts[2]) ? parts[2] : 0;
  return `${major}.${minor + 1}.${patch}`;
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null ? [] : [value];
}

function uniqueStrings(values) {
  return [...new Set(ensureArray(values).map((value) => String(value).trim()).filter(Boolean))];
}

function normalizeInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function normalizeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

module.exports = {
  DEFAULT_OPTIONS,
  analyzeChildPerformance,
  createEvolutionPlan,
  scoreEvolutionCandidate,
  simulateGenerations
};
