# Operation Sequence (Creare sequenza di assemblaggio)

Bounty #80 task: "Creare sequenza di assemblaggio."

## Assembly line sequence (6 phases)

The `assemblyLineSequence` function produces an ordered set of 32 steps for a 6-station line:

1. **line_init** - line starts, all stations ready
2. **station 1 (pick)**: enter -> execute (grip_lift) -> quality (component_present, grip_secure) -> conveyor_advance -> exit
3. **station 2 (chassis)**: enter -> execute (position_held) -> quality (frame_aligned, screws_tight) -> conveyor_advance -> exit
4. **station 3 (board)**: enter -> execute (insert_down) -> quality (esp32_seated, pins_aligned) -> conveyor_advance -> exit
5. **station 4 (motors)**: enter -> execute (connect) -> quality (motor_direction, wheel_rotation) -> conveyor_advance -> exit
6. **station 5 (flash)**: enter -> execute (dock) -> quality (firmware_checksum, boot_response) -> conveyor_advance -> exit
7. **station 6 (register)**: enter -> execute (scan) -> quality (id_assigned, schema_valid) -> conveyor_advance -> exit
8. **line_complete** - child robot is fully assembled and registered

Each station's execution is deterministic; the same sequence always produces the same result in the tests and on the real assembly line.
