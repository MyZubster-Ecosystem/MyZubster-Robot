# MyZubster Physical Robot Specification Template

Canonical workflow reference: #146
BOM index: #145

## Status
Choose exactly one:
- CONCEPT
- PROCUREMENT-READY
- ASSEMBLED
- TESTED
- INTEGRATED
- VERIFIED

## Purpose
Describe what the robot physically does and where it operates.

## Environment
- Indoor / outdoor:
- Surface / terrain:
- Expected temperature/humidity range:
- Water/dust exposure:
- Human/animal proximity:

## Minimum functional requirements
- [ ]
- [ ]
- [ ]

## Compute / controller
- Primary controller:
- Optional host computer:
- Firmware/runtime:

## Sensors
| Sensor | Purpose | Interface | Voltage | Required? |
|---|---|---|---|---|
| | | | | |

## Actuators
| Actuator | Purpose | Driver | Voltage/current | Fail-safe |
|---|---|---|---|---|
| | | | | |

## Power system
- Battery chemistry:
- Nominal voltage:
- Maximum expected current:
- Charger/protection:
- Logic rail:
- Physical disconnect / emergency stop:

## Mechanical constraints
- Chassis:
- Maximum mass:
- Wheel/track configuration:
- Payload:
- Weatherproofing:

## Communications
- Wi-Fi / BLE / Ethernet / LoRa / cellular / other:
- Offline behavior:
- Authentication method:

## MyZubster telemetry
Public-safe fields where applicable:
- `device_id`
- `timestamp`
- `time_source`
- `evidence_class` (`physical`, `simulated`, `derived`)
- `online`
- `battery`
- `mode`
- `task`
- `sensor_summary`
- `position` only when authorized/public-safe
- `firmware_version`
- `build_reference`

Do not publish credentials, wallet seeds, private keys or unnecessary personal/location data.

## Time Machine integration
- Snapshot domains used: plants / sensors / maps / robots
- Export format:
- Replay behavior:
- Historical replay must not send commands to hardware.

## Safety boundaries
- [ ] Low-voltage reference design first.
- [ ] First actuator test constrained/off-ground where applicable.
- [ ] Protected battery and correct charger.
- [ ] Physical stop/disconnect tested.
- [ ] Hazardous actuators require a separate risk review.

## BOM
Link dedicated BOM issue or compatible existing BOM:

## Verification plan
- [ ] Wiring/pinout documented.
- [ ] Exact purchased models recorded.
- [ ] Firmware/software revision recorded.
- [ ] Calibration/limitations recorded.
- [ ] Functional tests recorded.
- [ ] Failures/deviations recorded.

## Definition of done
State objective, testable completion criteria here.
