# Lista componenti riciclabili

Parts you can recover from scrap electronics for a MyZubster-compatible robot build.
Categories follow the issue source list. Each entry has a **reusable** flag (R reusable / NR not recommended), common specs, and safe-sourcing notes. Detailed safety handling is in `recovery-guide.md`.

## Motori da stampanti / asciugatrici

| Donor device | Recoverable part | R/NR | Common specs | Notes |
|---|---|---|---|---|
| Inkjet / laser printer | DC geared motor (printhead carriage) | R | 6-12 V DC, 2-wire brushed | Often 6V; test polarity, decent low-speed torque for a drive wheel |
| Inkjet printer | Stepper motor (paper feed) | R | 5-12 V, 4-6 wire bipolar/unipolar | Use A4988 (bipolar) or ULN2003 (unipolar); identify coil pairs with a multimeter |
| Printer | Encoder strip + slotted wheel (optical) | R | optical quadrature | Good for odometry / wheel speed feedback |
| Dryer / washing machine | Universal AC motor | NR | 230 V AC mains | mains-rated - NOT usable on a battery robot; do not recover for safety |
| Dryer | Small DC blower motor | R | 12-24 V DC, 2-wire | higher voltage; runs slow on 7.4V, ok for a fan |
| CD / DVD drive (tray) | Small brushed DC + gearbox | R | 3-6 V DC, 2-wire | compact, good for a small gripper / actuator |

Reusable motors: low-voltage brushed DC (<=24 V) and bipolar/unipolar steppers (<=12 V) with identifiable coil pairs. Avoid any mains-rated or AC-only motor.

## Batterie da vecchi laptop

| Donor device | Recoverable part | R/NR | Common specs | Notes |
|---|---|---|---|---|
| Laptop pack | 18650 Li-ion cell (individual) | R | 3.7 V nominal, 1800-3000 mAh | recover ONE cell at a time; test rest voltage >=2.8 V; discard swollen/damaged |
| Laptop pack | Small BMS protection board | R | DW01 + dual-FET style | usable as a single-cell protection circuit |
| Old phones / tablets | Small Li-Po pouch | R | 3.7 V, 300-1500 mAh | treat as suspect; charge on a fireproof surface with TP4056; monitor temperature |

Battery recovery is the highest-risk step. Only recover a cell that holds a rest voltage in [2.8 V, 4.2 V], shows no swelling, no corrosion, no puncture, and comes from a pack stored <=2 years. Full handling rules are in `recovery-guide.md`.

## Sensori da vecchi telefoni

| Donor device | Recoverable part | R/NR | Common specs | Notes |
|---|---|---|---|---|
| Old smartphone | IR proximity / ambient-light sensor | R | digital or analog, 1.8-3.3 V | proximity / line detection; check Vdd tolerance first |
| Smartphone | Accelerometer + gyro (MPU6050-class) | R | I2C, 3.3 V | often on a tiny flex PCB; wire SDA/SCL + Vdd + GND |
| Smartphone | Camera module | NR | MIPI-CSI flex, controller-dependent | hard to reuse without the original SoC; avoid for a simple build |
| Old phone | Vibrator motor (eccentric DC) | R | 2-3.6 V DC, 2-wire | tiny brushed motor - useful as a small actuator / haptic |
| TV remote / phone IR | IR LED + receiver pair | R | 940 nm IR, digital | pair for a beam-break proximity sensor |

Phone-flex sensors often expect 1.8 V. Confirm with donor-board markings; if it is a 1.8 V part, add a level shifter (or a series resistor divider) before the 3.3 V ESP32 GPIO.

## Telaio da vecchi giocattoli

| Donor device | Recoverable part | R/NR | Common specs | Notes |
|---|---|---|---|---|
| RC car / toy chassis | Plastic frame + wheel mounts | R | free geometry | best donor for a recycled chassis; often already has motor mounts |
| Toy gearbox | Geared DC motor + wheels | R | 3-6 V DC, 2-wire, plastic gearbox | matched motor+wheel+mount from one donor |
| Building-block toys | Plastic bricks / plates | R | interlocking | useful for ad-hoc sensor mounts and prototypes |
| Toy robot shell | Decorative shell | R | aesthetic | cosmetic enclosure only, not structural |

A toy RC-car chassis already provides a matched motor + wheel + gearbox + mount - the single most productive donor for a recycled robot.

## Reuse heuristics

- Prefer low-voltage brushed DC (<=24 V) and <=12 V steppers over any mains-rated motor.
- Recover 18650 cells individually and re-protect; never re-use a whole unchecked pack.
- Confirm a salvaged sensor's Vdd (1.8 V vs 3.3 V) before wiring to a 3.3 V ESP32; use a level shifter if unsure.
- A toy RC-car chassis is the highest-value single donor (matched drive train + frame).
