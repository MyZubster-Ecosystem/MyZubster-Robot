"use strict";

const CATEGORY_FIELDS = [
  "bestPractices",
  "terrainMaps",
  "energyTechniques",
  "irrigationStrategies",
  "disputeExperiences",
  "jobs"
];

const DEFAULT_CATEGORY_LIMITS = Object.freeze({
  bestPractices: 5,
  terrainMaps: 5,
  energyTechniques: 5,
  irrigationStrategies: 5,
  disputeExperiences: 5,
  jobs: 5
});

function createRobotMemory(input = {}) {
  const robotId = requireText(input.robotId, "robotId");
  const createdAt = normalizeIso(input.createdAt) || new Date(0).toISOString();
  const generation = normalizeInteger(input.generation, 0);
  const parentIds = uniqueStrings(input.parentIds || []);
  const knowledge = normalizeKnowledge(input.knowledge || input, robotId);

  return {
    robotId,
    generation,
    parentIds,
    profile: {
      model: input.model || input.profile?.model || "unknown",
      role: input.role || input.profile?.role || "worker",
      location: input.location || input.profile?.location || null
    },
    knowledge,
    lineage: normalizeLineage(input.lineage, robotId, generation, parentIds),
    createdAt,
    updatedAt: normalizeIso(input.updatedAt) || createdAt
  };
}

function transferKnowledge(parentMemories, childInput = {}, options = {}) {
  const parents = ensureArray(parentMemories).map(createRobotMemory);
  if (parents.length === 0) {
    throw new Error("At least one parent memory is required");
  }

  const childRobotId = requireText(childInput.robotId, "child robotId");
  const requestedCategories = options.categories
    ? uniqueStrings(options.categories).filter((category) => CATEGORY_FIELDS.includes(category))
    : CATEGORY_FIELDS.slice();
  const limits = { ...DEFAULT_CATEGORY_LIMITS, ...(options.categoryLimits || {}) };
  const minConfidence = normalizeNumber(options.minConfidence, 0);
  const inheritedKnowledge = emptyKnowledge();
  const skippedCategories = [];

  for (const category of CATEGORY_FIELDS) {
    if (!requestedCategories.includes(category)) {
      skippedCategories.push(category);
      continue;
    }

    const candidates = [];
    for (const parent of parents) {
      for (const entry of parent.knowledge[category]) {
        if (entry.confidence >= minConfidence) {
          candidates.push(markInherited(entry, parent, childRobotId));
        }
      }
    }

    inheritedKnowledge[category] = selectEntries(candidates, limits[category]);
  }

  const generation =
    childInput.generation === undefined
      ? Math.max(...parents.map((parent) => parent.generation)) + 1
      : normalizeInteger(childInput.generation, 0);

  const childMemory = createRobotMemory({
    ...childInput,
    robotId: childRobotId,
    generation,
    parentIds: uniqueStrings([
      ...(childInput.parentIds || []),
      ...parents.map((parent) => parent.robotId)
    ]),
    knowledge: mergeKnowledge(inheritedKnowledge, normalizeKnowledge(childInput.knowledge || {}, childRobotId)),
    lineage: buildChildLineage(parents, childRobotId, generation),
    createdAt: childInput.createdAt,
    updatedAt: childInput.updatedAt
  });

  return {
    childMemory,
    transferReport: buildTransferReport(parents, childMemory, inheritedKnowledge, skippedCategories)
  };
}

function recordExperience(memoryInput, category, entryInput) {
  if (!CATEGORY_FIELDS.includes(category)) {
    throw new Error(`Unsupported knowledge category: ${category}`);
  }

  const memory = createRobotMemory(memoryInput);
  const entry = normalizeEntry(category, entryInput, memory.robotId);
  const knowledge = cloneKnowledge(memory.knowledge);
  knowledge[category] = selectEntries([...knowledge[category], entry], Number.POSITIVE_INFINITY);

  return {
    ...memory,
    knowledge,
    updatedAt: normalizeIso(entry.updatedAt) || entry.createdAt
  };
}

