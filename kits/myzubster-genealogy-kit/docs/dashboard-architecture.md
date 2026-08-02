# Dashboard architecture

## Overview

The Genealogy Dashboard Kit visualizes the mother -> child -> grandchild robot
lineage produced by the #79 Robot DNA kit. The dashboard is a pure React component
tree (no global store, no network layer) composed from small single-purpose
components driven entirely by a local data fixture or caller-supplied records.

```
+-------------------+
| Dashboard          |   top-level state machine (filter state + selected robot)
|  +- Filters        |   emits { queryText, robotType } intent upward
|  +- Metrics        |   renders family-level aggregates (read-only)
|  +- GenealogyTree  |   depth-first cascade of <RobotNode> cards
|  |    +- RobotNode |   single robot profile card + profile link
|  +- Selected profile|  in-app navigation target for the profile link
+-------------------+
```

## State flow

Dashboard owns two pieces of state:

- filterState -- { queryText, robotType } updated by Filters via onChange.
- selectedRobotId -- updated when a user clicks a RobotNode profile button.

On each render the Dashboard:

1. Builds a byId lookup Map from the records array.
2. Calls api.getGenealogyTree(records) for the tree structure.
3. Calls api.getMetrics(records) for the metrics panel.
4. Calls api.searchAndFilter(records, filterState) to compute the visible set.
5. Passes visibleIds to GenealogyTree so nodes outside the filter are hidden.

No component fetches data, signs transactions, or touches a wallet. The
walletAddress field flows through as an informational display string only (see
safe-harbor-note.md).

## Data flow direction

All data flows downward (props) and all user intent flows upward (callbacks).
This is the standard one-way React data flow, which keeps the kit deterministic
and testable (the test suite renders the full tree and fires events; see
src/__tests__/Dashboard.test.js).

## Why no server?

Issue #82 asks for a dashboard that visualizes the genealogy. The kit delivers
this as a reusable React component that a maintainer can drop into any app shell.
Shipping a server would add security surface (HTTP listener, secrets, deployment
config) and is out of scope for a data-visualization bounty. The genealogy:check
CLI (scripts/genealogy-check.js) demonstrates that the component renders
correctly server-side via react-dom/server, proving it is framework-ready
without committing to a runtime.
