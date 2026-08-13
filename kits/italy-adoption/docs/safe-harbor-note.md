# Safe-Harbor Note (S2 boundary)

This kit is pure documentation + pure-JS planning helpers + deterministic jest tests. No cryptocurrency generation, wallet signing, mainnet broadcast, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain logic. No WiFi, Bluetooth, RPC, or network calls.

## What this kit does NOT do

- No real wallet access or signing
- No mainnet or testnet Monero broadcast
- No contract deployment or token authorization
- No real regulatory database access -- the regulator table is a static fixture
- No real event feed -- events are seasonal research notes frozen in a data file
- No real partner outreach -- the tracker is a state machine for tracking pipeline progress, not a contact-form engine
- No real beta-tester recruitment engine -- the pipeline is a state-machine scaffold, not a job-board integration
- No PII storage -- beta-tester rosters hold stage + region only; the kit does not store names/contact data

## What this kit DOES do

- Provides a structured Italy/EU regulatory research document (Banca d'Italia / Consob / Garante Privacy / MIPAAF)
- Scores each regulator for compliance readiness
- Builds a chronological Italy event timeline for planning tradefair/meetup participation
- Tracks the partnership pipeline (identified -> contacted -> engaged -> signed) with a Coldiretti-stage probe
- Tracks the 5-beta-tester Castrocaro pipeline (applied -> screened -> field-trial -> feedback -> onboarded) with an active-robots counter
- Provides a market entry plan with pilot-region recommendation (Emilia-Romagna / Castrocaro)
- Provides an `it` locale key map mirroring the existing en/it pattern for documentation localization

## Operator role split

The operator (MyZubster integration team) is responsible for:
- Filing VASP registration with OAM (and MiCA CASP authorization as it lands)
- Filing the MIPAAF field-trial protocol for the Castrocaro pilot
- Sending the Coldiretti partnership outreach + signing the MoU
- Collecting GDPR consent from beta testers and deploying hardware
- Registering for events and booking booths

This kit provides the **plan and test harness**; the operator provides the **execution**.
