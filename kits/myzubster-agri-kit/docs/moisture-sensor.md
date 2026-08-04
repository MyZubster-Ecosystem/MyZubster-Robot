# Capacitive soil-moisture sensor (task: Installare sensore umidita)

Covers task #74 task list entry **"Installare sensore umidita"** (install the moisture sensor) and the feature **"Sensore umidita terreno (capacitivo)"** (capacitive soil-moisture sensor). A capacitive probe resists corrosion far better than the older resistive fork probes - no exposed metal electrodes are placed in contact with wet soil; the sensing element is a copper-polyimide plate behind the conformal coating, and the variable reads out as a ~1.5V..3.0V analog signal that *increases* with drier soil (the dielectric of wet soil pulls the RC oscillator faster).

| Property | Value |
|---|---|
| Sensor class | Capacitive soil-moisture v1.2 (typical An interpolated-label part) |
| Operating voltage | 3.3 V - 5 V (this kit assumes 3.3 V on the ESP32 ADC) |
| Output range | ~1.2 V saturated -> ~3.0 V bone dry |
| ADC resolution | 12-bit (0..4095), `analogReadResolution(12)` in setup |
| Dry raw (`DRY_RAW`) | 3500 |
| Wet raw (`WET_RAW`) | 1300 |
| Moisture percent formula | `clamp(((DRY_RAW - raw) / (DRY_RAW - WET_RAW)) * 100, 0, 100)` |

## Wiring

| Sensor pin | ESP32 pin | Note |
|---|---|---|
| VCC | 3V3 | Same rail as the MCU - do not power the sensor from 5V if the ADC vref is 3.3 V or you'll saturate the dry edge |
| GND | GND | Common ground |
| AOUT | GPIO34 (ADC1_CH6) | Capacitive analog output; ADC1 channel so it keeps working with WiFi enabled (not used by this kit) |

GPIO34 is input-only on the ESP32 - fine for an analog sensor.

## Calibration

The default `DRY_RAW = 3500` and `WET_RAW = 1300` match a v1.2 sensor at 3.3 V on a 12-bit ADC. Recalibrate against your own soil:

1. **Dry reading**: suspend the probe in air for 60 s, log `analogRead(PIN_MOISTURE)`. Multi-sample median of ~64 reads is recommended (ESP32 ADC noise supress).
2. **Wet reading**: submerge the active tip 30 mm in saturated-but-drained potting soil and log again.
3. Edit `DRY_RAW` and `WET_RAW` in `firmware.ino`. Mirror the new calibration in `firmware/lib/agri/agri.js` (`DEFAULTS.dryRaw / wetRaw`) so the unit tests and the `agri-check` scenario stay consistent.

## Reading the result

`moisturePercent()` returns `0` when the soil reads at-or-above the dry edge and `100` when at-or-below the wet edge. The mapping is intentionally inverted (higher voltage = dryer soil). Readings are linear inside the calibrated band and clamped outside it, so a disconnected sensor (rail = 3V3 -> raw ~4095) reports as 0% moisture, which (correctly) triggers irrigation rather than silently under-watering.

## Sample-based policy

The unit-tested `agri.js::moistureToPercent` is the canonical formula - `firmware.ino::moisturePercent` mirrors it in fixed-point. The test suite pins the dry/saturated/midpoint/custom-band cases (4 tests) so any future drift in calibration math is caught.

## Energy cost of sensing

The capacitive probe draws ~5 mA while powered continuously. The kit reads it once per `SENSOR_INTERVAL_MS` (60 s default) and accumulates the quiescent draw as part of `energyMilliWattHours()` (see `firmware.ino::addEnergySample` for the idle sample). See `docs/irrigation-valve.md` for the per-cycle pump/valve estimate and `docs/weather-integration.md` for the conservative no-rain weather hook.
