# MyZubster Eco-Mode Kit (ESP32 energy-saving mode)

Implementation of [MyZubster-Robot issue #71](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/71) - _"[Energy] Robot con modalita eco (risparmio energetico)"_. Bounty: **0.02 XMR**.

Italian summary: _Modalita di risparmio energetico per il robot MyZubster: sleep mode ESP32 (light/deep) con sorgenti di wake, standby dei motori quando inattivi (ramp-down + driver EN low), monitoraggio del consumo energetico via shunt + ADC e accumulatori in virgola fissa, e hook di notifica MyZubster come stub locale no-op (nessun wallet/firma/rete)._

## Scope

Firmware power management + pure-JS unit tests + docs only (no WiFi / BT / signing / wallet):

- **`firmware/firmware.ino`** - ESP32 eco sketch: inactivity FSM (active / light sleep / deep sleep), motor idle (PWM ramp-down + DRV8833 EN low), ADC current-sense energy accumulator (`totalMicroJoules` -> mWh), `notifyMyzubster()` no-op stub.
- **`firmware/lib/eco/eco.js`** - pure-JS eco helpers (`decideSleep`, `motorStandby`, `rampDown`, `accumulateEnergy`) so the policy is unit-testable.
- **`firmware/lib/eco/__tests__/eco.test.js`** - jest unit tests, all green.
- **`scripts/eco-check.js`** - `npm run eco:check` CLI: runs the helpers on a 1-hour active+idle scenario and prints a savings summary.
- **`docs/sleep-and-power.md`** - ESP32 sleep reference (modem/light/deep) + motor idle strategy (tasks 1 & 2).
- **`docs/energy-monitoring.md`** - current-sense wiring + ADC math + fixed-point uJ accumulation (task 3).
- **`docs/notification-architecture.md`** - MyZubster notification hook: local no-op stub; downstream wiring described (task 4).

## Coverage of issue #71 task list

- `Implementare sleep mode su ESP32` - done in `firmware/firmware.ino` + `docs/sleep-and-power.md` (light/deep sleep + wake sources; `decideSleep` in eco.js).
- `Riduzione consumo motori in idle` - done in `firmware/firmware.ino` + `docs/sleep-and-power.md` (PWM ramp-down + driver EN low; `motorStandby`/`rampDown` in eco.js).
- `Monitoraggio consumo energetico` - done in `firmware/firmware.ino` + `docs/energy-monitoring.md` (shunt + ADC + fixed-point uJ accumulator; `accumulateEnergy` in eco.js, pinned by the `1 h @ 3.3V/100mA => 330 mWh` test).
- `Integrazione con MyZubster per notifiche` - done as a documented **local no-op stub** in `firmware/firmware.ino` + `docs/notification-architecture.md` (same pattern as the accepted-scope #75 DIY kit); no network/wallet/signing committed here.

## Verify the kit locally

    cd kits/myzubster-eco-kit
    npm install
    npm test        # jest - all eco helpers green
    npm run eco:check   # 1-hour scenario savings summary, exits 0

## Safety disclosure (stays inside the published safe-harbor list)

This kit is firmware power management + unit tests + docs. It deliberately avoids any cryptocurrency, wallet, mainnet signing, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain surface. The firmware does **not** enable WiFi/Bluetooth and does not sign anything. `notifyMyzubster()` is a local no-op stub; the real upstream platform integration is documented as a downstream-wired, read-only status publisher that never holds or signs keys for this robot.

AI-assisted development: this kit was authored with AI assistance. Thresholds and ADC calibration are defaults; tune `LIGHT_SLEEP_MS` / `DEEP_SLEEP_MS` / `MOTOR_IDLE_MS` (and the matching `eco.js` `DEFAULTS`) for your robot and calibrate `ADC_GAIN` against a known load once.

## Status

Initial PR submission toward issue #71. Community iteration welcome on:
- More wake sources (ext1 group, touch, ULP) in `firmware/firmware.ino`.
- A real energy log output (SD / flash) plumbed off `energyMilliWattHours()`.
- The downstream `notifyMyzubster` publisher wired by the maintainer.

Payout address (Monero): `4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc`
