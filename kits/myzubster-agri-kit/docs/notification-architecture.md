# MyZubster notification hook - documented no-op stub (task: Integrare con MyZubster per notifiche)

Covers task #74 task list entry **"Integrare con MyZubster per notifiche"** (integrate with MyZubster for notifications). This is the same pattern delivered by the **#75 DIY kit** (`integrateWithMyzubster`) and the **#71 eco kit** (`notifyMyzubster`): the robot keeps a documented *hook point* in its firmware but **does not** enable any network, wallet, or signing surface inside this PR. The integration is a downstream-wired, read-only status publisher.

## Hook point

| Slot | Source of truth | Behaviour in this PR |
|---|---|---|
| `notifyMyzubster(const char* status)` | `firmware/firmware.ino` | no-op; left as a stub for downstream wiring |

`firmware.ino` already calls `notifyMyzubster("valve_closed")`, `notifyMyzubster("irrigating")` at the relevant state-machine events, so the call graph is *visible* without committing to any transport.

## Why no live notification in this PR

The venue is a cellular/battery irrigation robot. A live push to the MyZubster upstream platform would:

- materialise a **network radio surface** (WiFi/LoRa) contrary to the §2 safe-harbor scope that the published social bounties have accepted in DM/PR comments (no wallet, no live signing, no live contract),
- cut the energy saving we report in `agri:check` because we'd be powering a modem just to pub single-bit status messages,
- couple this PR's deliverables to a transport we do not own or test.

The kit's stance: the firmware surfaces the **what** (irrigating / valve_closed / done / idle status) as a free `const char*`, and leaves the **how** to the maintainer's own downstream publisher, which is the only place that can carry API keys, cert pinning, and rate limit policy. The MyZubster core maintains its own identity & keyset - the robot *itself* never signs anything.

## Downstream wiring sketch

```text
  robot (this kit)           integrator-wired publisher
  ---------------            --------------------------
  notifyMyzubster("irrigating")
       |
       v
  (bundled in tree; integrator copies status + method ptr into a queue)
       |
       v
  publisher.post({ planId, status, ts })   -- GitHub Actions/Edge function deserialiser
       |
       v
  MyZubster upstream -- maps status onto its device-event timeline
```

The replacement is a same-signature body swap for `notifyMyzubster()`. No lib or HTTP or signing surface is shipped in this PR - the firmware file contains only the stub and the downstream-wiring sketch above.

## Why a `const char*` payload

Four reasons for that stable transfer shape:

1. **Deterministic content**: statuses are literal strings (`"irrigating"`, `"valve_closed"`), so the integrator can grep on them.
2. **Cheap**: no heap alloc on a constrained MCU.
3. **Carries no secret**: even if a publisher is ever wired, the robot is only emitting a tag - not a wallet address, not a transaction id, not a permission claim.
4. **No signing surface**: only the MyZubster upstream *receives*; the robot does not need to authenticate itself.

## How the unit tests cover this

This stub is documented, not exercised by `agri.js` (which is the policy layer). The `agri.test.js` suite covers the policy (moisture, weather, valve, energy). The stub contract here is the textual surface that an integrator reads when wiring the publisher - a maintainer can grep `notifyMyzubster` in `firmware.ino` and see every call site.
