# Esempi di robot funzionanti

Three example builds that reuse recovered components end-to-end. Each maps donor parts to robot functions and lists build notes. All builds use a single ESP32 DevKit + a battery recovered per `recovery-guide.md`; wiring per `reconversion-schematics.md`.

## Esempio 1 - Evita-ostacoli (recycled)

A bump-and-avoid rover built from one recycled RC-car chassis + printer motors + a phone IR sensor + one recovered 18650.

| Function | Donor part | Reuse as |
|---|---|---|
| Chassis + wheels + gearbox | RC car toy | drive base |
| Drive motors (x2) | RC car gearbox DC motors | left / right tank drive |
| Proximity | Phone IR ambient-light sensor | front bumper sensor |
| Power | 1 x recovered 18650 | TP4056-protect + MT3608 -> 5V |
| Brain | ESP32 DevKit | DRV8833 PWM + IR read |
| Frame mounts | Building-block plates | sensor / ESP32 mounts |

Behavior: drive forward; when IR reads a near object, reverse one motor for 150 ms, spin, then resume. No networking, no signing.

Build notes:
- Wire the motors to a DRV8833 per `reconversion-schematics.md` (brushed DC section).
- IR sensor on GPIO4 (digital OUT, LOW = near).
- Power the ESP32 from the 5V boost rail (VIN).

## Esempio 2 - Seguilinea (recycled)

A line follower: a printer stepper + a toy chassis + a phone IR pair + a laptop 18650 pair (2S).

| Function | Donor part | Reuse as |
|---|---|---|
| Drive | Inkjet paper-feed stepper | drive (single wheel + idler) |
| Line sensors (x2) | TV-remote IR LEDs + receivers | left / right line detector |
| Power | 2 x recovered 18650 (7.4 V, matched + 2S BMS) | motor rail + ESP32 via a 5V step-down |
| Brain | ESP32 DevKit | step pulses + IR reads |
| Frame | Toy base + 3D bracket | mount |

Behavior: steer toward whichever IR sees the line; pulse the stepper forward at low current. Use the printer optical encoder wheel for speed feedback if needed.

Build notes:
- Stepper on A4988; STEP=GPIO5, DIR=GPIO17 (per schematics).
- IR line pair on GPIO4 + GPIO14.
- A 2S BMS is required (per the battery section); never run a 2S pack without balancing.

## Esempio 3 - Pinza semplice (recycled)

A small gripper actuator using a CD/DVD-tray motor + a toy linkage.

| Function | Donor part | Reuse as |
|---|---|---|
| Gripper actuator | CD/DVD drive tray DC motor + gearbox | open / close jaw |
| Jaw linkage | Toy / building-block hinges | mechanical jaw |
| Position sensor | Printer optical encoder strip | end-of-travel feedback |
| Power | 1 x recovered phone Li-Po (small load only) | actuator only |
| Brain | ESP32 DevKit | PWM jaw + read encoder |

Behavior: PWM the jaw motor to close until the encoder reads end-of-travel, stop, hold a moment, then reverse PWM to open. Useful as a small pick-and-place demo.

Build notes:
- Jaw motor on the DRV8833 second half-bridge.
- Encoder via PCNT (GPIO14 / GPIO27).
- The small Li-Po powers the actuator only; power the ESP32 separately from a 18650 + boost (per Example 1).

## Common notes

- Reused electronics are unpredictable - validate every recovered part on the bench before integration: does the motor run at the expected voltage? does the cell hold >=2.8 V rest? does the sensor voltage match Vdd? does the encoder produce pulses?
- Keep wiring modular: one part per connector, so a failed recovered part can be swapped without rework.
- All three examples are open-loop (no MyZubster / wallet / network integration) to stay inside the safe-harbor scope - they are hardware reference builds only.
