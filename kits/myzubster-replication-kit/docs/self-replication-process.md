# Self-Replication Process - MyZubster-Robot issue #73

> Documentare il processo di auto-replicazione. This file documents how a
> MyZubster robot assembles a copy of itself with interchangeable modular
> components, and how the firmware orchestrates the cycle. It is the written
> record referenced by the issue task "Documentare il processo di
> auto-replicazione".

## Principle

Self-replication here means **modular re-assembly**, not molecular self-
reproduction: a parent robot holds a magazine of interchangeable, pre-made
modular parts (chassis, motors, wheels, ESP32 board, sensors) and runs a scripted
assembly sequence to physically assemble an identical robot. The parent then
writes a **clonable firmware manifest** to the child's ESP32 so the child runs
the same software. No new raw material is synthesized from feedstock - this is a
kit-level replication bounded by the parts the magazine can supply.

## Five interchangeable modules

| Module | Interchange mechanism | Role in a copy |
|---|---|---|---|
| Chassis | M3 + snap-fit sockets | the frame everything mounts on |
| Motor | M3 plug into chassis tower | differential drive (x2) |
| Wheel | snap-fit onto motor shaft | locomotion (x2) |
| Controller | GPIO-header + USB-C seat | hosts clonable firmware |
| Sensor | magnetic plug | perception (x3) |

Compatibility is auditable with `partCompatibility(a, b)` in the firmware; two
parts connect only where a plug matches a socket, so an operator cannot assemble
an incompatible combination.

## The 7-state replication cycle

The `selfReplicationController` FSM drives one cycle:

```
IDLE --start--> SCAN --partsFound--> VERIFY --partsComplete--> ASSEMBLE
ASSEMBLE --sequenceComplete--> FLASH --flashDone--> VALIDATE --copyValid--> DONE
   \___ any phase can branch to FAULT (partsMissing / flashError / copyInvalid)
DONE --reset--> IDLE (begin the next copy)
```

1. **SCAN** - the parent inventories the magazine; `modularPartRegistry` reports
   available units per module type.
2. **VERIFY** - `assemblySequencePlanner` checks the composition can be met; if a
   module is short it lists the shortage and the controller goes to `FAULT`.
3. **ASSEMBLE** - the ordered steps run (see `assembly-guide.md`); progress is
   reported by `replicationProgressTracker`.
4. **FLASH** - the clonable firmware manifest is written (documentation-only
   reference checksum, no signing).
5. **VALIDATE** - `replicationValidator` compares the child's module composition
   and firmware version to the parent; a mismatch returns to `FAULT`.
6. **DONE** - one copy is self-replicated; the controller resets to `IDLE`.

## Limits and safety scope

- Replication is bounded by the magazine; the planner refuses to begin if any
  required module is short (`resolvable: false`).
- The clonable firmware is a documentation-only spec - no real signing, no key
  material, no network flash. See `clonable-firmware-spec.md`.
- The kit contains no cryptocurrency wallet, no mainnet radio, no contract
  deployment, and no token authorization - it is inside the published safe-harbor
  list (see `safe-harbor-note.md`).
- This documents a **kit-level** reproduction step. It does not claim molecular
  self-assembly or feedstock-level von-Neumann reproduction.
