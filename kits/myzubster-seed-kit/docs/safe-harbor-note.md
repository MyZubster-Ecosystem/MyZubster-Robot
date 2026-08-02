# Safe-harbor note (Section 2)

## What this kit does NOT do

This kit contains no cryptocurrency generation, wallet signing, mainnet broadcast, contract deployment, transfer, token authorization, hardware wallet interaction, multisig, or cross-chain logic. It never connects to any blockchain, payment network, or external service.

## GPS

The GPS module reads satellite signals locally. No position data is transmitted, uploaded, or shared with any external service. The GPS-to-grid mapping is fully local math on the ESP32.

## No network surface

The kit has no WiFi, no Bluetooth, no LoRa, and no API calls. All computation is local. The only external signal is the GPS satellite downlink, which is a passive receive-only operation.

## Testing

All tests in the jest suite are deterministic and run without any hardware, network, or GPS signal. The NMEA parser, GPS mapper, servo angle, stepper count, growth monitor, and planting mission state machine are pure mathematical functions tested in isolation.

## OpenSCAD models

The 3D-printable parts (dibber, seed hopper, soil cover) are parametric CAD models that produce STL files for a 3D printer. No executable code, no network calls, no crypto --- just geometry.

## Same pattern as accepted kits

This kit follows the exact safe-harbor pattern accepted by the maintainer in:
- #75 DIY robotics kit (OpenSCAD + ESP32 firmware + tests)
- #71 eco-mode energy-saving kit (ESP32 sleep + motor idle + tests)
- #74 water-saving irrigation agri-kit (moisture sensor + solenoid valve + tests)

All are pure design + firmware + test deliverables with no wallet, signing, contract, or network surface.
