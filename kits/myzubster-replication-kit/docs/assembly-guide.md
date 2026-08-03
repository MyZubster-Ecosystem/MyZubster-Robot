# Assembly Guide - MyZubster Self-Replication Kit (issue #73)

> Istruzioni per l'assemblaggio di una copia del robot MyZubster con moduli
> intercambiabili. Each step maps to an entry in the firmware
> `assemblySequencePlanner` output - both the planner order and this guide follow
> the same dependency chain: chassis first, motors, wheels, controller, sensors,
> firmware flash, then power-on validation.

## 1. Print the interchangeable modules

1. Slice `openscad/modular-chassis-block.scad` (0.2 mm layers, 30% infill).
2. Slice `openscad/part-magazine.scad` (0.2 mm layers, 20% infill) to hold the
   kit of modular parts for one replication run.
3. Fit each printed socket with an M3 nut insert (snap-fit tolerance in the SCAD
   defaults to 0.25 mm; calibrate for your printer).

## 2. Pin a chassis module

- Step `pick`: retrieve the printed chassis block from the magazine.
- Lay it flat; the four corner motor towers and the center motherboard seat
  should face up.

## 3. Mount the motors

- Step `mount` (x2): press each TT gearmotor into a corner motor tower. The
  `M3` plug fits the tower socket; a single stainless M3x10 screws fix the ring.
  Verify free rotation before proceeding.

## 4. Seat the wheels

- Step `seat` (x2): press-fit each 65 mm wheel onto a motor shaft. The `snap-fit`
  plug engages the shaft shoulder; align the D-flat if your shaft has one.

## 5. Install the ESP32 motherboard

- Step `install`: seat the ESP32 DevKit into the center motherboard slot
  (`GPIO-header` + `USB-C`). A press-fit is enough to locate the board; do not
  solder it - a replication run must be able to swap the board back out.

## 6. Plug the modular sensors

- Step `plug` (x3): connect the VL53L0X ToF sensors using the magnetic plug.
  Orientation is rotation-insensitive (the socket accepts the plug either way);
  seat each until the magnet clicks.

## 7. Flash the clonable firmware

- Step `flash`: write the firmware image to the spawned ESP32 from the parent
  robot. This is a documentation-only `firmwareCloneSpec` (reference checksum, no
  signing) - see `clonable-firmware-spec.md`. No key material is exchanged.

## 8. Power-on validation

- Step `validate`: power the copy from the 18650 cell. Run the power-on self
  test: confirm each module is recognized (part identity), the firmware
  checksum matches the parent manifest, and both wheels rotate. The firmware
  `replicationValidator` performs exactly this check deterministically.

A successful `validate` step means one replication cycle is complete; the parent
robot returns to `IDLE` for the next copy (see the 7-state `selfReplication-
Controller` FSM in `replication.js`).
