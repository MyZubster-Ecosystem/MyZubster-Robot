# Auto-Config Operation Guide

Bounty #81 -- operation guide for the MyZubster auto-config kit.

## Auto-config flow

1. The mother robot places the assembled child on the config dock.
2. The dock's serial probes connect to the child ESP32 (TX/RX/GND/VCC).
3. The mother runs `autoConfigSequence` which executes 7 phases:
   - **Assign ID**: unique sequential child ID generated from the production sequence.
   - **Generate wallet descriptor**: a data structure with an address placeholder + metadata (NOT a real keypair, provision on first boot).
   - **Register on MyZubster**: offline registration record created (no network call).
   - **Copy base skills**: mother's skill manifest cloned to child (union with defaults).
   - **Set referrer**: mothers robot linked as the referrer.
   - **Assign inherited DNA**: mother's DNA traits inherited (no child mutations yet).
   - **Complete**: child is fully configured and ready for first boot.

## Config dock assembly

Print `openscad/config-dock.scad` in PETG. Mount the dock to the assembly line. The 4 programming probes (pogo pins) connect TX/RX/GND/VCC to the child ESP32's programming header.
