# Solenoid irrigation valve + driver (task: Collegare elettrovalvola)

Covers task #74 task list entry **"Collegare elettrovalvola"** (connect the solenoid valve) and the feature **"Irrigazione automatica a goccia"** (automatic drip irrigation). The robot actuates the irrigation valve directly off its GPIO, which means we cannot switch a mains solenoid from a 5 V pin - we drive a small **logic-level MOSFET** that switches the higher-current solenoid loop on and off. This is the same "use a transistor to switch a higher-current load" pattern that the **#75 DIY kit** uses for its motor driver.

## Driver circuit (low-side N-channel MOSFET)

```text
  ESP32 GPIO25 (PIN_VALVE_EN) ----+
                                  |
                              220R series resistor
                                  |
                                  +------> GATE  (Q1: IRLZ44N or AO3400 logic-level)
                                  |
                              10k pull-down to GND (off when MCU resets)

  SOLENOID+ ---- 12V/24V supply
  SOLENOID- ---- DRAIN

  12V/24V supply GND ---- GND (common rails with ESP32 GND)
                  |
                protection diode across the solenoid coil (1N4007, cathode to rail+)
```
- The **1N4007 flyback diode** is placed *across the solenoid*, cathode to the supply rail, so the inductive spike from opening the valve is clamped and does not punch through the MOSFET drain.
- The **10k gate-to-source pull-down** ensures the valve is *closed* if the ESP32 reset line drifts, mirroring the "failsafe OFF" safety in the kit firmware.
- A **220R series gate resistor** limits fast switching inrush so the ESP32 regulator does not brown out when the gate capacitance charges.

## Pin map

| Function | ESP32 pin | Direction | Level |
|---|---|---|---|
| Valve enable (`PIN_VALVE_EN`) | GPIO25 | output | HIGH = valve OPEN, LOW = valve CLOSED |
| Moisture sensor | GPIO34 (ADC1_CH6) | input | ~1.2-3.0 V analog |
| Current sense | GPIO35 (ADC1_CH7) | input | shunt amp output |

## Valve selection

A 12 V latching solenoid is preferred over a normally-open continuous-current valve:

- **Latching (low-power):** a short pulse opens, a reverse pulse closes. Quiescent draw = 0 between pulses - ideal for the energy-monitoring narrative.
- **Normally-closed continuous:** the valve draws ~200 mA while energised. The kit's energy math assumes this class because it gives a cleaner per-cycle mWh figure and matches an off-the-shelf drip valve kit. Calibrate the `VALVE_MA` constant in `scripts/agri-check.js` for your valve.

## Control strategy (single cycle per tick)

`firmware.ino` follows the policy validated by `agri.js::valveControl`:

1. Sample the moisture sensor every `SENSOR_INTERVAL_MS` (default 60 s).
2. Compute `moisturePct = moisturePercent(raw)`.
3. If `moisturePct < DRY_THRESHOLD` (default 30%), open the valve for `deficit * 1000ms * weatherFactor` ms, capped at `MAX_VALVE_MS` (60 s).
4. Else keep the valve closed until the next sample tick. The `WET_THRESHOLD` (60%) sits as the upper hysteresis edge: once soil reaches it, the decision stays "wait" all the way down to `DRY_THRESHOLD`, so the valve stays closed through a normal post-rain soak.
5. Between consecutive cycles a `SOAK_OFF_MS` (60 s) pause lets the water percolate, so a single tick never floods the bed.

## Energy contribution per cycle

A normally-closed solenoid at 12 V draws about 200 mA. The estimator in `agri-check.js` samples that as `{voltage_mV: 5000, current_mA: 200, duration_ms: <open time>}` per cycle - pulling it out as a single sample per cycle keeps the energy sum robust to valve-on duties that aren't a power-of-two divisor of the tick interval. The shunt + amp current-sense wiring is documented separately in `docs/notification-architecture.md` so the implementer can do a single kill-amp calibration.

## Why no PWM on the valve

Drip valves are on/off devices; PWM-ing the coil produces buzzing (audible) and large back-EMF spikes (diode stress) for no flow benefit, since the valve orifice is fixed. If you want progressive water delivery you add a second nozzle stage downstream rather than modulating the coil - this kit documents the cleanest digital interface.
