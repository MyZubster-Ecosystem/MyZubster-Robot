# MyZubster notification hook (architecture)

Reference for the **Integrazione con MyZubster per notifiche** task (issue #71).

## What this kit ships

A **local no-op stub**: `firmware/firmware.ino::notifyMyzubster(const char* status)` only toggles the status LED and discards the string. This kit deliberately ships **no network call, no MyZubster API client, no token, no signing** - it stays inside the published safe-harbor list (documentation / test refactor / type fixes). The stub keeps the firmware's architecture complete without committing the robot to any wallet or platform surface.

## Why a stub here

- The bounty scope for #71 is the **energy-saving mode**. A notification is a status string ("eco boot / motor standby / light sleep / deep sleep"), not a payment or a signed record.
- An actual HTTP push to MyZubster would require a network stack + platform auth that this offline kit intentionally does not include (the safe-harbor list keeps that out of scope).
- The stub mirrors the pattern already shipped for the accepted-scope #75 DIY kit (`notifyMyzubster()` no-op stub).

## Call sites already in place

`firmware.ino` already calls `notifyMyzubster(...)` at every state transition with a short status string:

| Call site | Status string |
|---|---|
| `setup()` | `"eco boot"` |
| motor standby | `"motor standby"` |
| light sleep | `"light sleep"` |
| deep sleep | `"deep sleep"` |

So swapping the stub body for a real publisher is a single-function change with no other edits.

## Where the maintainer wires the real hook (downstream)

The downstream integration (maintainer / a follow-up PR) replaces the stub body with a read-only status publisher:

1. A separate task publishes `status` to a log file or a read-only MQTT topic on the robot's LAN - no signing, no wallet.
2. If a MyZubster platform bridge is desired, that bridge is a separate service that reads the LAN topic and forwards a plain status string; it never holds or signs keys for this robot.
3. The call sites above pass the status string, so the publisher is the only change.

## What the stub explicitly does NOT do

- Does not connect WiFi / Bluetooth.
- Does not read or sign any key, mnemonic, or wallet.
- Does not call any MyZubster HTTPS endpoint.
- Does not authenticate to anything.

A reviewer asserts the stub is reachable at the expected call sites by stubbing `notifyMyzubster` in a host build and checking the call sequence; no network path exists to assert against (by design).