function summarizeKnowledge(memoryInput) {
  const memory = createRobotMemory(memoryInput);
  const counts = {};
  const tags = new Set();
  let totalEntries = 0;
  let strongestEntry = null;

  for (const category of CATEGORY_FIELDS) {
    counts[category] = memory.knowledge[category].length;
    totalEntries += counts[category];

    for (const entry of memory.knowledge[category]) {
      for (const tag of entry.tags) {
        tags.add(tag);
      }

      if (!strongestEntry || scoreEntry(entry) > scoreEntry(strongestEntry)) {
        strongestEntry = entry;
      }
    }
  }

  return {
    robotId: memory.robotId,
    generation: memory.generation,
    parentIds: memory.parentIds.slice(),
    counts,
    totalEntries,
    tags: [...tags].sort(),
    strongestEntry
  };
}

function buildLineageSummary(memoriesInput) {
  const memories = ensureArray(memoriesInput).map(createRobotMemory);
  const robotsByGeneration = {};
  const parentChildEdges = [];
  const seenRobots = new Set();
  const childIds = new Set();

  for (const memory of memories) {
    seenRobots.add(memory.robotId);
    const generationKey = String(memory.generation);
    robotsByGeneration[generationKey] = robotsByGeneration[generationKey] || [];
    robotsByGeneration[generationKey].push(memory.robotId);

    for (const parentId of memory.parentIds) {
      parentChildEdges.push({ parentId, childId: memory.robotId });
      childIds.add(memory.robotId);
    }
  }

  for (const ids of Object.values(robotsByGeneration)) {
    ids.sort();
  }

  return {
    generationCount: Object.keys(robotsByGeneration).length,
    robotCount: memories.length,
    robotsByGeneration,
    parentChildEdges,
    rootRobotIds: [...seenRobots].filter((robotId) => !childIds.has(robotId)).sort()
  };
}

function normalizeKnowledge(input = {}, sourceRobotId = "unknown") {
  const knowledge = emptyKnowledge();

  for (const category of CATEGORY_FIELDS) {
    const entries = ensureArray(input[category]);
    knowledge[category] = selectEntries(
      entries.map((entry) => normalizeEntry(category, entry, sourceRobotId)),
      Number.POSITIVE_INFINITY
    );
  }

  return knowledge;
}

function normalizeEntry(category, input = {}, sourceRobotId = "unknown") {
  const title = input.title || input.name || input.id || `${category}-entry`;
  const id = input.id || stableId(category, title);
  const createdAt = normalizeIso(input.createdAt) || new Date(0).toISOString();

  return {
    id: String(id),
    category,
    title: String(title),
    description: input.description ? String(input.description) : "",
    sourceRobotId: input.sourceRobotId || sourceRobotId,
    confidence: clamp(normalizeNumber(input.confidence, 0.5), 0, 1),
    successRate: clamp(normalizeNumber(input.successRate, 0), 0, 1),
    transferCount: normalizeInteger(input.transferCount, 0),
    tags: uniqueStrings(input.tags || []),
    createdAt,
    updatedAt: normalizeIso(input.updatedAt) || createdAt,
    meta: { ...(input.meta || {}) }
  };
}

function selectEntries(entries, limit) {
  const bestByKey = new Map();

  for (const entry of entries) {
    const key = `${entry.category}:${entry.id}`;
    const current = bestByKey.get(key);
    if (!current || scoreEntry(entry) > scoreEntry(current)) {
      bestByKey.set(key, entry);
    }
  }

  return [...bestByKey.values()]
    .sort((left, right) => {
      const scoreDiff = scoreEntry(right) - scoreEntry(left);
      return scoreDiff || left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
    })
    .slice(0, Number.isFinite(limit) ? Math.max(0, limit) : undefined);
}

function scoreEntry(entry) {
  return entry.confidence * 100 + entry.successRate * 50 + entry.transferCount * 5;
}

