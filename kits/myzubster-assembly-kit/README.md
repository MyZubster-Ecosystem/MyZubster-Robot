# MyZubster Assembly-Line Robot Kit

Bounty #80 -- 0.06 XMR

Assembly-line robot kit for the MyZubster modular robot. 6-station assembly
scheduler + WIP tracker + throughput estimator + line balancer + quality gate
+ deterministic jest tests.

## Install

```sh
cd kits/myzubster-assembly-kit
npm install
```

## Test

```sh
npm test
```

jest unit tests for the assembly line sequence (6 stations x 5 ops), station arm
control, station quality checks, quality gate verifier, WIP tracker, throughput
estimator (bottleneck analysis), and line balancer. All deterministic, no
hardware required.

## Verify the fixture (CLI)

```sh
npm run line:check
```

Runs a headless simulation of the assembly line: 6-workstation sequence, WIP
tracking across stations, throughput estimation with bottleneck analysis, line
balancer suggestion, quality gate verification, energy accumulation. Verifies
invariants, exits 0.

## Project structure

```
 kits/myzubster-assembly-kit/
  firmware/lib/line/line.js              assembly sequence + arm control + checks + quality gate + WIP + throughput + balancer + energy
  firmware/lib/line/__tests__/           jest unit tests
  openscad/assembly-station.scad        parametric assembly station jig
  openscad/conveyor-track.scad          parametric conveyor track segment
  openscad/tool-head.scad              parametric end-effector tool head
  scripts/line-check.js                 npm run line:check - line simulation CLI
  docs/station-assembly-guide.md        OpenSCAD print + station assembly guide
  docs/arm-control-guide.md            arm control programming guide
  docs/throughput-balancing.md          throughput + line balancing manual
  docs/operation-sequence.md           assembly sequence operation manual
  docs/safe-harbor-note.md              scope / safe-harbor note
  package.json / .gitignore
```

## Scope

This kit is pure OpenSCAD design + ESP32 firmware helpers + deterministic tests +
documentation. It contains no cryptocurrency generation, wallet signing, mainnet
broadcast, contract deployment, transfer, token authorization, hardware wallet,
multisig, or cross-chain logic. No WiFi, Bluetooth, or API calls. The same
safe-harbor pattern used by the #71 eco kit, #74 agri kit, #75 DIY kit, #76
garden kit, #77 seed kit, and #78 mother-robot kit.
