# Component Selection (Selezionare componenti per assemblaggio)

Bounty #78 task: "Selezionare componenti per assemblaggio (motori, braccio, sensori)."

## Motors

| Motor | Role | Interface | Qty |
|-------|------|-----------|-----|
| N28 stepper (200 steps/rev) | Arm base + shoulder + elbow joints | DRV8833 | 3 |
| 28BYJ-48 stepper (4096 steps/rev) | Magazine rotation indexer | ULN2003 | 1 |
| SG90 servo | Gripper open/close | PWM | 1 |
| SG90 servo | Welder head deploy/retract | PWM | 1 |
| N20 gearmotor x2 | Mother chassis drive | motor driver | 2 |

## Sensors

| Sensor | Role | Interface | Qty |
|--------|------|-----------|-----|
| Limit switch (OMRON D2F) | Arm home position + magazine home | GPIO pull-up | 4 |
| VL53L0X ToF rangefinder | Arm reach verification at gripper | I2C | 1 |
| ESP32-WROOM-32 | Mother + child controller | — | 2 |

## Why these parts

The N28 motors give 200 steps/rev for precise arm joint positioning, and the configurable gear ratios in the firmware DEFAULTS let you tune torque vs speed. The 28BYJ-48 is cheap and widely available for magazine indexing. The SG90 servos handle the simple binary gripper + welder actions. The VL53L0X verifies component placement at the gripper tip without camera calibration, keeping the firmware logic fully unit-testable.
