# MyZubster Agri Kit (ESP32 water-saving irrigation robot)

Implementation of [MyZubster-Robot issue #74](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/74) - _"Agriculture: robot che risparmia acqua in agricoltura"_. Bounty: **0.03 XMR**.

### Italian summary

Modalita di risparmio acqua per il robot MyZubster in agricoltura: lettura umidita terreno con sensore capacitivo, soglie di attivazione logiche, elettrovalvola di irrigazione a goccia comandata da GPIO via MOSFET, monitoraggio del consumo energetico (campionamento shunt + ADC), integrazione previsioni meteo come stub locale no-op, integrazione con MyZubster per notifiche come stub locale no-op. Nessuna rete / firma / wallet nella firmware di questo PR.

## Scope

Firmware moisture / valve control + pure-JS unit tests + docs only (no WiFi / BT / signing / wallet):

- **`firmware/firmware.ino`** - ESP32 agri sketch: capacitive moisture-sensor ADC reading -> percentage, dry/wet threshold decision, solenoid-valve control via a logic-level MOSFET gate (60 s single-cycle cap + soak hysteresis), energy accumulator (`addEnergySample`/`energyMilliWattHours`), `weatherForecast()` and `notifyMyzubster()` documented no-op stubs.
- **`firmware/lib/agri/agri.js`** - pure-JS agri helpers (`moistureToPercent`, `weatherFactor`, `decideIrrigation`, `valveControl`, `accumulateEnergy`) so the policy is unit-testable with no hardware.
- **`firmware/lib/agri/__tests__/agri.test.js`** - jest unit tests; 21/21 green; no network, local reads only.
- **`scripts/agri-check.js`** - `npm run agri:check` CLI: 24-hour scenario water-savings + energy summary.
- **`docs/moisture-sensor.md`** - capacitive soil-moisture sensor wiring + ADC calibration.
- **`docs/irrigation-valve.md`** - solenoid-valve wiring + low-side MOSFET driver + control strategy.
- **`docs/weather-integration.md`** - weather forecast as documented no-op stub architecture.
- **`docs/notification-architecture.md`** - MyZubster notification hook (local no-op stub); downstream wiring described.

## Coverage of issue #74 task list

- `Installare sensore umidita` - done in `firmware/firmware.ino` + `docs/moisture-sensor.md` (capacitive sensor wiring + ADC 12-bit calibration + reading).
- `Collegare elettrovalvola` - done in `firmware/firmware.ino` + `docs/irrigation-valve.md` (logic-level MOSFET driver, 60 s cap, failsafe pull-down, 1N4007 flyback).
- `Configurare soglie di attivazione` - done in `firmware/firmware.ino` + `firmware/lib/agri/agri.js` (`decideIrrigation`, `valveControl`, configurable `DRY_THRESHOLD`/`WET_THRESHOLD`/`maxValveDurationMs`); pinned by `agri.test.js`.
- `Integrare con MyZubster per notifiche` - done as a documented **local no-op stub** in `firmware/firmware.ino` + `docs/notification-architecture.md` (same pattern as the merged-scope #75 DIY kit and the accepted-scope #71 eco kit); no network/wallet/signing committed here.

## Coverage of issue features

- **Sensore umidita terreno (capacitivo)** - `moistureToPercent()` inverted mapping with clamps, calibrated to v1.2 sensor at 3.3 V.
- **Irrigazione automatica a goccia** - `valveControl()` opens the valve for `deficit * 1s` capped at 60 s, with 60 s soak pause between cycles.
- **Integrazione con previsioni meteo** - `weatherFactor()` `no-op` stub: returns 1.0 unless an integrator injects `{rainExpected: true}`, which halves the irrigation duration; documented in `docs/weather-integration.md`.
- **Monitoraggio consumi** - `accumulateEnergy()` matches the #71 eco kit formula `uJ = mV*mA*ms/1000`; firmware adds an idle sample per tick + a per-cycle pump sample.

## Verify the kit locally

    cd kits/myzubster-agri-kit
    npm install
    npm test        # jest - all agri helpers green (21/21)
    npm run agri:check   # 24-hour water-savings scenario, exits 0

### Example output

```text
MyZubster Agri Kit - scenario water-+energy check (issue #74)
Scenario: 24 h, tick every 10 min, soil dries morning + rains evening
Baseline (fixed 30 s / dry tick):   4320 s valve open, 144 cycles, 2150.40 mWh
Agri decideIrrigation:             73 s valve open, 18 cycles, 970.68 mWh
Water saved:                 4247.0 s valve-open (98.3%)
...
PASS - agri kit irrigates only when soil is below the dry threshold, saving water vs always-on baseline (issue #74: risparmio acqua in agricoltura)
```

## Safety disclosure (inside the published safe-harbor list)

This kit is firmware moisture / valve control + unit tests + docs. It deliberately avoids any cryptocurrency, wallet, mainnet signing, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain surface. The firmware does **not** enable WiFi/Bluetooth and does not sign anything. The `weatherForecast()` and `notifyMyzubster()` hooks are local no-op stubs; the real upstream platform integrations are documented as downstream-wired contracts that the robot *emits* status strings to but never holds or signs keys for.

AI-assisted development: this kit was authored with AI assistance. Thresholds and ADC calibration are defaults - tune `DRY_THRESHOLD`/`WET_THRESHOLD`/`DRY_RAW`/`WET_RAW` (and the matching `agri.js` `DEFAULTS`) for your soil and recalibrate `ADC_GAIN_MA_PER_LSB` against a known load.

## Status

Initial PR submission toward issue #74. Community iteration welcome on:
- A latching (low-power) solenoid variant with reverse-pulse closing in `firmware.ino`.
- The 24-hour scenario rebalanced for the user's own diurnal wet/dry curve via the `agri-check.js` constants.
- The downstream `weatherForecast` and `notifyMyzubster` publishers wired by the maintainer.

Payout address (Monero): `4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc`
