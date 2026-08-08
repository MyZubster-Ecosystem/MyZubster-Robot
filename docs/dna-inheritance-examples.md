# Robot DNA Inheritance Examples (#118)

## Overview

Robot DNA defines the genetic blueprint of a MyZubster robot. DNA is inherited from parent robots during reproduction, with mutations and crossovers creating genetic diversity.

## DNA Structure

```json
{
  "robotId": "eva-ioni-001",
  "model": "EVA-IONI",
  "generation": 1,
  "parentIds": ["robot-alpha", "robot-beta"],
  "capabilities": [
    { "name": "gardening", "level": 75 },
    { "name": "cleaning", "level": 50 }
  ],
  "genome": {
    "version": "1.0.0",
    "traits": {
      "speed": 0.7,
      "strength": 0.5,
      "intelligence": 0.8,
      "efficiency": 0.6,
      "durability": 0.9
    }
  }
}
```

## Inheritance Patterns

### 1. Single Parent (Asexual)

A robot inherits DNA from one parent with minor mutations:

```javascript
const { validateDNA } = require('./src/dnaSchemaValidator');

const child = {
  robotId: "child-001",
  model: "EVA-IONI",
  generation: parent.generation + 1,
  parentIds: [parent.robotId],
  capabilities: parent.capabilities.map(c => ({
    name: c.name,
    level: Math.min(100, c.level + Math.floor(Math.random() * 5))
  })),
  genome: {
    version: parent.genome.version,
    traits: mutateTraits(parent.genome.traits, 0.05)
  }
};

const result = validateDNA(child);
console.log(result.valid ? "Valid DNA" : "Invalid: " + result.errors.join(", "));
```

### 2. Dual Parent (Sexual)

A robot inherits DNA from two parents with crossover:

```javascript
function crossoverTraits(traits1, traits2) {
  const child = {};
  for (const key of Object.keys(traits1)) {
    // 50% chance from each parent, with small mutation
    const baseValue = Math.random() < 0.5 ? traits1[key] : traits2[key];
    const mutation = (Math.random() - 0.5) * 0.1;
    child[key] = Math.max(0, Math.min(1, baseValue + mutation));
  }
  return child;
}

function mergeCapabilities(caps1, caps2) {
  const merged = {};
  [...caps1, ...caps2].forEach(c => {
    if (!merged[c.name] || merged[c.name].level < c.level) {
      merged[c.name] = c;
    }
  });
  return Object.values(merged);
}

const child = {
  robotId: "child-002",
  model: parent1.model,
  generation: Math.max(parent1.generation, parent2.generation) + 1,
  parentIds: [parent1.robotId, parent2.robotId],
  capabilities: mergeCapabilities(parent1.capabilities, parent2.capabilities),
  genome: {
    version: parent1.genome.version,
    traits: crossoverTraits(parent1.genome.traits, parent2.genome.traits)
  }
};

const result = validateDNA(child);
if (!result.valid) {
  console.error("DNA validation failed:", result.errors);
}
```

### 3. Mutation Only (No Parents)

A first-generation robot with random DNA:

```javascript
function randomTraits() {
  return {
    speed: Math.random(),
    strength: Math.random(),
    intelligence: Math.random(),
    efficiency: Math.random(),
    durability: Math.random()
  };
}

const genesis = {
  robotId: "genesis-001",
  model: "EVA-IONI",
  generation: 0,
  parentIds: [],
  capabilities: [{ name: "gardening", level: Math.floor(Math.random() * 100) }],
  genome: { version: "1.0.0", traits: randomTraits() }
};

const result = validateDNA(genesis);
```

## Validation Edge Cases

The `validateDNA` function handles these edge cases:

1. **Empty robotId**: Rejected (cannot be empty or whitespace)
2. **Duplicate capabilities**: Rejected (capability names must be unique)
3. **All-zero traits**: Warning (robot will be non-functional)
4. **Self-referencing parentIds**: Rejected (parentIds cannot contain own robotId)
5. **Unknown properties**: Rejected (schema is strict)
6. **Invalid genome version**: Rejected (must match x.y.z pattern)
7. **Out-of-range traits**: Rejected (must be 0.0-1.0)
8. **Too many parents**: Rejected (max 2 parents)

## Testing

```bash
node -e "
const { validateDNA } = require('./src/dnaSchemaValidator');
const result = validateDNA({ robotId: 'test', model: 'EVA-IONI', capabilities: [{name: 'test', level: 50}], genome: { version: '1.0.0', traits: { speed: 0.5 } } });
console.log(result);
"
```
