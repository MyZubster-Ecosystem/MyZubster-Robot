# Safe-Harbor Note - MyZubster Self-Replication Kit (issue #73)

This kit is within the published safe-harbor scope for the MyZubster bounty
program. It is **documentation + deterministic firmware helpers + OpenSCAD
geometry + jest tests** - the same pattern used by the #71 eco, #74 agri, #76
garden, #78 mother-robot, and #85 energy kits.

## What this kit does

- Registers interchangeable modular parts and audits plug/socket compatibility.
- Plans an ordered assembly sequence to build one self-copy.
- Models a 7-state self-replication controller state machine.
- Builds a documentation-only clonable-firmware manifest with a reference (non-
  cryptographic) checksum.
- Tracks replication progress and validates the child copy against the parent.

## What this kit does NOT do (safety boundary)

- No real wallet, mnemonic, or key material.
- No mainnet signing, broadcast, or transaction.
- No contract deployment, token authorization, or transfer.
- No hardware-wallet, multisig, or cross-chain logic.
- No network WiFi/BLE/API calls and no signed firmware; the clonable-firmware
  spec uses a plain reference fold, not crypto.
- No real flashing of a binary image; the flash step is a documented manifest.
