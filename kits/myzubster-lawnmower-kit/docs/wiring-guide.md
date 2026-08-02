# Wiring Guide - Modular Lawnmower Kit

Issue #70 task: Schemi elettrici e wiring. This is a text-only schematic; no
ASCII art is included to keep the description unambiguous. Part reference
labels match the BOM in `bom.md`.

## Power rails

- Battery: 3S LiPo (`B1`, 11.1 V nominal, XT60). 2000 mAh gives ~30 min mow + spare.
- Main power switch (`SW1`) sits between the LiPo negative lead and the chassis GND. Power the motor driver off the raw LiPo positive rail.
- 5 V buck regulator (`U3`, e.g. LM2596) drops 11.1 V -> 5 V for the ESP32 + sensors. 3.3 V LDO is provided by the ESP32 onboard regulator.
- Common ground: tie the LiPo negative rail, motor driver GND, buck GND, and ESP32 GND together at the same node to avoid ground loops.

## ESP32 (`U4`, ESP32-WROOM-32) pin assignment

| Pin | Function | Connects to |
|---|---|---|
| GPIO 25 | Left motor PWM | `U5` L298N IN1 / ENA |
| GPIO 26 | Left motor direction | `U5` L298N IN2 |
| GPIO 27 | Right motor PWM | `U5` L298N IN3 / ENB |
| GPIO 14 | Right motor direction | `U5` L298N IN4 |
| GPIO 13 | Blade motor ESC signal | `U6` BLDC ESC (PWM 50 Hz) |
| GPIO 12 | Ultrasonic trigger | `U7` HC-SR04 TRIG |
| GPIO 33 | Ultrasonic echo | `U7` HC-SR04 ECHO (via 1k/2k divider to 3.3 V) |
| GPIO 21 / 22 | IMU I2C SDA / SCL | `U8` MPU-6050 |
| GPIO 34 (ADC1_CH6) | Battery voltage divider midpoint | `R1`/`R2` (100k / 10k on LiPo+) |

## Motor driver (`U5`, L298N or TB6612FNG)

- VMOT -> LiPo positive rail (after `SW1`).
- VLOG -> 5 V buck output.
- IN1/IN2/ENA -> ESP32 left-motor pins (left wheel pair wired in parallel; both left motors share one channel because they turn together in skid-steer).
- IN3/IN4/ENB -> ESP32 right-motor pins (right wheel pair likewise).
- OUT1/OUT2 -> left motor + and -; OUT3/OUT4 -> right motor + and -.

## Blade motor (`U6`)

- A 24 V BLDC outrunner spinning the 22 cm blade (≤3200 rpm per the `bladeMaxRpm` default in `firmware/lib/lawnmower/lawnmower.js`).
- ESC signal on GPIO 13. Single ground shared with the chassis GND node.
- ESC BEC (if present) is ignored; the ESP32 is powered by `U3`.

## Sensors

- `U7` HC-SR04: VCC 5 V, GND chassis GND, TRIG GPIO 12, ECHO divided to 3.3 V before GPIO 33 (HC-SR04 echoes 5 V otherwise).
- `U8` MPU-6050: VCC 3.3 V, GND chassis GND, SDA/SCL -> GPIO 21 / 22 (internal ESP32 pull-ups + 4.7 k external pull-ups to 3.3 V).
- `R1`/`R2` voltage divider: LiPo+ through 100 k -> midpoint -> GPIO 34; midpoint -> 10 k -> LiPo-. Voltage at midpoint = 11.1 * 10 / 110 = ~1.01 V which gives ~950 in raw 12-bit ADC.

## Fusing

- 7 A automotive mini-blade fuse on the main positive lead right after the LiPo.
- The blade ESC and motor driver each ride their own branch. Keep all power wires under 30 cm so voltage drop is negligible at these currents.

## Safe harbor

No wallet hardware, no Monero RPC node, no key material, and no network calls exist in this wiring. The x402 payment is referenced by the firmware spec only - its wiring would live entirely on the gateway, not on this ESP32.
