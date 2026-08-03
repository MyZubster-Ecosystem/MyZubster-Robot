# Station Assembly Guide (Assembly-Line Kit)

Bounty #80 -- assembly guide for the MyZubster assembly-line station kit.

## 3D-printed parts

| File | Part | Material | Infill | Notes |
|------|------|----------|--------|-------|
| `openscad/assembly-station.scad` | Assembly station jig | PETG/ABS | 80% | Cradle holds child chassis; conveyor nubs align track. |
| `openscad/conveyor-track.scad` | Conveyor track segment | PETG | 50% | Timing belt + guide rails, NEMA17 drive. |
| `openscad/tool-head.scad` | End-effector tool head | PETG | 60% | Swappable gripper + spring probes for flash dock. |

## Assembly steps

1. Print 6 station jigs + enough conveyor track segments to span the line.
2. Bolt each station to the bench; connect conveyor tracks between stations via alignment nubs.
3. Mount the NEMA17 stepper at one end of the conveyor; thread the timing belt through each track segment.
4. Attach the tool head to the arm wrist mount pin at each station.
5. Calibrate the arm to the cradle center on each station using the limit switches.
6. Run `npm test` and `npm run line:check` to validate the line firmware before powering the line.
