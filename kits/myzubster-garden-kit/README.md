# MyZubster Garden-Automation Robot Kit

Bounty #76 -- 0.04 XMR

Garden-automation robot kit for the MyZubster modular robot. Grass cutting scheduler +
boustrophedon mowing path planner + irrigation scheduler + weed classifier + garden
mapping + deterministic jest tests.

## Install

```sh
cd kits/myzubster-garden-kit
npm install
```

## Test

```sh
npm test
```

jest unit tests for the grass cutting scheduler, boustrophedon mowing path coverage,
irrigation scheduler (moisture override), weed classifier thresholds, garden map
occupancy, and the garden mission state machine. All deterministic, no hardware or
network required.

## Verify the fixture (CLI)

```sh
npm run garden:check
```

Runs a headless simulation of a garden mission over a 6 m x 1 m field: generates a
boustrophedon mowing path, sweeps the mower scheduler across a day, schedules
irrigation windows with moisture overrides, classifies weed/grass/bare-soil plots,
builds a garden occupancy map, accumulates energy, verifies invariants, exits 0.

## Project structure

```
kits/myzubster-garden-kit/
  firmware/lib/garden/garden.js          cutting scheduler + path planner + irrigation + weed + map + mission
  firmware/lib/garden/__tests__/         jest unit tests
  openscad/cutting-deck.scad            parametric grass cutting deck housing
  openscad/sprinkler-nozzle.scad        parametric irrigation sprinkler nozzle
  openscad/weed-probe.scad              parametric weed detection probe mount
  scripts/garden-check.js               npm run garden:check - mission simulation CLI
  docs/assembly-guide.md                OpenSCAD print + assembly guide
  docs/sensor-actuator-selection.md     sensors + actuators selection (Scegliere sensori e attuatori)
  docs/operation-sequence.md            irrigation + cutting operation manual
  docs/integration-guide.md             MyZubster integration guide
  docs/safe-harbor-note.md              scope / safe-harbor note
  package.json / .gitignore
```

## Scope

This kit is pure OpenSCAD design + ESP32 firmware helpers + deterministic tests +
documentation. It contains no cryptocurrency generation, wallet signing, mainnet
broadcast, contract deployment, transfer, token authorization, hardware wallet,
multisig, or cross-chain logic. No WiFi, Bluetooth, or API calls. The same
safe-harbor pattern used by the #71 eco kit, #74 agri kit, #75 DIY kit, and #77
seed kit.

AI-assisted development: firmware logic is intentionally deterministic and
pure-functional. Tune the swath width, moisture thresholds, and weed height cutoffs
for your specific grass species and soil.
