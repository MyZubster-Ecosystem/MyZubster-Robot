# Assembly Guide (Garden-Automation Kit)

Bounty #76 -- assembly guide for the MyZubster garden-automation robot kit.

## 3D-printed parts

| File | Part | Material | Infill | Notes |
|------|------|----------|--------|-------|
| `openscad/cutting-deck.scad` | Grass cutting deck housing | PETG/ASA | 100% | Holds brushless mower motor + blade guard. Use a hardened steel blade, not a printed one. |
| `openscad/sprinkler-nozzle.scad` | Irrigation sprinkler nozzle | PETG | 80% | 1/2" BSP riser. Verify water flow before connecting supply. |
| `openscad/weed-probe.scad` | Weed detection probe mount | PLA/PETG | 50% | Optical + ultrasonic sensors face-down at the canopy. |

## Print settings

- Layer height: 0.2 mm
- Wall loops: 3
- Print the cutting deck tip-down (it has built-in overhang support from the ring).
- The sprinkler nozzle fan slots are 0.8 mm wide; calibrate your extrusion flow so the slots print clean.

## Assembly steps

1. Press the brushless mower motor into the cutting-deck central bore; secure with 3 M4 bolts on the 42 mm bolt circle.
2. Install the hardened steel blade on the motor shaft (use the manufacturer's blade retaining clip; don't print a blade).
3. Thread the sprinkler nozzle onto a 1/2" BSP riser; hand-tighten only.
4. Seat the optical sensor in the weed-probe mount bore (retention sleeve) and the ultrasonic canister alongside.
5. Bolt the weed-probe mount to the chassis with two M3 bolts on the bolt circle, sensors facing the canopy.
6. Run `npm test` and `npm run garden:check` to validate the firmware logic before powering the motors.
