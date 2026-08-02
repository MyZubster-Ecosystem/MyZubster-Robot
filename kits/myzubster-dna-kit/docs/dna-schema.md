# Robot DNA schema reference (task: Definire schema DNA in JSON)

Covers issue #79 task list entry **"Definire schema DNA in JSON"** (define the DNA schema in JSON) and the feature **"Tipo robot / Skill e capacita / Reputazione e job completati / Wallet Monero e history / Configurazione hardware / Log di apprendimento"**. The DNA is the heritable data structure a self-replicating MyZubster robot carries around: every robot is described by a single object that can be read, inherited, mutated, and placed into a genealogy tree. The canonical machine-readable definition lives in `schema/dna.schema.json` (JSON Schema draft-07); this page is the human-readable mirror.

## Top-level fields

| Field | Type | Required | Inheritance rule | Notes |
|---|---|---|---|---|
| `id` | string | yes | child derives its own at birth | unique per robot; duplicate ids are rejected by `genealogyTree` |
| `robotType` | enum string | yes | inherited from parent, overridable | `lawn-mower` / `irrigator` / `drone` / `agri` / `eco` / `recycled` / `diy` / `mother` / `custom` |
| `skills` | array of `{skill,level}` | no | deep-copied from parent; child's new skills bumped onto existing entries (additive level) | `level` is an integer clamped to `[0,100]` |
| `reputation` | integer 0-100 | no | **always starts at 0** for a child robot | must be earned per-robot; the parent's score is read-only history |
| `jobsCompleted` | integer >=0 | no | **always starts at 0** for a child robot | counters reset per generation |
| `walletAddress` | string \| null | no | inherited literally from parent (no generation, no signing) | **informational only** - see `docs/wallet-field-note.md` |
| `hardwareConfig` | free-form object | no | inherited from parent, merged with child overrides | `mcu`, `sensor`, `valve`, `rotor`, `power`, etc. |
| `learningLog` | array of `{lesson,confidence,ts}` | no | child starts empty; parents' log is available as a downstream "knowledge seed" through `readDNA` but is NOT copied | each robot logs its own learning |
| `genealogy` | `{parentRef, generation}` | no | child.parentRef = parent.id; child.generation = parent.generation + 1 | mother robots start at `parentRef=null, generation=0` |
| `createdAt` | string \| null | no | n/a (each robot has its own) | opaque timestamp string supplied by the integrator |

## Why the schema is "small"

Each field is either a primitive, an array of primitives/objects, or a free-form `object`. The schema deliberately avoids:

- nested network/auth surfaces (no signing keys, no API tokens, no live endpoints),
- non-deterministic generators (no RNG seed baked into the data - id generation uses caller-supplied seeds/strings, so the inheritance tests are reproducible),
- value coupling across generations except the literal copy of `walletAddress` (which itself does nothing - it's a documented string).

## Tooling hooks

- The `createDNA()` factory in `firmware/lib/dna/dna.js` validates against the same field set inline, so `jest` catches any drift between the JSON schema and the runtime helpers.
- A package that wants to validate a DNA document against the JSON Schema directly can `$ref` `schema/dna.schema.json` (the file is committed and self-contained, no remote `$id` resolution required - the `$id` is an example URN, not fetched).

## Field-by-field examples

```json
{
  "id": "mother-0",
  "robotType": "agri",
  "skills": [{ "skill": "irrigate", "level": 60 }],
  "reputation": 75,
  "jobsCompleted": 30,
  "walletAddress": "4B3v-INFORMATIONAL-PARENT",
  "hardwareConfig": { "mcu": "esp32", "sensor": "capacitive-moisture", "valve": "solenoid" },
  "learningLog": [{ "lesson": "drip scheduling by soil sensor", "confidence": 70, "ts": "2026-08-02T20:00:00Z" }],
  "genealogy": { "parentRef": null, "generation": 0 },
  "createdAt": "2026-08-02T20:00:00Z"
}
```

See `docs/inheritance-and-mutation.md` for how a child robot is derived from this record, `docs/genealogy-tree.md` for how the parent->children tree is built, and `docs/wallet-field-note.md` for the explicit §2-safety note on the `walletAddress` field.
