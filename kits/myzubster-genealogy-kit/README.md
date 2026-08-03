# MyZubster Robot Genealogy Dashboard Kit

Bounty #82 -- 0.05 XMR

React dashboard kit that visualizes the MyZubster robot genealogy tree (mother ->
child -> grandchildren). Consumes the #79 Robot DNA kit `genealogyTree()` output
shape so a maintainer can pass DNA records straight in with zero transformation.

## Install

```sh
cd kits/myzubster-genealogy-kit
npm install
```

## Test

```sh
npm test
```

28 unit + integration tests across 6 suites (api, RobotNode, GenealogyTree,
Metrics, Filters, Dashboard). All deterministic, no network.

## Verify the fixture (CLI)

```sh
npm run genealogy:check
```

Renders the Dashboard to static markup server-side against the bundled
3-generation fixture and prints a family summary + genealogy tree. Exits 0 on
success.

## Project structure

```
kits/myzubster-genealogy-kit/
  src/
    api/genealogy.js          getGenealogyTree / getRobotGenealogy / getMetrics / searchAndFilter
    data/sample-lineage.js    deterministic 3-generation fixture (mirrors #79 dna:check)
    ui/Dashboard.js            Filters + GenealogyTree + Metrics + selected profile
    ui/Filters.js              text search + robotType dropdown (emits intent)
    ui/GenealogyTree.js        depth-first cascade of RobotNode cards
    ui/Metrics.js              robots / jobs / fee / active panel
    ui/RobotNode.js            single robot card + profile link button
    __tests__/                 jest suites (28 tests, 6 files)
  scripts/genealogy-check.js   npm run genealogy:check CLI
  public/index.html            minimal static demo shell
  docs/
    dashboard-architecture.md  state flow + one-way data direction
    component-reference.md     props + data-testids per component
    data-source.md             #79 record-shape reuse + fixture + attachment
    safe-harbor-note.md        Section 2 safety disclosure
  package.json
  README.md
```

## Acceptance criteria mapping (issue #82 tasks)

| Task (issue #82) | Coverage |
|---|---|
| Dashboard che visualizza albero genealogico | `src/ui/Dashboard.js` composes `GenealogyTree` which renders the mother -> child -> grandchild cascade from `api.getGenealogyTree` |
| API per albero genealogico | `src/api/genealogy.js::getGenealogyTree` (rootIds + nodes) and `getRobotGenealogy` (per-robot ancestor path + children) |
| Aggiungere filtri e ricerche | `src/ui/Filters.js` + `api.searchAndFilter` (text search over id/type/skill tags + robotType dropdown) |
| Link al profilo robot | `src/ui/RobotNode.js` profile button calls `onSelectProfile` (in-app navigation, not an external/wallet URL) |
| Testare con dati reali | `src/data/sample-lineage.js` + `scripts/genealogy-check.js` (3-generation fixture mirroring #79 dna:check) + 28 jest tests |

## Safety disclosure (Section 2)

This kit is pure React data visualization. It contains no cryptocurrency
generation, wallet signing, mainnet broadcast, contract deployment, transfer,
token authorization, hardware wallet, multisig, or cross-chain logic. The
`walletAddress` field flows through as an informational display string only and is
never read, generated, signed, or broadcast by anything in this kit. See
`docs/safe-harbor-note.md`.

## AI-assisted note

This PR was authored with AI assistance. The component logic is intentionally
simple and deterministic; tune the fixture data, filter fields, and profile
handler to fit your fleet telemetry shape.

## Bounty payout

Monero payout address: 4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc
