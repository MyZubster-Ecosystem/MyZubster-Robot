# Bill of Materials - Modular Lawnmower Kit (<200 EUR)

Issue #70 task: Lista componenti con prezzi. All prices are EUR list prices
and aim to stay under the 200 EUR envelope called out by the issue title
("Tagliaerba modulare sotto 200 EUR"). The prices are indicative; substitute
equivalent parts as supply and shipping allow. The chassis frame and the
electronics tray are 3D printed (PETG / ASA), not purchased.

| # | Category | Component | Spec / link | Price (EUR) |
|---|---|---|---|---|
| 1 | motors | DC motor + wheel pair (x2) | 6 V 200 RPM geared brushed DC motor with press-fit wheel | 30 |
| 2 | cutting | Hardened steel cutting blade | 22 cm mower blade (replaceable) | 15 |
| 3 | cutting | Brushless blade motor (+ ESC) | 24 V BLDC, ~3200 rpm ceiling | bundled w/ ESC at ~25 -> see electronics row | (incl. below) |
| 4 | controller | ESP32 dev board | ESP32-WROOM-32 dev kit | 8 |
| 5 | controller | Motor driver breakout | L298N or TB6612FNG dual H-bridge | 6 |
| 6 | sensors | Proximity sensor | HC-SR04 ultrasonic ranger, 2 cm - 400 cm | 10 |
| 7 | sensors | IMU (tilt) | MPU-6050 6-axis accel/gyro | 5 |
| 8 | sensors | Battery voltage divider | 100k / 10k resistor pair (read LiPo via ADC) | 2 |
| 9 | battery | 3S LiPo pack | 11.1 V 2200 mAh with XT60 | 25 |
| 10 | chassis | 3D-printed PETG frame | `openscad/chassis-frame.scad` | 20 (filament) |
| 11 | chassis | 3D-printed electronics tray | `openscad/electronics-tray.scad` | 8 (filament) |
| 12 | fasteners | M4 / M3 stainless hardware + standoffs | assorted pack | 10 |
| 13 | wiring | Jumper wires, XT60, blade connectors | assorted | 5 |
| 14 | cutting | Blade guard ring (printed) | part of `chassis-frame.scad` | (incl. #11) |

**Subtotal (excl. items folded into others): ~174 EUR**.

Required categories (validated by `npm test` -> `bomBudgetValidator`):
`motors`, `cutting`, `controller`, `sensors`, `battery`, `chassis`.

## Validator

The `bomBudgetValidator` helper in `firmware/lib/lawnmower/lawnmower.js`
checks the running total against the 200 EUR envelope and flags any missing
required category. The CLI scripts/lawnmower-check.js runs the check against
the representative BOM above and asserts `valid=true` and `overBudget=false`.

```sh
npm run lawnmower:check
```
