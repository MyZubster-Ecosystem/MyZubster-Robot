# Data source

## Reuse of the #79 Robot DNA kit output

The dashboard kit is designed to be composable with the #79 Robot DNA kit. It
consumes the exact record shape that dna.js::genealogyTree() produces, so a
maintainer who already generated DNA records for #79 can pass them straight into
the Dashboard records prop with zero transformation.

### Record shape

```json
{
  "id": "mother-0",
  "robotType": "agri",
  "generation": 0,
  "reputation": 75,
  "jobsCompleted": 30,
  "fee": 0.0012,
  "status": "active",
  "skills": [{ "skill": "irrigate", "level": 60 }],
  "walletAddress": "4B3v-INFORMATIONAL-PARENT",
  "genealogy": { "parentRef": null, "generation": 0 }
}
```

### Parent linkage

The genealogy.parentRef field is the link key. A record with parentRef: null
(or a parentRef that is not present in the set) becomes a root. A record with
parentRef: "mother-0" is a child of mother-0.

### Attached fixture

src/data/sample-lineage.js ships a deterministic 3-record
(mother-0 -> child-1 -> grandchild-1) fixture that mirrors the exact lineage
produced by the #79 dna:check CLI. This is what the tests, the genealogy:check
CLI, and the demo shell use so the kit works out of the box.

### Why not a live API?

Issue #82 tasks describe a visualization + filter + profile-link dashboard, not a
data-fetching service. The kit exposes the API layer (src/api/genealogy.js) as
pure functions so a maintainer can later wire them to a live fleet-telemetry
endpoint without changing the component tree. Today the source is the bundled
fixture, which is sufficient to prove all five deliverables.
