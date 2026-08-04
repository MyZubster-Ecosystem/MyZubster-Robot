# Assembly Guide - Modular Lawnmower Kit

Issue #70 task: Disegnare il telaio (STL per stampa 3D). This guide covers
printing the chassis frame and electronics tray, snap-fitting the modular
frame, mounting the motors and cutting deck, and routing the wiring.

## Print the parts

1. Open `openscad/chassis-frame.scad` and slice in your preferred slicer (PrusaSlicer / Cura).
   - Filament: PETG (or ASA for outdoor use). 100% infill, 0.2 mm layers, 4 perimeters.
   - The frame fits on a 220 mm print bed; if your bed is smaller, print the two side rails separately (OpenSCAD has them as named modules).
2. Open `openscad/electronics-tray.scad` and print with the same settings.
3. Print the four M3 tether blocks (`openscad/electronics-tray.scad -> tether_holes`) and snap-fit tabs for the chassis corners.

## Snap-fit the modular chassis

4. Broach the four snap-fit tabs on the chassis frame. The two side rails snap together via the cross beams - 3 cross beams in the default (parametrically tunable).
5. Bolt the four motors to the motor-mount cups with M4 hardware. Each motor mount has the 3-bolt circle (120 deg spacing) already modelled.
6. Mount the cutting blade to the BLDC motor shaft. Use the safety adapter provided by the blade manufacturer; never print the blade.

## Mount the electronics tray

7. Place the electronics tray above the rear cross beam. Use the four M3 tether holes on the tray corners to fix it to the chassis cross beam via four standoffs.
8. Drop the ESP32, motor driver, and LiPo into their respective pockets and route the cables out the short-end slits.

## Wire up

9. Follow `wiring-guide.md` for the full schematic. The single ground node is the most important detail - tie the LiPo GND, motor driver GND, buck GND, and ESP32 GND together at one bolt.

## Park blade interlocks

10. The firmware `obstacleGuard` helper disarms the blade when the IMU tilt exceeds 25 deg (default `tiltStopDeckDeg`), or when the ultrasonic reports an obstacle closer than 150 mm (default `obstacleStopMm`). Both thresholds are tunable via the `opt` argument and stay deterministically unit-tested.

## Test (no hardware)

```sh
cd kits/myzubster-lawnmower-kit
npm install
npm test               # 48 jest tests
npm run lawnmower:check # headless simulation, exit 0
```

## Safe harbor

No cryptocurrency generation, wallet signing, mainnet broadcast, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain logic is included. No WiFi, Bluetooth, or API calls. GPS, if added later, is receive-only satellite downlink. Same pattern as #71 / #74 / #76 / #85 kits.
