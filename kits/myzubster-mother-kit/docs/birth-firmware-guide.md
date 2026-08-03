# Birth Firmware Guide (Scrivere firmware per il parto robotico)

Bounty #78 task: "Scrivere firmware per il parto robotico."

## What the birth firmware does

When the mother robot finishes assembling a child, it generates a birth-firmware spec (`birthFirmwareSpec`) and flashes it to the child's ESP32 via serial. The spec is deterministic and hardware-agnostic:

- `childId`: a unique identifier for the child robot (set by `childConfig.childId`)
- `flashSize`: 4 MB (standard ESP32-WROOM-32 flash)
- `partitionTable`: `default` (standard ESP32 partition)
- `wifi`: disabled by default (the kit stays inside the safe-harbor no-network scope)
- `motors`: child motor count and type (N20 by default)
- `sensors`: list of sensor modules installed on the child
- `birthSequence`: `boot -> self_test -> motor_init -> sensor_init -> register_with_mother -> ready`

## How it is generated

The `birthFirmwareSpec` function takes a `childConfig` object and produces a deterministic spec. The same config always yields the same spec, so tests can assert exact outputs. On the real ESP32, `firmware/firmware.ino` would call `birthFirmwareSpec` and then burn it to the child via esptool serial flash.

## Child registration

`registerChild` creates a signed registration record (child ID + motherboard + sensors list + firmware version + status). In this kit, the record is a deterministic JSON object; no network is involved.
