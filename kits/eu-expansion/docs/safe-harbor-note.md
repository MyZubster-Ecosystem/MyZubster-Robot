# Safe-Harbor Note (S2 boundary)

This kit follows the same safe-harbor documentation pattern as the prior robot kits (#70, #71, #76). It is pure documentation + pure-JS planning helpers + deterministic jest tests.

## What this kit does NOT do

- No real wallet access, signing, or key derivation
- No mainnet or testnet Monero broadcast
- No contract deployment, token authorization, or transfer
- No hardware wallet, multisig, or cross-chain logic
- No real regulatory database access -- the country score table is a static fixture
- No live event feed -- events are seasonal research notes frozen in a data file
- No real partner outreach -- the tracker is a state-machine for tracking pipeline progress, not a contact-form engine

## What this kit DOES do

- Provides a structured EU expansion roadmap document
- Scores each target country on regulation clarity, Monero community, and agricultural market readiness
- Builds a chronological EU event timeline for planning meetups and conferences
- Tracks the 5-phase expansion milestone (SURVEY -> REGULATE -> LOCALIZE -> LAUNCH -> SCALE) as a pure state machine
- Tracks the agricultural robotics partner outreach pipeline (identified -> contacted -> engaged -> signed) with funnel-rate analysis
- Provides fr/de/es locale coverage for the EU expansion UI surface (20 keys per locale, fully verified by tests)

## Operator role split

The operator (MyZubster integration team) is responsible for:
- Obtaining live regulatory data and updating `countries.js` at runtime
- Registering for events and booking booths (real-world actions)
- Sending partner outreach emails/calls (real-world actions)
- Conducting beta tester recruitment (real-world actions)

This kit provides the **plan and test harness**; the operator provides the **execution**.
