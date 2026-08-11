# Safe-Harbor Note (§2 boundary)

This kit is pure documentation + pure-JS planning helpers + deterministic jest tests. No cryptocurrency generation, wallet signing, mainnet broadcast, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain logic. No WiFi, Bluetooth, RPC, or network calls.

## China-specific §2 posture
Because of the 2021 PBoC crypto trading ban, the China kit takes an additional, explicit posture: it does NOT propose deploying wallets, exchanges, signing, or any crypto custody on Chinese territory. Where the kit discusses payments, it frames the compliant rail as the e-CNY CBDC / bank-channel RMB settlement -- never an onshore Monero exchange. The kit stays entirely in the planning/documentation track.

## What this kit does NOT do
- No real wallet access or signing
- No mainnet or testnet Monero broadcast
- No contract deployment or token authorization
- No wallets, exchanges, or crypto custody proposed on Chinese territory
- No real regulatory database access -- the regulator table is a static fixture
- No real event feed -- events are seasonal research notes frozen in a data file
- No real partner outreach -- the tracker is a state machine for tracking pipeline progress, not a contact-form engine
- No real beta-tester recruitment engine -- the pipeline is a state-machine scaffold, not a job-board integration
- No real community-manager recruitment engine -- the pipeline tracks stage progress, not a job-board integration
- No PII storage -- beta-tester rosters hold stage + region only; the kit stores no names/contact data

## What this kit DOES do
- Provides a structured China regulatory research document (PBoC / CAC / SAFE / MARA / MIIT) surfacing the 2021 PBoC crypto ban and the e-CNY CBDC compliant-rail context
- Scores each regulator for compliance readiness (`overallRegScore()` = 64/100, gate=true)
- Builds a chronological China event timeline for planning tradefair/meetup participation
- Tracks the agri-tech partnership pipeline (identified -> contacted -> engaged -> signed) with a DJI-stage probe
- Tracks the 2-beta-tester pipeline (applied -> screened -> field-trial -> feedback -> onboarded) with an active-robots counter = issue outcome "2 active robots in China"
- Tracks the community-manager recruitment pipeline (recruiting -> screening -> interview -> onboarded)
- Provides a Simplified-Chinese (zh) locale key map mirroring the en/it pattern
- Provides a market entry plan with pilot-region recommendation (Shandong)

## Operator role split
The operator (MyZubster integration team) is responsible for:
- Filing MARA field-trial protocols + obtaining MIIT/CAAC certification for the robot units
- Sending the DJI/XAG/Zoomlion/CAAMM partnership outreach + signing MoUs
- Recruiting beta testers and deploying hardware (off-mainland payment only)
- Conducting community-manager interviews and onboarding
- Registering for events and booking booths
- Finalizing Simplified-Chinese production wording
- All payment surfaces use the compliant e-CNY/bank-channel RMB rail -- this kit provides NO onshore-crypto mechanism

This kit provides the **plan and test harness**; the operator provides the **execution** within the §2 + 2021-PBoC-ban boundaries.
