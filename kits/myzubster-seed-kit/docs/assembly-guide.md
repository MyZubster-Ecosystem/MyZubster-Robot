# Assembly guide

## Parts list

| Part | Qty | Source |
|------|-----|--------|
| Dibber (printed) | 1 | openscad/dibber.scad |
| Seed hopper disk (printed) | 1 | openscad/seed-hopper.scad |
| Soil cover blade (printed) | 1 | openscad/soil-cover.scad |
| SG90 servo (dibber) | 1 | standard hobby servo |
| SG90 servo (cover) | 1 | standard hobby servo |
| 28BYJ-48 stepper + ULN2003 | 1 | seed dispenser motor |
| ESP32 dev board | 1 | microcontroller |
| Capacitive soil moisture sensor | 1 | growth monitoring |
| DS18B20 temperature sensor | 1 | growth monitoring |
| Neo-6M GPS module | 1 | position detection |
| Chassis mounting plate | 1 | 3D printed or laser-cut |

## Print settings

All OpenSCAD models should be printed with:
- Layer height: 0.2 mm
- Infill: 100% (structural parts)
- Material: PETG recommended (UV + moisture resistance); PLA acceptable for testing
- Print the dibber tip-down for best overhang results
- Print the seed hopper disk-down (hub-up)
- Print the soil cover blade flat on the build plate

## Assembly steps

1. **Dibber**: Mount the dibber shaft onto the SG90 servo horn using an M4 bolt through the dibber mounting hole. The servo should be mounted on the chassis so the dibber points downward when at rest (90 degrees).

2. **Seed hopper**: Slide the hopper disk onto the 28BYJ-48 stepper shaft and tighten the M3 set screw. Mount the stepper below the hopper so one seed drops per slot revolution. Position a seed drop tube below the hopper to guide the seed into the hole.

3. **Soil cover**: Mount the cover blade on the second SG90 servo horn using an M2.5 screw. The servo should be mounted so the blade retracts at 110 degrees and sweeps forward to push soil at 40 degrees.

4. **Wiring**: See sensor-wiring.md for the moisture, temperature, GPS, and motor connections to the ESP32.

5. **Firmware**: Upload the firmware to the ESP32. The firmware uses the pure-JS helpers in firmware/lib/seed/seed.js for all decision logic.

## Calibration

Before field use:
- Calibrate the GPS module on a known point and verify the NMEA parser against your local GGA sentence.
- Set the dibber servo trim so that 90 degrees = fully raised and 20 degrees = fully inserted at your desired hole depth.
- Tune the seed hopper slot diameter for your specific seed size.
- Calibrate the capacitive moisture sensor raw-to-percent mapping for your soil type.
