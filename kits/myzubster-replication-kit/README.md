# MyZubster Self-Replication Kit (issue #73)

ESP32 firmware helpers + OpenSCAD geometry + deterministic jest tests for the
*Auto-replicazione: robot che costruisce copie di sé* bounty. A parent MyZubster
robot assembles a copy of itself from interchangeable modular parts and writes a
clonable-firmware manifest to the child ESP32. Bounty #73, 0.05 XMR.

## Layout

```
kits/myzubster-replication-kit/
  firmware/lib/replication/replication.js        # 7 pure-JS helpers
  firmware/lib/replication/__tests__/replication.test.js  # 40 jest tests
  openscad/modular-chassis-block.scad            # snap-fit interchangeable chassis
  openscad/part-magazine.scad                    # honeycomb part magazine
  scripts/replication-check.js                   # npm run replication:check CLI
  docs/assembly-guide.md                         # assembly instructions (Creare istruzioni)
  docs/self-replication-process.md               # process doc (Documentare auto-replicazione)
  docs/clonable-firmware-spec.md                 # clonable firmware manifest spec (docs only)
  docs/bom.md                                    # bill of materials
  docs/safe-harbor-note.md                       # safe-harbor scope
  package.json                                   # jest + replication:check
```

## Helpers (`firmware/lib/replication/replication.js`)

- `modularPartRegistry(parts)` - register interchangeable chassis / motor / wheel
  / controller / sensor modules, with per-type inventory.
- `partCompatibility(a, b)` - audit plug/socket compatibility, pure check.
- `assemblySequencePlanner(parts)` - ordered steps to assemble one copy.
- `firmwareCloneSpec(manifest)` - documentation-only clonable-firmware manifest.
- `selfReplicationController(input)` - 7-state replication FSM
  (IDLE->SCAN->VERIFY->ASSEMBLE->FLASH->VALIDATE->DONE, FAULT branch).
- `replicationProgressTracker(steps, completed)` - % + phase.
- `replicationValidator(copy, original)` - compare a finished copy to the parent.

## Issue #73 task coverage

| Task (issue #73) | Coverage |
|---|---|---|
| Progettare moduli intercambiabili | `openscad/modular-chassis-block.scad` + `openscad/part-magazine.scad` + `modularPartRegistry`/`partCompatibility` |
| Creare istruzioni per assemblaggio | `docs/assembly-guide.md` + `assemblySequencePlanner` ordered steps |
| Documentare il processo di auto-replicazione | `docs/self-replication-process.md` + `selfReplicationController` 7-state FSM |
| Testare con un prototipo | `npm test` (40 jest tests) + `npm run replication:check` (headless sim, exits 0) |

## Run

```sh
cd kits/myzubster-replication-kit
npm install        # jest dev dependency
npm test           # 40 jest tests, all green
npm run replication:check   # headless 7-phase self-replication simulation
```

## Safety scope

Documentation + deterministic helpers + OpenSCAD + tests only. No real wallet,
signing, mainnet, contract, token auth, hardware wallet, multisig, or cross-
chain. The clonable-firmware manifest uses a reference (non-cryptographic)
checksum and ships no binary image and no signing key. See `docs/safe-harbor-
note.md`.

## AI-assisted development

Authored with AI assistance. Tune the part inventory, snap-fit tolerances, motor
sockets, and flash plan for your specific modular robot hardware and supply
situaton.
