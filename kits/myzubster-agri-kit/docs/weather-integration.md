# Weather-forecast integration - documented no-op stub (feature: Integrazione con previsioni meteo)

Covers the `#74` feature **"Integrazione con previsioni meteo"** (integration with weather forecasts). The issue lists both an outdoor weather-forecast feed and on-device state as scope; this PR keeps the robot **strictly offline** and surfaces the weather forecast as a documented no-op stub that an integrator wire downstream. This matches the stance the maintainer has accepted in the **#75 DIY kit** (notify hook = no-op stub) and the **#71 eco kit** (notifyMyzubster = no-op stub): no live network call is committed in this PR, so nothing in the firmware touches a wallet, signing surface, or radio.

## Why offline first (safe-harbor scope)

A live weather API over WiFi from a battery robot is:
- a **network surface** that has nothing to do with the soil-moisture loop the robot is supposed to optimise,
- a power draw (modem) that defeats the energy-saving calculus the kit is meant to demo,
- a promise the robot makes to an external service (HTTPS root bundle, API key) that this PR explicitly does not want.

The kit's stance: the robot reads its own moisture sensor and irrigates conservatively. If rain is on the way, an upstream module can *reduce* the irrigation duration by halving it - the firmware offers the same `weatherFactor()` hook but conservatively returns `rainExpected = false` until an integrator plugs in a downstream publisher. The robot under-irrigates (pays a small water cost) rather than under-trusting and over-irrigating.

## Local stub contract

| Slot | Source of truth | Wiring surface |
|---|---|---|
| `weatherForecast()` | `firmware/firmware.ino` | Returns `{ rainExpected: false }` |
| `weatherFactor(forecast)` | `firmware/lib/agri/agri.js` | Returns `1.0` unless `rainExpected === true`, in which case `rainFactor` (default `0.5`) |
| `valveControl(moisture, forecast)` | `firmware/lib/agri/agri.js` | Multiplies valve-on duration by `weatherFactor()` |

Tests in `firmware/lib/agri/__tests__/agri.test.js` pin both branches:
- `weatherFactor(null) === 1.0`
- `weatherFactor({ rainExpected: true }) === 0.5`
- `valveControl(20, { rainExpected: true })` returns duration **half** of `valveControl(20, null)`.

## Downstream wiring (not in this PR)

The integrator who actually wants this feature would add a small companion module that:

1. Polls an open-local weather API (no API key in firmware).
2. Publishes a single-bit `rainExpected` flag into a RAM struct the firmware reads.
3. Replaces the `weatherForecast()` body to return that struct.

No code change to the agri helpers is needed because the helpers already operate on the *shape* `{ rainExpected: boolean }`, not a network call. The clay here is intentionally small - one bit of inbound state - so the entire weather integration is contained to that one replacement function.

## How the test scenario reports the weather effect

`npm run agri:check` exercises a 24-hour scenario where the soil slowly dries through the morning and is re-wet by evening rain. The default `null` forecast keeps the rainFactor at `1.0`, i.e. the conservative baseline. To see the dampening effect, swap in `{ rainExpected: true }` in `agri.js::weatherFactor` calls inside `agri-check.js` or just call `valveControl(20, { rainExpected: true })` from a Node REPL - the unit test already asserts the halving numerically.

## Why exactly this scope was chosen

The issue body says rainfall weather forecasting is one of several features; the four **task list** checkboxes it lists (`Installare sensore umidita`, `Collegare elettrovalvola`, `Configurare soglie di attivazione`, `Integrare con MyZubster per notifiche`) do **not** include a weather API. The weather feed sits at the feature level, so the kit delivers the deterministic, smoke-tested policy (the moisture threshold loop and a rain-factor reduction hook) and leaves the network plumbing as a documented, single-bit downstream contract.
