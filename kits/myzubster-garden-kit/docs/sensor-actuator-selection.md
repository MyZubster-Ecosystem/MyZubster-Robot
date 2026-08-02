# Sensor & Actuator Selection (Scegliere sensori e attuatori)

Bounty #76 task: "Scegliere sensori e attuatori."

## Sensors

| Sensor | Role | Interface | Qty |
|--------|------|-----------|-----|
| Capacitive soil moisture sensor (v1.2) | Mower rain-guard + irrigation override | analog ADC | 1 |
| HC-SR04 ultrasonic rangefinder | Plant height probe (weed classifier input) | GPIO (trig/echo) | 1 |
| OV2640 / GC0328 camera module | Green-density vision input (weed classifier) | ESP32 camera bus | 1 |
| DS18B20 temperature probe | Soil temperature for irrigation scheduling | 1-Wire | 1 |

## Actuators

| Actuator | Role | Interface | Qty |
|----------|------|-----------|-----|
| Brushless mower motor (e.g. BLDC 7015) | Grass cutting blade drive | PWM/ESC | 1 |
| 12 V solenoid irrigation valve | Override watering window | GPIO driver (MOSFET) | 1 |
| SG90 servo | Mower deck height (lift/cut toggle) | PWM | 1 |
| N20 gearmotor x2 (drive) | Boustrophedon path traversal | motor driver (DRV8833) | 2 |

## Why these parts

The capacitive moisture sensor is chosen over resistive because it doesn't corrode in soil. The ultrasonic height probe gives the deterministic height input the `weedClassifier` consumes, so the classifier stays fully unit-testable without camera calibration. The OV2640 provides the green-density signal; its output is reduced to a 0-1 scalar before it reaches `weedClassifier`, keeping the firmware helper pure and hardware-agnostic.
