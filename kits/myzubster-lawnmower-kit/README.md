# MyZubster Modular Lawnmower Kit

Bounty #70 -- 0.03 XMR

Modular lawnmower kit for the MyZubster modular robot. The chassis has a snap-fit
frame that prints on a 220 mm bed, holds four DC motors in skid-steer drive,
and keeps the whole bill of materials under the 200 EUR envelope called out by
the issue. ESP32 firmware helpers cover the differential-drive steering, motor
speed PI controller, obstacle / tilt safety interlock, cutting-deck spin-up ramp,
BOM budget validator, and x402 payment protocol spec (documentation only) +
deterministic jest tests.

Integrazione con MyZubster x402 is delivered as a documentation-only protocol
spec: the firmware references the flow's states and data fields but never holds,
generates, or signs Monero keys, and makes no network call. The actual payment
infrastructure is owned by the MyZubster gateway outside this kit.

## Install

```sh
cd kits/myzubster-lawnmower-kit
npm install
```

## Test

```sh
npm test
```

48 jest tests across 7 describe blocks:
bomBudgetValidator, differentialDrive, motorSpeedController, obstacleGuard,
cuttingDeckController, x402PaymentSpec, mowingMission.

## Verify the fixture (CLI)

```sh
npm run lawnmower:check
```

Runs a headless simulation: BOM budget <200 EUR check, differential-drive
steering sweep, motor speed PI convergence, obstacle + tilt safety interlock,
cutting-deck spin-up / spin-down ramp, x402 payment spec reference, and a
five-phase mowing mission. Prints results, verifies invariants, exit 0.

## x402 payment (documentation only)

The `x402PaymentSpec` helper returns the protocol specification (states,
transitions, and data fields). It does NOT perform any real wallet signing,
Monero transfer, or network call. The actual payment infrastructure is owned
by the MyZubster gateway code outside this kit. No keys, seeds, or mnemonics
are generated.

## Project structure

```
kits/myzubster-lawnmower-kit/
  firmware/lib/lawnmower/lawnmower.js        diff drive + speed PI + obstacle/tilt guard + cutting deck + BOM + x402 spec + mission
  firmware/lib/lawnmower/__tests__/          jest unit tests
  openscad/chassis-frame.scad                parametric snap-fit modular chassis frame (4 motor mounts)
  openscad/electronics-tray.scad             parametric electronics tray (ESP32 + driver + LiPo pockets)
  scripts/lawnmower-check.js                  npm run lawnmower:check - simulation CLI
  docs/bom.md                                  Bill of Materials with prices (<200 EUR envelope)
  docs/wiring-guide.md                        electrical schematic + wiring
  docs/assembly-guide.md                       chassis print + snap-fit + mount guide
  docs/x402-payment-protocol-spec.md          x402 protocol spec (documentation only)
  docs/safe-harbor-note.md                     scope / safe-harbor note
  package.json / .gitignore
```

## Scope

This kit is pure OpenSCAD design + ESP32 firmware helpers + deterministic tests +
documentation. It contains no cryptocurrency generation, wallet signing, mainnet
broadcast, contract deployment, transfer, token authorization, hardware wallet,
multisig, or cross-chain logic. No WiFi, Bluetooth, or API calls. The same
safe-harbor pattern used by the #71 eco kit, #74 agri kit, #76 garden kit, and #85
energy kit.

AI-assisted development: firmware logic is intentionally deterministic and
pure-functional. Tune the motor speed gains, obstacle / tilt thresholds, blade
ramp, and BOM prices for your specific grass and supply situation.
