/**
 * Self-Replication Edge Case Tests (#119)
 * Tests for robot DNA validation and reproduction scenarios.
 */
const { validateDNA } = require('../src/dnaSchemaValidator');

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log('=== Self-Replication Edge Case Tests ===\n');

// Valid DNA
const validDNA = {
  robotId: 'test-001',
  model: 'EVA-IONI',
  capabilities: [{ name: 'gardening', level: 50 }],
  genome: { version: '1.0.0', traits: { speed: 0.5, strength: 0.5 } }
};

runTest('Valid DNA passes validation', () => {
  const result = validateDNA(validDNA);
  assert(result.valid, 'Should be valid');
});

runTest('Empty robotId rejected', () => {
  const result = validateDNA({ ...validDNA, robotId: '' });
  assert(!result.valid, 'Should be invalid');
  assert(result.errors.some(e => e.field === 'robotId'), 'Should have robotId error');
});

runTest('Whitespace-only robotId rejected', () => {
  const result = validateDNA({ ...validDNA, robotId: '   ' });
  assert(!result.valid, 'Should be invalid');
});

runTest('Duplicate capability names rejected', () => {
  const result = validateDNA({
    ...validDNA,
    capabilities: [{ name: 'gardening', level: 50 }, { name: 'gardening', level: 60 }]
  });
  assert(!result.valid, 'Should be invalid');
  assert(result.errors.some(e => e.field === 'capabilities'), 'Should have capabilities error');
});

runTest('All-zero traits produces warning', () => {
  const result = validateDNA({
    ...validDNA,
    genome: { version: '1.0.0', traits: { speed: 0, strength: 0, intelligence: 0 } }
  });
  assert(result.errors.some(e => e.field === 'genome.traits' && e.message.includes('non-functional')), 'Should warn about non-functional robot');
});

runTest('Self-referencing parentIds rejected', () => {
  const result = validateDNA({ ...validDNA, robotId: 'self-001', parentIds: ['self-001'] });
  assert(!result.valid, 'Should be invalid');
  assert(result.errors.some(e => e.field === 'parentIds' && e.message.includes('self-reference')), 'Should detect self-reference');
});

runTest('Unknown properties rejected', () => {
  const result = validateDNA({ ...validDNA, unknownField: 'test' });
  assert(!result.valid, 'Should be invalid');
});

runTest('Invalid genome version rejected', () => {
  const result = validateDNA({ ...validDNA, genome: { version: 'v1', traits: { speed: 0.5 } } });
  assert(!result.valid, 'Should be invalid');
});

runTest('Traits out of range rejected', () => {
  const result = validateDNA({ ...validDNA, genome: { version: '1.0.0', traits: { speed: 1.5 } } });
  assert(!result.valid, 'Should be invalid');
});

runTest('More than 2 parents rejected', () => {
  const result = validateDNA({ ...validDNA, parentIds: ['p1', 'p2', 'p3'] });
  assert(!result.valid, 'Should be invalid');
});

runTest('Duplicate parentIds rejected', () => {
  const result = validateDNA({ ...validDNA, parentIds: ['p1', 'p1'] });
  assert(!result.valid, 'Should be invalid');
});

runTest('Null DNA rejected', () => {
  const result = validateDNA(null);
  assert(!result.valid, 'Should be invalid');
});

runTest('Non-object DNA rejected', () => {
  const result = validateDNA('not an object');
  assert(!result.valid, 'Should be invalid');
});

runTest('Missing required fields rejected', () => {
  const result = validateDNA({ robotId: 'test' });
  assert(!result.valid, 'Should be invalid');
});

// Self-replication scenario: child from single parent
runTest('Child DNA from single parent passes validation', () => {
  const parent = { ...validDNA, robotId: 'parent-001', generation: 0 };
  const child = {
    robotId: 'child-001',
    model: parent.model,
    generation: parent.generation + 1,
    parentIds: [parent.robotId],
    capabilities: parent.capabilities,
    genome: { version: parent.genome.version, traits: { ...parent.genome.traits, speed: 0.6 } }
  };
  const result = validateDNA(child);
  assert(result.valid, `Child should be valid: ${JSON.stringify(result.errors)}`);
});

// Self-replication scenario: child from dual parents
runTest('Child DNA from dual parents passes validation', () => {
  const parent1 = { ...validDNA, robotId: 'parent-001', generation: 1 };
  const parent2 = { ...validDNA, robotId: 'parent-002', generation: 1 };
  const child = {
    robotId: 'child-002',
    model: parent1.model,
    generation: Math.max(parent1.generation, parent2.generation) + 1,
    parentIds: [parent1.robotId, parent2.robotId],
    capabilities: parent1.capabilities,
    genome: { version: parent1.genome.version, traits: { speed: 0.55, strength: 0.45 } }
  };
  const result = validateDNA(child);
  assert(result.valid, `Dual-parent child should be valid: ${JSON.stringify(result.errors)}`);
});

// Self-replication scenario: genesis robot (no parents)
runTest('Genesis robot with no parents passes validation', () => {
  const genesis = {
    robotId: 'genesis-001',
    model: 'EVA-IONI',
    generation: 0,
    parentIds: [],
    capabilities: [{ name: 'gardening', level: 10 }],
    genome: { version: '1.0.0', traits: { speed: 0.3, strength: 0.3 } }
  };
  const result = validateDNA(genesis);
  assert(result.valid, `Genesis should be valid: ${JSON.stringify(result.errors)}`);
});

console.log('\n=== Tests Complete ===');
