/**
 * Robot DNA Schema Validator (#117)
 * Validates robot DNA against schema rules and handles edge cases.
 */
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, strict: false });

const dnaSchema = {
  type: 'object',
  required: ['robotId', 'model', 'capabilities', 'genome'],
  properties: {
    robotId: { type: 'string', minLength: 1, maxLength: 64 },
    model: { type: 'string', enum: ['EVA-IONI', 'GenericBot', 'CustomBot'] },
    generation: { type: 'integer', minimum: 0, maximum: 999 },
    parentIds: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      maxItems: 2,
      uniqueItems: true
    },
    capabilities: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'level'],
        properties: {
          name: { type: 'string', minLength: 1 },
          level: { type: 'integer', minimum: 0, maximum: 100 }
        }
      },
      minItems: 1
    },
    genome: {
      type: 'object',
      required: ['version', 'traits'],
      properties: {
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        traits: {
          type: 'object',
          properties: {
            speed: { type: 'number', minimum: 0, maximum: 1 },
            strength: { type: 'number', minimum: 0, maximum: 1 },
            intelligence: { type: 'number', minimum: 0, maximum: 1 },
            efficiency: { type: 'number', minimum: 0, maximum: 1 },
            durability: { type: 'number', minimum: 0, maximum: 1 }
          },
          additionalProperties: false
        }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        createdAt: { type: 'string', format: 'date-time' },
        createdBy: { type: 'string' },
        firmwareVersion: { type: 'string' }
      }
    }
  },
  additionalProperties: false
};

const validate = ajv.compile(dnaSchema);

function validateDNA(dna) {
  const errors = [];
  if (!dna || typeof dna !== 'object') {
    return { valid: false, errors: ['DNA must be an object'] };
  }
  const valid = validate(dna);
  if (!valid) {
    validate.errors.forEach(err => {
      let field = err.instancePath || err.params?.missingProperty || 'root';
      let msg = err.message;
      if (err.keyword === 'enum') msg = `${field} must be one of: ${err.params.allowedValues.join(', ')}`;
      if (err.keyword === 'pattern') msg = `${field} must match pattern: ${err.params.pattern}`;
      if (err.keyword === 'additionalProperties') msg = `Unknown property: ${err.params.additionalProperty}`;
      errors.push({ field, message: msg });
    });
  }
  // Edge case: check for empty strings
  if (dna.robotId !== undefined && dna.robotId.trim() === '') {
    errors.push({ field: 'robotId', message: 'robotId cannot be empty or whitespace' });
  }
  // Edge case: check for duplicate capability names
  if (Array.isArray(dna.capabilities)) {
    const names = dna.capabilities.map(c => c.name);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    if (duplicates.length > 0) {
      errors.push({ field: 'capabilities', message: `Duplicate capability names: ${duplicates.join(', ')}` });
    }
  }
  // Edge case: genome traits sum check (warn if all traits are 0)
  if (dna.genome?.traits) {
    const traitSum = Object.values(dna.genome.traits).reduce((s, v) => s + v, 0);
    if (traitSum === 0) {
      errors.push({ field: 'genome.traits', message: 'All traits are 0 - robot will be non-functional' });
    }
  }
  // Edge case: parentIds cannot contain own robotId (self-reference)
  if (dna.parentIds && dna.robotId && dna.parentIds.includes(dna.robotId)) {
    errors.push({ field: 'parentIds', message: 'parentIds cannot contain own robotId (self-reference)' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateDNA, dnaSchema };
