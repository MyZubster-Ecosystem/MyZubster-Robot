# Component reference

## Dashboard (src/ui/Dashboard.js)

Class component. Props: records (array of genealogy records). Owns filter +
selection state. Composes Filters, Metrics, GenealogyTree, and the selected
profile panel. This is the root of the component tree and the primary export
consumers should render.

data-testid="dashboard"

## Filters (src/ui/Filters.js)

Function component. Props: filterState, robotTypes (array), onChange.
Renders a text search input (matching id, robotType, skill tags) and a robotType
dropdown. Emits { queryText, robotType } to the parent on every change.

data-testid="filters", data-testid="filters-search", data-testid="filters-robotType"

## Metrics (src/ui/Metrics.js)

Function component. Props: metrics (output of api.getMetrics). Renders a compact
panel with four values: total robots, total jobs completed, total fee (6 decimal
places), active count. Read-only; no interaction.

data-testid="metrics-panel", data-testid="metric-total-robots", data-testid="metric-total-jobs", data-testid="metric-total-fee", data-testid="metric-active-count"

## GenealogyTree (src/ui/GenealogyTree.js)

Function component. Props: tree, byId, visibleIds (Set or null), onSelectProfile.
Renders a depth-first cascade of nested ul/li elements starting from tree.rootIds.
When visibleIds is provided, nodes not in the set (and their subtrees) are hidden,
enabling the filter interaction. When null, all nodes are shown.

data-testid="genealogy-tree", data-testid="tree-row-{id}" per node

## RobotNode (src/ui/RobotNode.js)

Function component. Props: robot (a single genealogy record), onSelectProfile.
Renders a profile card: id, robotType, generation, status, reputation, jobs, fee,
skills. The "Link al profilo robot" deliverable is a button that calls
onSelectProfile(robot.id) - an in-app navigation anchor, not a link to any external
wallet or URL.

data-testid="robot-node-{id}"
