# Arm Control Guide (Scrivere codice per braccio meccanico)

Bounty #80 task: "Scrivere codice per braccio meccanico."

## How the arm works at each station

The `stationArmControl` function returns a deterministic arm movement spec for each phase:

| Station | Phase | Arm Action | Gripper | Lift (mm) | Rotate (deg) |
|---------|-------|------------|---------|-----------|--------------|
| 1 | pick | grip_lift | close | 40 | 0 |
| 2 | chassis | position_held | hold | 20 | 0 |
| 3 | board | insert_down | open | 5 | 0 |
| 4 | motors | connect | close | 10 | 45 |
| 5 | flash | dock | open | 0 | 0 |
| 6 | register | scan | open | 30 | 90 |

On the real ESP32, `firmware/firmware.ino` reads the arm spec from `stationArmControl` and drives the stepper motors + gripper servo accordingly. The arm logic itself is pure-functional (same decisions in tests and on hardware).
