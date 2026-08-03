# MyZubster Mother-Robot Kit

Bounty #78 -- 0.08 XMR

Mother-robot kit for the MyZubster modular robot. Assembly arm inverse kinematics +
component inventory manager + assembly sequence state machine + child registration +
birth firmware generator + deterministic jest tests.

## Install

```sh
cd kits/myzubster-mother-kit
npm install
```

## Test

```sh
npm test
```

jest unit tests for component inventory (add/remove/count/full), arm inverse
kinematics (2-link polar IK solver), arm stepper step planner, magazine indexer,
gripper/welder servo angles, child registration, birth firmware spec generator,
and the assembly sequence state machine. All deterministic, no hardware required.

## Verify the fixture (CLI)

```sh
npm run mother:check
```

Runs a headless simulation of a mother-robot assembly mission: loads 6
components into the magazine, computes arm IK for 4 reach targets, runs the
full assembly sequence (16 steps), flashes birth firmware, registers the child
robot, accumulates energy, verifies invariants, exits 0.

## Project structure

```
kits/myzubster-mother-kit/
  firmware/lib/mother/mother.js          inventory + arm IK + steps + magazine + gripper + welder + register + birth + assembly + energy
  firmware/lib/mother/__tests__/         jest unit tests
  openscad/mother-chassis.scad          parametric expandable modular chassis
  openscad/assembly-arm.scad            parametric 3-DOF mechanical arm
  openscad/component-magazine.scad     parametric 6-slot component storage
  scripts/mother-check.js               npm run mother:check - assembly simulation CLI
  docs/assembly-guide.md                OpenSCAD print + assembly guide
  docs/component-selection.md           component selection (Selezionare componenti)
  docs/birth-firmware-guide.md          birth firmware operation manual
  docs/operation-sequence.md           assembly sequence operation manual
  docs/safe-harbor-note.md              scope / safe-harbor note
  package.json / .gitignore
```

## Scope

This kit is pure OpenSCAD design + ESP32 firmware helpers + deterministic tests +
documentation. It contains no cryptocurrency generation, wallet signing, mainnet
broadcast, contract deployment, transfer, token authorization, hardware wallet,
multisig, or cross-chain logic. No WiFi, Bluetooth, or API calls. The same
safe-harbor pattern used by the #71 eco kit, #74 agri kit, #75 DIY kit, #76 garden
kit, and #77 seed kit.

AI-assisted development: firmware logic is intentionally deterministic and
pure-functional. Tune the arm link lengths, gear ratios, and magazine slot count
for your specific hardware.
