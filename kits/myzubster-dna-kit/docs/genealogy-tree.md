# Genealogy tree (task: Tracciare albero genealogico)

Covers issue #79 task list entry **"Tracciare albero genealogico"** (track the genealogy tree). The robot-DNA data structure carries a `genealogy.parentRef` backref, and `genealogyTree()` reconstructs the parent -> children map from a list of DNA records. `genealogySummary()` walks the same tree depth-first and returns a deterministic report used by `dna:check`.

## Building the tree

`genealogyTree(records)`:

1. Indexes every record by its `id` and rejects duplicate ids (a duplicate would create an ambiguous lineage).
2. For each record, looks up its `genealogy.parentRef`:
   - if the parent is `null`, the record is a **root** (a mother robot),
   - if the parent id does not exist in the set (orphan-safe), the record is also a root - the kit refuses to crash on partial data and instead surfaces the orphan as a new tree root.
   - otherwise, the record is appended to `parent -> children`.
3. Returns `{ rootIds, nodes }`:
   - `rootIds` is the sorted list of root record ids (deterministic ordering).
   - `nodes` is a `Map<id, childrenId[]>` with each children array sorted.

The helper is pure: the input array is never mutated, and running it twice on the same input returns the same map.

## Walking the tree

`genealogySummary(records)` returns a depth-first list:

```text
  { id, depth, generation, children }
```

where `depth` is the position in the walk (0 = root) and `generation` is the DNA's own generation counter (0 = mother). The grandchild in the `dna:check` scenario gets `depth=2, generation=2` because both coincide in a single-root straight lineage - in a branching tree, `depth` and `generation` diverge (a grandchild whose parent branched off at generation 1 still has `depth=2`).

## The `dna:check` scenario

```text
rootIds = ["mother-0"]
mother-0     -> [child-1]
child-1      -> [grandchild-1]
grandchild-1 -> []

Genealogy summary (depth-first):
- mother-0      (gen=0, depth=0, children=1)
  - child-1     (gen=1, depth=1, children=1)
    - grandchild-1 (gen=2, depth=2, children=0)
```

This is exactly the visual the issue's "Visualizzazione" feature describes ("robot madre in cima, figli e nipoti in cascata") expressed as a deterministic data structure a downstream dashboard (`#82` is the sibling issue for the visual) can consume directly.

## Orphan-safe behaviour

If a robot's `parentRef` references a missing parent, the kit classifies it as a root instead of erroring - a partial genome (e.g. only the grandchildren loaded) still produces a valid tree. This matches the real-world case where a fleet telemetry feed delivers a subset of the robots, and the dashboard still needs to render a tree without a hard crash.

## Reuse with the sibling dashboard

`genealogyTree` returns plain JS structures (`Array`, `Map`), so a downstream React dashboard (which is what issue #82 asks for) can iterate `rootIds` and `nodes` directly to render the cascade. This keeps the lineage math in the pure layer (testable by `jest`) and the rendering in the UI layer (out of scope for this PR and safe-harbor).
