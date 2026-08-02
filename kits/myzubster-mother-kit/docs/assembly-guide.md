# Assembly Guide (Mother-Robot Kit)

Bounty #78 -- assembly guide for the MyZubster mother-robot kit.

## 3D-printed parts

| File | Part | Material | Infill | Notes |
|------|------|----------|--------|-------|
| `openscad/mother-chassis.scad` | Expandable modular chassis | PETG/ABS | 80% | Base plate + dual expansion rails for arm + magazine attachment. |
| `openscad/assembly-arm.scad` | 3-DOF mechanical arm | PETG | 60% | Base + shoulder + elbow links with joint bearings. Use metal shafts. |
| `openscad/component-magazine.scad` | 6-slot component magazine | PETG | 80% | Geneva-style rotating disk driven by 28BYJ-48 stepper. |

## Print settings

- Layer height: 0.2 mm
- Wall loops: 3
- The arm links print best flat (link face down) for layer strength along the arm axis.
- The magazine disk prints best face-up with a brim; the 6 slot bores should be reamed to clean dimension after printing.

## Assembly steps

1. Bolt the chassis base plate to the robot drive platform using 4 M3 bolts at the corners.
2. Slide the assembly-arm base column into the left T-slot expansion rail; tighten 2 M3 T-nuts.
3. Insert 8 mm shaft + bearings through the shoulder and elbow joints; lock with M3 grub screws.
4. Mount the gripper servo (SG90) onto the gripper mount plate at the forearm end.
5. Mount the component-magazine flange into the right T-slot; attach the 28BYJ-48 stepper to the central shaft.
6. Wire the ESP32 to the arm steppers (3x DRV8833 drivers), gripper servo, magazine stepper, and welder head servo. See `docs/component-selection.md` for pin mapping.
7. Run `npm test` and `npm run mother:check` to validate the firmware logic before powering the motors.
