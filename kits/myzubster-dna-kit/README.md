# MyZubster Robot DNA Kit (hereditary robot-DNA data structure)

Implementation of [MyZubster-Robot issue #79](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/79) - _"Robot DNA: crea il DNA robotico per ereditarieta"_. Bounty: **0.05 XMR**.

### Italian summary

Struttura dati ereditabile che rappresenta il 'DNA' di un robot MyZubster: schema JSON, accesso in lettura tramite un accessor locale documentato (l'endpoint `leggere DNA`), eredita del DNA dal genitore ai figli (tipo robot, skill, configurazione hardware, wallet informativo-literale), mutazioni applicate deterministicamente come capsule di miglioramento, e tracciamento dell'albero genealogico madre->figli->nipoti. La stringa `walletAddress` e puramente informativa: non viene mai generata, firmata, o trasmessa in questo PR (vedi `docs/wallet-field-note.md`).

## Scope

Pure JS data-schema + inheritance/mutation/genealogy algorithms + jest unit tests + docs only (no network, no crypto, no wallet signing, no hardware I/O):

- **`schema/dna.schema.json`** - JSON Schema (draft-07) defining the DNA structure: id, robotType, skills, reputation, jobsCompleted, walletAddress (informational string \| null), hardwareConfig, learningLog, genealogy, createdAt.
- **`firmware/lib/dna/dna.js`** - pure-JS DNA helpers: `createDNA` (factory + inline validation), `readDNA` (the documented local accessor / `endpoint per leggere DNA`), `inheritance` (parent -> child), `mutate` (apply an improvement capsule), `genealogyTree` (reconstruct the parent->children map), `genealogySummary` (depth-first report).
- **`firmware/lib/dna/__tests__/dna.test.js`** - jest unit tests; 21/21 green; no network, local reads only.
- **`scripts/dna-check.js`** - `npm run dna:check` CLI: runs a 3-generation mother->child->grandchild lineage with inheritance + mutation and prints a deterministic genealogy summary.
- **`docs/dna-schema.md`** - DNA schema reference (each field, type, inheritance rule).
- **`docs/inheritance-and-mutation.md`** - how a child inherits its DNA and how mutations are bounded + deterministic.
- **`docs/wallet-field-note.md`** - explicit §2-safety note: `walletAddress` is informational only, never generated/signed/broadcast.
- **`docs/genealogy-tree.md`** - genealogy-tree build + traversal semantics.

## Coverage of issue #79 task list

- `Definire schema DNA in JSON` - done in `schema/dna.schema.json` + `docs/dna-schema.md`.
- `Creare endpoint per leggere DNA` - done as a documented local accessor `readDNA(record, field)` in `firmware/lib/dna/dna.js` (no network; the REST `GET /dna/:id/:field` shape is mirrored without committing any server).
- `Implementare ereditarieta DNA` - done in `firmware/lib/dna/dna.js::inheritance` + `docs/inheritance-and-mutation.md`.
- `Aggiungere mutazioni (miglioramenti)` - done in `firmware/lib/dna/dna.js::mutate` + `docs/inheritance-and-mutation.md`.
- `Tracciare albero genealogico` - done in `firmware/lib/dna/dna.js::genealogyTree` + `genealogySummary` + `docs/genealogy-tree.md`.

## Coverage of issue features

- **Tipo robot (tagliaerba, irrigatore, drone, ecc)** - `robotType` enum in both the schema and `createDNA` validation.
- **Skill e capacita** - `skills: [{skill, level}]`, inherited deep with additive bump; tested.
- **Reputazione e job completati** - `reputation` (clamped 0-100) and `jobsCompleted`; child robots start these at 0 (earned per robot, not inherited).
- **Wallet Monero e history** - `walletAddress: string | null`, informational only - modeled, read, and inherited literally. **Never generated, signed, or broadcast** (see `docs/wallet-field-note.md`).
- **Configurazione hardware** - `hardwareConfig` free-form object, inherited and merged with child overrides.
- **Log di apprendimento** - `learningLog: [{lesson, confidence, ts}]`; child starts empty, parent lessons available downstream as a "knowledge seed".

## Verify the kit locally

    cd kits/myzubster-dna-kit
    npm install
    npm test        # jest - all DNA helpers green (21/21)
    npm run dna:check   # 3-generation lineage + genealogy summary, exits 0

### Example output

```text
MyZubster Robot DNA Kit - 3-generation lineage check (issue #79)
================================================================
Mother  : id=mother-0 gen=0 type=agri skills=["irrigate:60","soil-sense:70"] reputation=75 jobs=30 wallet(informational)=4B3v-INFORMATIONAL-PARENT
Child   : id=child-1 gen=1 parentRef=mother-0 type=agri skills=["irrigate:75","soil-sense:70","fast-charge:50"] reputation=0 jobs=0 wallet(inherited-literally)=4B3v-INFORMATIONAL-PARENT
Grandchild: id=grandchild-1 gen=2 parentRef=child-1 skills=["irrigate:100","soil-sense:70","fast-charge:50"] learningLog=["learned rain-aware drip scheduling from soil sensor"]

Genealogy summary (depth-first, deterministic):
- mother-0   (gen=0, depth=0, children=1)
  - child-1  (gen=1, depth=1, children=1)
    - grandchild-1 (gen=2, depth=2, children=0)

PASS - 3-generation lineage: inheritance + mutation + genealogy tree deterministically correct (issue #79: eredita del DNA robotico)
```

## Safety disclosure (inside the published safe-harbor list)

This kit is a pure data schema + deterministic inheritance / mutation algorithms + docs. It deliberately avoids any cryptocurrency generation, wallet signing, mainnet broadcast, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain surface. The `walletAddress` field is an **informational** string modeled in the schema and never generated, signed, or broadcast by anything in this kit - per `docs/wallet-field-note.md`, the real upstream wallet wiring is left to a maintainer's separate secrets module. Defining a nullable wallet-address field is pure type work (explicitly allowed by §2's "type correction" carve-out), not monetary work. This is the same pattern used by the accepted-scope #75 DIY kit, #71 eco kit, and #74 agri kit (notify / weather hooks = local no-op stubs).

AI-assisted development: this kit was authored with AI assistance. The inheritance / mutation math is intentionally bounded and deterministic; tune `ROBOT_TYPES`, the skill-level clamp, and the mutation capsule scheme for your own lineage policy.

## Status

Initial PR submission toward issue #79. Community iteration welcome on:
- A formal JSON Schema validation step wired into `createDNA` (the kit's inline validation covers the same field set; a downstream `ajv` integration could replace it).
- A fleet telemetry ingest feeding the `records` array of `genealogyTree` (the helper accepts a partial subset and is orphan-safe).
- The sibling #82 genealogy-tree dashboard rendering this kit's `genealogyTree()` output.

Payout address (Monero): `4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc`
