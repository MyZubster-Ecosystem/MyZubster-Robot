# Energy consumption monitoring

Reference for the **Monitoraggio consumo energetico** task (issue #71).

The firmware reads a current-sense shunt on an ESP32 ADC pin and accumulates energy in fixed-point microJoules (`totalMicroJoules`), convertible to milliWatt-hours via `energyMilliWattHours()`. The same math is unit-tested as `accumulateEnergy()` in `firmware/lib/eco/eco.js`.

## Wiring (current sense)

    Battery+ --- [ motor + driver ] --- motor- --- GND
    0.1 ohm shunt in the motor return path
    ESP32 ADC (GPIO34) --- shunt high side --- GND
    add an RC low-pass (e.g. 1k + 1uF) across the ADC input to smooth PWM ripple

Notes:
- Shunt: 0.1 ohm precision resistor in the motor return path.
- ADC: ESP32 GPIO34 (input-only, ADC1_CH6), 12-bit, 0..3.3 V.
- An RC low-pass smooths the PWM ripple so the ADC sees an average current.

## ADC -> current math

    shunt_mV = (adc_raw / 4095) * 3300 * ADC_GAIN
    i_mA     = (shunt_mV / (shunt_ohms * 1000)) * 1000    // mV / ohm -> mA

Calibrate `ADC_GAIN` against a known load (bench supply + ammeter) once; the default `1.0` is a placeholder.

## Energy accumulation (fixed point)

Per sample:

    uJ += (VCC_mV * i_mA * dt_ms) / 1000

Running total:

    mWh = totalMicroJoules / 3_600_000

Why fixed-point uJ: integer accumulation is deterministic and survives long runs without float drift, and the `/1000` keeps the per-sample term inside a `uint64_t` for realistic campaign lengths. The unit test `1 h @ 3.3 V / 100 mA => 330 mWh` pins the conversion (uJ = 3300 * 100 * 3_600_000 / 1000 = 1_188_000_000; mWh = 1_188_000_000 / 3_600_000 = 330).

## Reading the estimate

    float mWh = energyMilliWattHours();   // print to Serial / log

Log `mWh` every minute; the difference between two reads is the energy spent over that minute. The `npm run eco:check` scenario in `scripts/eco-check.js` runs the same estimator on a 1-hour active+idle timeline and reports the savings.
