# MyZubster Energy Independence Kit

Bounty #85 -- 0.07 XMR

Energy independence kit for the MyZubster modular robot. Battery state-of-charge
estimation + low-battery hysteresis detector + charging station navigator +
auto-docking state machine + charging completion notifier + x402 payment
protocol spec (documentation only) + deterministic jest tests.

The robot (mother and children) recharges autonomously: detects low battery,
navigates to the charging station, connects automatically, and notifies when
charging is complete. The x402 Monero payment flow is documented as a protocol
spec; no real signing, transfer, or key material is included.

## Install

```sh
cd kits/myzubster-energy-kit
npm install
```

## Test

```sh
npm test
```

## Verify the fixture (CLI)

```sh
npm run energy:check
```

Runs a headless simulation: battery SoC sweep, low-battery hysteresis, dock
navigation, full docking state machine cycle, x402 spec reference, recharge
mission, and energy accumulation. Prints results, verifies invariants, exit 0.

## x402 payment (documentation only)

The `x402PaymentSpec` helper returns a protocol specification (states,
transitions, and data fields). It does NOT perform any real wallet signing,
Monero transfer, or network call. The actual payment infrastructure is handled
by the x402 protocol's own systems. No keys, seeds, or mnemonics are generated.

## Project structure

```
kits/myzubster-energy-kit/
  firmware/lib/energy/energy.js              SoC + low-battery + navigator + docking FSM + notifier + x402 spec + mission + energy
  firmware/lib/energy/__tests__/             jest unit tests
  openscad/charging-station.scad            parametric charging station with pogo pin contacts
  openscad/docking-funnel.scad              parametric alignment funnel for self-centering
  scripts/energy-check.js                    npm run energy:check - simulation CLI
  docs/                                      assembly guide, operation manual, x402 spec, safe-harbor note
  package.json / .gitignore
```

## Scope

This kit is pure ESP32 firmware helpers + deterministic tests + OpenSCAD +
documentation. It contains no cryptocurrency generation, wallet signing,
mainnet broadcast, contract deployment, transfer, token authorization,
hardware wallet, multisig, or cross-chain logic. No WiFi, Bluetooth, or API
calls. The x402 payment is a documentation-only protocol spec. Same safe-harbor
pattern as #71-#81 kits.