function markInherited(entry, parent, childRobotId) {
  return normalizeEntry(entry.category, {
    ...entry,
    sourceRobotId: entry.sourceRobotId || parent.robotId,
    transferCount: entry.transferCount + 1,
    meta: {
      ...entry.meta,
      inheritedFrom: parent.robotId,
      inheritedBy: childRobotId,
      parentGeneration: parent.generation
    }
  }, parent.robotId);
}

function buildTransferReport(parents, childMemory, inheritedKnowledge, skippedCategories) {
  const inheritedCounts = {};
  const sourceBreakdown = {};
  let totalInherited = 0;

  for (const category of CATEGORY_FIELDS) {
    const entries = inheritedKnowledge[category] || [];
    inheritedCounts[category] = entries.length;
    totalInherited += entries.length;

    for (const entry of entries) {
      const sourceId = entry.meta.inheritedFrom || entry.sourceRobotId;
      sourceBreakdown[sourceId] = (sourceBreakdown[sourceId] || 0) + 1;
    }
  }

  return {
    childRobotId: childMemory.robotId,
    childGeneration: childMemory.generation,
    parentIds: parents.map((parent) => parent.robotId),
    inheritedCounts,
    totalInherited,
    skippedCategories,
    sourceBreakdown
  };
}

function buildChildLineage(parents, childRobotId, childGeneration) {
  const lineage = [];
  const seen = new Set();

  for (const parent of parents) {
    for (const node of parent.lineage) {
      const key = `${node.robotId}:${node.generation}`;
      if (!seen.has(key)) {
        seen.add(key);
        lineage.push({ ...node });
      }
    }

    const parentKey = `${parent.robotId}:${parent.generation}`;
    if (!seen.has(parentKey)) {
      seen.add(parentKey);
      lineage.push({
        robotId: parent.robotId,
        generation: parent.generation,
        relationship: "parent"
      });
    }
  }

  lineage.push({
    robotId: childRobotId,
    generation: childGeneration,
    relationship: "self"
  });

  return lineage.sort((left, right) => left.generation - right.generation || left.robotId.localeCompare(right.robotId));
}

function normalizeLineage(lineageInput, robotId, generation, parentIds) {
  const lineage = ensureArray(lineageInput)
    .filter((node) => node && node.robotId)
    .map((node) => ({
      robotId: String(node.robotId),
      generation: normalizeInteger(node.generation, 0),
      relationship: node.relationship || "ancestor"
    }));

  for (const parentId of parentIds) {
    if (!lineage.some((node) => node.robotId === parentId)) {
      lineage.push({ robotId: parentId, generation: Math.max(0, generation - 1), relationship: "parent" });
    }
  }

  if (!lineage.some((node) => node.robotId === robotId)) {
    lineage.push({ robotId, generation, relationship: "self" });
  }

  return lineage.sort((left, right) => left.generation - right.generation || left.robotId.localeCompare(right.robotId));
}

function mergeKnowledge(left, right) {
  const knowledge = emptyKnowledge();
  for (const category of CATEGORY_FIELDS) {
    knowledge[category] = selectEntries([
      ...ensureArray(left[category]),
      ...ensureArray(right[category])
    ], Number.POSITIVE_INFINITY);
  }
  return knowledge;
}

function cloneKnowledge(knowledge) {
  return mergeKnowledge(knowledge, emptyKnowledge());
}

function emptyKnowledge() {
  return Object.fromEntries(CATEGORY_FIELDS.map((category) => [category, []]));
}

function stableId(category, title) {
  return `${category}-${String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function uniqueStrings(values) {
  return [...new Set(ensureArray(values).map((value) => String(value).trim()).filter(Boolean))];
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null ? [] : [value];
}

function requireText(value, fieldName) {
  if (!value || !String(value).trim()) {
    throw new Error(`${fieldName} is required`);
  }
  return String(value).trim();
}

function normalizeIso(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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
  return Math.min(max, Math.max(min, value));
}

module.exports = {
  CATEGORY_FIELDS,
  DEFAULT_CATEGORY_LIMITS,
  buildLineageSummary,
  createRobotMemory,
  normalizeKnowledge,
  recordExperience,
  summarizeKnowledge,
  transferKnowledge
};
