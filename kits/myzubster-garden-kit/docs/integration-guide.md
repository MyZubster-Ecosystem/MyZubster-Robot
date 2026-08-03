# MyZubster Integration Guide

Bounty #76 task: "Integrare con MyZubster."

This kit lives under `kits/myzubster-garden-kit/` and is self-contained: it adds no new files outside that folder and edits zero existing repo files, the same isolation pattern as the #71/#74/#75/#77 kits.

## Mounting

The cutting deck + sprinkler nozzle + weed probe mount to the MyZubster modular chassis using the standard M3/M4 mount points documented in the repo's existing DIY (#75) and agri (#74) kits. No chassis modification is required; the robot's drive N20 gearmotors follow the `boustrophedonPath` waypoints.

## Firmware

`firmware/lib/garden/garden.js` contains the pure decision helpers. On the real ESP32, `firmware/firmware.ino` reads the sensors (ADC moisture, ultrasonic height, camera green-density, DS18B20 temperature), calls the helpers, and drives the actuators (mower ESC, solenoid valve, deck servo, drive motors). The helpers themselves are pure functions so the same decisions run unchanged in the jest tests.

## Why no network

The kit stays inside the published safe-harbor scope: no WiFi, Bluetooth, or API calls. Schedules and thresholds are set in firmware constants (defaults live in `DEFAULTS`). If you want cloud telemetry later, layer it on top without changing the helpers.
