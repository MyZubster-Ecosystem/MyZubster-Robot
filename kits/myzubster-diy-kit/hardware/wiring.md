# MyZubster DIY Kit — Wiring

ASCII wiring reference + ESP32 DevKit V1 pin map. Targets the BOM in [`BOM.md`](../BOM.md). Replace jumper wires / mini-breadboard to taste; all logic is 3.3V from the ESP32.

## Pin map (ESP32 DevKit V1)

```
ESP32 Pin   DIR  Signal
----------  ---  -----------------------------------
GPIO 13     OUT  Status LED (B: Start / Bump / Motor)
GPIO 14     OUT  Motor A PWM (left wheel forward)
GPIO 27     OUT  Motor A PWM (right wheel forward)
GPIO 12     OUT  DRV8833 AIN1 (left wheel direction)
GPIO 15     OUT  DRV8833 AIN2 (right wheel direction)
GPIO 25     OUT  DRV8833 BIN1 (left reverse)  -- optional
GPIO 26     OUT  DRV8833 BIN2 (right reverse) -- optional
GPIO 18     OUT  HC-SR04 TRIG
GPIO 19     IN   HC-SR04 ECHO (3.3V-safe on ESP32)
GPIO 34     IN   IR proximity sensor 1 (analog)
GPIO 35     IN   IR proximity sensor 2 (analog)
GPIO 23     OUT (reserved) wired to A0 of TP4056 charging-state pin — optional
VIN / 5V    PWR  LiPo via TP4056 OUT -> step-up boost module, common ground
GND         PWR  common ground for DRV8833, HC-SR04, IR pair, ESP32
3V3         PWR  Common 3.3V for ESP32 logic, sensors
```

## ASCII wiring diagram

```
                            +------------+
   LiPo 3.7V  -----+------->| TP4056     |--- boosted 5V ----> ESP32 VIN
                    |       +------------+                         |
                    |                                              GND /// common
                    |                                               |
                    v                                               v
   ESP32 DevKit V1                                DRV8833 dual H-bridge
     GPIO14  ------|==============>  AIN1  ------.          .------ motor L +
     GPIO27  ------|==============>  AIN2  ------'          '------ motor R +
       GND  -------|==============>  GND + VM (5V)            |
                   |                                               |
                   | HC-SR04                                        |
     GPIO18  ------|==============>  TRIG                            |
     GPIO19  ------|==============>  ECHO                            |
                   | IR01: GPIO34 (analog)      IR02: GPIO35 (analog)
                   | LED:  GPIO13  -> 220R -> cathode
```

## Power notes

- **3V3** is on the breadboard for sensors; **5V/VIN** is for the DRV8833 motor driver. Use the LiPo + TP4056 + 5V step-up boost breakout (e.g. MT3608) so the motors do not brown-out the ESP32.
- DRV8833 layout wires (VM, GND, AIN1, AIN2, BIN1, BIN2, PWMA, PWMB) follow common module pinout. Read the module silkscreen labels before powering on.
- HC-SR04 is sold as 5V but the ECHO line is 5V; current ESP32 DevKit V1 boards often tolerate it, but inserting a 220R series resistor on ECHO->GPIO19 is recommended.
- Put a 100 nF capacitor across the IR sensor VCC/GND to suppress noise on ADC reads.
- **No networking.** The ESP32 base sketch in `firmware/firmware.ino` does not enable WiFi or Bluetooth.

## No §2 fireline surface

ESP32 DevKit V1 is a general-purpose microcontroller; this kit does not require or use any cryptocurrency peripheral, signing, wallet, hardware wallet, multisig, contract deployment, transfer, token authorization, or cross-chain hardware. The "notify Myzubster" hook in `firmware.ino` is left as a no-op stub for downstream maintainers to wire to a notification/Webhook service of their choice; it neither signs nor transmits any blockchain transaction.
