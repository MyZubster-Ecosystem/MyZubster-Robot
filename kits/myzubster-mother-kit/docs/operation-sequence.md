# Operation Sequence (Creare flusso di assemblaggio automatico)

Bounty #78 task: "Creare flusso di assemblaggio automatico."

## Mission flow

1. **Init** — the mother enters assembly mode, locks the arm and magazine to home position.
2. **Pick** (per component) — the magazine indexes to the next slot; the assembly arm moves to the slot position; the gripper closes on the component.
3. **Position** (per component) — the arm moves to the child assembly jig; the arm IK solver computes the joint angles to reach the target.
4. **Connect** (per component) — the welder head deploys to solder or connect the component.
5. **Verify** (per component) — the ToF rangefinder confirms the component is seated; the gripper opens and retracts.
6. **Flash** — the birth firmware spec is generated and flashed to the child ESP32 via serial.
7. **Register** — the child registration record is logged.
8. **Complete** — the mother reports success and resets for the next child.

The entire sequence is deterministic for a given child spec. The `assemblySequence` function returns an ordered list of steps with all arm, gripper, welder, and flash parameters pre-computed.
