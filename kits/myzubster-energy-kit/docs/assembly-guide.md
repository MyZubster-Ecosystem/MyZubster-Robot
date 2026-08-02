# Charging Station Assembly Guide

Bounty #85 -- assembly guide for the MyZubster energy independence kit.

## Parts

- 1x charging station body (`openscad/charging-station.scad`, printed in PETG)
- 1x docking funnel (`openscad/docking-funnel.scad`, printed in PETG)
- 4x pogo pin charging contacts (P75-B2 or equivalent, 4 mm diameter)
- 4x M3 x 12 mm bolts + nuts
- 1x ESP32 dev board (for the station-side controller, optional)
- 1x XT60 or barrel jack connector (for the station power input)

## Assembly steps

1. Print both OpenSCAD parts in PETG at 50% and 30% infill respectively.
2. Press-fit the four pogo pins into the contact holes on the charging station pad. The holes are sized for 4 mm pins with a friction fit; use a dab of epoxy if needed.
3. Mount the docking funnel on top of the charging station. The four alignment slots in the funnel correct for approach-angle error up to about 15 degrees, letting the robot self-center.
4. Wire the pogo pins to the station-side ESP32 or a direct 5 V / 2 A supply. No data pins are required for pure charging; the station controller is optional.
5. Secure the charger to a flat surface using the four corner bolt holes (M3).
6. Place the assembly at the end of the robot's patrol route. The `navigatorToDock` helper computes bearing and distance so the robot can find it from up to 10 m away.

## Robot-side contacts

The robot needs two flat contact plates on its underside that align with the pogo pin spacing (14 mm center-to-center). The `dockingStateMachine` helper manages the connect sequence once the contacts are aligned.
