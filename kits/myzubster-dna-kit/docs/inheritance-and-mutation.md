# DNA inheritance and mutation (tasks: Implementare ereditarieta DNA + Aggiungere mutazioni)

Covers issue #79 task list entries **"Implementare ereditarieta DNA"** (implement DNA inheritance) and **"Aggiungere mutazioni (miglioramenti)"** (add mutations / improvements). The kit's policy lives in `firmware/lib/dna/dna.js::inheritance` and `firmware/lib/dna/dna.js::mutate`. Both are pure functions: identical inputs produce identical outputs, which is what makes the lineage deterministic and the `jest` suite meaningful.

## Inheritance: parent DNA -> child DNA

`inheritance(parent, childOpts)` returns a brand-new DNA object that is the parent's child. The function never mutates `parent`. The rules (each pinned by a unit test):

1. **`id`** - `childOpts.id` if provided, else an id derived deterministically from the parent's `genealogy.generation + 1`. Duplicate ids are later rejected by `genealogyTree`.
2. **`robotType`** - inherited from `parent.robotType`, overridable via `childOpts.robotType`. Lets a mother-mower spawn an agri child that then spawns its own eco grandchildren.
3. **`skills`** - deep-copied from `parent.skills`; then, for each skill in `childOpts.skills`, the matching existing skill is **bumped additively** (level capped at 100), and brand-new skills are appended. This is why a mother with `irrigate:60` + a child that adds `irrigate:15` produces `irrigate:75` (the `dna:check` scenario shows exactly this).
4. **`reputation`** - **always 0** for a child. Reputation is earned per-robot, not inherited: the goal is a self-replicating lineage where new robots must build their own score.
5. **`jobsCompleted`** - **always 0** for a child, for the same reason.
6. **`walletAddress`** - inherited **literally** from `parent.walletAddress` (or `null`). The wallet is never generated, signed, or broadcast by this kit - the field is a documented string and the real upstream wiring is documented in `docs/wallet-field-note.md`.
7. **`hardwareConfig`** - `Object.assign({}, parent.hardwareConfig, childOpts.hardwareConfig)`: the child inherits everything and overrides only what it specifies. New keys are merged additively, never destructive.
8. **`learningLog`** - child starts empty. The parent's log is readable as a "knowledge seed" via `readDNA(parent, 'learningLog')` downstream, but each child logs its own lessons as it works.
9. **`genealogy`** - `child.genealogy.parentRef = parent.id`, `child.genealogy.generation = parent.genealogy.generation + 1`. This backref is what `genealogyTree` uses to reconstruct the lineage.

## Mutation: applying an improvement capsule

`mutate(dna, capsule)` returns a new DNA object with an improvement capsule applied. The function never mutates its input. The capsule fields:

| Capsule field | Effect |
|---|---|
| `skill` + `levelDelta` | bumps the matching skill (or adds it) by `levelDelta`, clamped to `[0,100]` |
| `hardwareOverride` | merged additively into `hardwareConfig` |
| `learningLesson` + `learningConfidence` (or default = `levelDelta`) | appends a `{lesson, confidence, ts}` entry to `learningLog` |
| `ts` | optional timestamp string for the lesson entry |

## Why mutations are "bounded and deterministic"

The unit test `mutate does not mutate the input DNA in place` asserts immutability, and `level caps at 100` asserts the cap. Applying the same capsule twice to the same base DNA always produces the same result (e.g. `{skill:'irrigate', levelDelta:5}` on a level-95 robot -> 100 -> capped at 100, never overshoots). The kit intentionally avoids RNG so two generations built from the same seeds look identical.

## The chain in `dna:check`

The check runs a four-step lineage to make the chain explicit:

1. Mother: `irrigate:60`, `reputation:75`, `walletAddress: "4B3v-INFORMATIONAL-PARENT"`.
2. Child: inherits + adds `irrigate:+15` and a new `fast-charge:50`; reputation resets to 0; wallet inherited literally.
3. Grandchild: inherits the child + a mutation that adds `irrigate:+25` and a learning lesson.
4. The grandchild ends with `irrigate:100` (60+15+25, capped at 100), `reputation:0`, and `learningLog` populated.

This is the deterministic proof that inheritance + mutation chain together, which is exactly what the task list asks for. See `docs/genealogy-tree.md` for how those three records become a tree.
