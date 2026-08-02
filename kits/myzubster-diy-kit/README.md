# MyZubster DIY Kit (open-source modular ESP32 robotics kit)

Implementation of [MyZubster-Robot issue #75](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/75) —
_"Creare un kit di componenti open source (lista materiali, STL, schemi) per chi vuole costruire un robot da zero."_.
Bounty: **0.04 XMR**.

Italian summary: _Kit open source per costruire un robot MyZubster-compatible partendo da zero,
componenti economici (<200 EUR), telaio stampabile in 3D, schema di wiring, codice base ESP32 e guida passo-passo._

## Scope

This kit is **documentation + design artifacts + ESP32 firmware + unit tests** only:

- **Bill of Materials** — see [`BOM.md`](BOM.md): EU/global retail components, indicative per-unit prices, budget cap 200 EUR.
- **3D-printable chassis** — `hardware/frame.scad` is the parametric OpenSCAD source. Render to STL with: `openscad -o hardware/frame.stl hardware/frame.scad` (OpenSCAD is a local toolchain choice; binary STL is intentionally not committed in this PR).
- **Wiring schematic** — `hardware/wiring.md` (ASCII wiring diagram and ESP32 pin map).
- **ESP32 base firmware** — `firmware/firmware.ino` (motor PWM, ultrasonic distance polling, IR proximity polling, status LED blink, no networking).
- **BOM helper library + tests** — `firmware/lib/bom/bom.js` (pure-JS helpers used to validate the parts list under budget) and `firmware/lib/bom/__tests__/bom.test.js` (jest unit tests).
- **CLI validation** — `npm run bom:check` runs `scripts/bom-check.js` to summarize and assert the kit is under the 200 EUR cap.

## Coverage of issue #75 task list

- `Selezionare componenti economici` — done in `BOM.md` with EU retail links.
- `Disegnare il telaio 3D` — done in `hardware/frame.scad` (OpenSCAD source renders to STL).
- `Creare wiring diagram` — done in `hardware/wiring.md`.
- `Scrivere codice base` — done in `firmware/firmware.ino`.
- `Documentare tutto` — done in this README plus `BOM.md`, `hardware/wiring.md`, inline comments.
- Listed kit content items (Lista materiali, File STL per stampa 3D, Schemi elettrici, Codice ESP32 pronto, Guida passo-passo) — covered by the files above.

## Build it

(Quick build recipe — see `hardware/wiring.md` for full pinout reference.)

1. Print the chassis from `hardware/frame.scad` with the OpenSCAD build:
   ```bash
   openscad -o hardware/frame.stl hardware/frame.scad
   ```
2. Wire the chassis per `hardware/wiring.md`: ESP32 DevKit V1 + DRV8833 + 2x TT motors + HC-SR04 + IR pair + 18650/TP4056 power.
3. Flash the firmware:
   ```bash
   # Using arduino-cli (ESP32 board package installed):
   arduino-cli compile --fqbn esp32:esp32:esp32doit-devkit-v1 firmware/firmware.ino
   arduino-cli upload -p /dev/ttyUSB0 --fqbn esp32:esp32:esp32doit-devkit-v1 firmware/firmware.ino
   ```
4. Watch the status LED blink `S-B-M` (Start, Bump detected, Motor operating). Bump will pause PWM, drive a quick reverse spin, then auto-resume when the ultrasonic reports clear distance.

## Verify the kit locally

```bash
cd kits/myzubster-diy-kit
npm install
npm test        # jest run — must be green
npm run bom:check   # prints total EU cost, fails if over 200 EUR
```

## Scope / §2 safety disclosure

This kit deliberately avoids any cryptocurrency, wallet, mainnet, signing, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain surface. The ESP32 base sketch does **not** connect to WiFi, sign, or use any crypto peripheral. The `BOM.md` lists standard robotics parts only; no crypto tokens or wallets are referenced. The firmware's "MyZubster integration" hook is intentionally left as a no-op `notifyMyzubster()` stub for downstream maintainers to wire to notifications (read-only; no signing).

AI-assisted development: this kit was authored with AI assistance. The design is intentionally minimal and modular so the maintainer and community can iterate; the OpenSCAD chassis frame is a parametric skeleton that should be extended (e.g. brackets, sensor mounts) by the community for specific robot variants.

## Status

Initial PR submission toward issue #75. Community iteration welcome on:
- More accurate EU retail prices for `BOM.md` (the values are indicative; refine with local distributor prices).
- More sensor / motor variants in `hardware/frame.scad` parametric dimensions.
- Refined `firmware/firmware.ino` behaviors (PID on TT motors, distance-threshold tuning).

Payout address (Monero): `4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc`
