# Energy Independence Operation Manual

Bounty #85 -- operation manual for the MyZubster energy independence kit.

## Recharge flow

The auto-recharge system runs five phases:

1. **Battery detection** -- `socFromVoltage` reads the Li-ion cell voltage (3000-4200 mV) and estimates state of charge (0-100%). `lowBatteryDetector` uses hysteresis (trigger at 20%, cancel at 25%) to avoid oscillation near the threshold.

2. **Navigate to station** -- `navigatorToDock` computes the bearing (0-360 degrees) and straight-line distance (meters) from the robot's current position to the charging station. The navigator activates within `dockMaxApproachDistM` (default 10 m).

3. **Auto-connect** -- the `dockingStateMachine` drives a 7-state cycle: `idle -> navigate -> approach -> align -> connect -> charge -> disconnect -> idle`. Each transition is deterministic based on sensor flags (`dockVisible`, `dockAligned`, `contactsAligned`, `powerConnected`, `fullyCharged`).

4. **x402 payment** -- `x402PaymentSpec` returns a documentation-only protocol spec (states, transitions, data fields). This kit does NOT perform real payment: the spec documents how the x402 infrastructure should work. No keys, signing, or transfers.

5. **Charging + notification** -- `chargingCompleteNotifier` fires a `recharge_complete` notification when the battery reaches full charge, then the state machine returns to `idle`.

## Tuning parameters

| Parameter | Default | Description |
|---|---|---|
| batteryFullMv | 4200 | Cell voltage at 100% SoC |
| batteryEmptyMv | 3000 | Cell voltage at 0% SoC |
| batteryLowPct | 20 | SoC threshold to trigger recharge |
| batteryHysteresisPct | 5 | SoC margin to cancel alert (prevents oscillation) |
| dockMaxApproachDistM | 10 | Max distance for navigator activation |

## CLI verification

```sh
npm test            # 69 jest tests, all green
npm run energy:check # headless simulation, exit 0 on pass
```
