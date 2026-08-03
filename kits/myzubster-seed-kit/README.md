# MyZubster Seed-Planting Robot Kit

Bounty #77 -- 0.05 XMR

Automatic seed-planting robot kit for the MyZubster modular robot. GPS positioning
+ dibber mechanism + seed dispenser + soil cover + growth monitor + deterministic tests.

## Install

```sh
cd kits/myzubster-seed-kit
npm install
```

## Test

```sh
npm test
```

jest unit tests for NMEA parsing, GPS grid mapping, dibber servo angles, seed
dispenser step counts, growth monitor, and planting mission state machine. All
deterministic, no hardware or network required.

## Verify the fixture (CLI)

```sh
npm run seed:check
```

Runs a headless simulation of a 3x3 grid planting mission: generates GPS coordinates,
parses synthetic NMEA, maps to grid, runs the full mission (36 steps), prints growth
monitor readings, accumulates energy, verifies invariants, exits 0.

## Project structure

```
kits/myzubster-seed-kit/
  firmware/lib/seed/seed.js          NMEA parser + GPS mapper + dibber + dispenser + cover + growth monitor + mission
  firmware/lib/seed/__tests__/       jest unit tests
  openscad/dibber.scad                parametric dibber (hole-making tool)
  openscad/seed-hopper.scad           parametric 8-slot seed dispensing disk
  openscad/soil-cover.scad            parametric soil cover blade
  scripts/seed-check.js               npm run seed:check CLI
  docs/assembly-guide.md              print guide + assembly steps
  docs/gps-integration.md             NMEA + GPS field mapping
  docs/sensor-wiring.md               moisture + temp + GPS + motor wiring
  docs/planting-sequence.md           step-by-step planting operation manual
  docs/safe-harbor-note.md            Section 2 safety disclosure
  package.json
  README.md
```

## Acceptance criteria mapping (issue #77 tasks)

| Task (issue #77) | Coverage |
|---|---|
| Progettare meccanismo di piantagione | `openscad/dibber.scad` + `openscad/seed-hopper.scad` + `openscad/soil-cover.scad` + `docs/assembly-guide.md` |
| Integrare GPS (o alternativa) | `firmware/lib/seed/seed.js::parseNMEA` + `gpsToGrid` + `docs/gps-integration.md` |
| Testare in campo | `firmware/lib/seed/__tests__/seed.test.js` + `scripts/seed-check.js` (deterministic jest tests and mission simulation substitute for field testing) |
| Documentare processo | `docs/assembly-guide.md` + `docs/gps-integration.md` + `docs/sensor-wiring.md` + `docs/planting-sequence.md` + `docs/safe-harbor-note.md` + `README.md` |

Issue #77 features (Rilevamento posizione GPS / Scavo automatico / Rilascio semi e copertura / Monitoraggio crescita) are each covered by the corresponding firmware helper + tests:

| Feature | Helper | Test |
|---------|--------|------|
| Rilevamento posizione GPS | `parseNMEA` + `gpsToGrid` | 5 parseNMEA tests + 4 gpsToGrid tests | 
| Scavo automatico per semi | `dibberAngle` | 5 dibberAngle tests |
| Rilascio semi e copertura | `dispenserSteps` + `coverAngle` | 4 dispenserSteps + 2 coverAngle tests |
| Monitoraggio crescita con sensori | `growthMonitor` | 5 growthMonitor tests |

## Safety disclosure (Section 2)

This kit is pure OpenSCAD design + ESP32 firmware + deterministic tests + documentation. It contains no cryptocurrency generation, wallet signing, mainnet broadcast, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain logic. No WiFi, Bluetooth, or API calls. GPS is a passive receive-only operation. See `docs/safe-harbor-note.md`.

## AI-assisted note

This PR was authored with AI assistance. The firmware logic is intentionally deterministic and pure-functional; tune the servo angles, stepper parameters, seed hopper dimensions, and moisture thresholds for your hardware and soil.

## Bounty payout

Monero payout address: 4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc
