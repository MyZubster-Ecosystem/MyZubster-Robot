# Safe-Harbor Note (Scope)

This kit is pure OpenSCAD design + ESP32 firmware helpers (pure-JS) +
deterministic jest tests + documentation. It contains:

- NO cryptocurrency generation, wallet signing, or mainnet broadcast.
- NO contract deployment, token authorization, or transfer.
- NO hardware wallet, multisig, or cross-chain logic.
- NO WiFi, Bluetooth, or network API calls.
- NO key material, mnemonic, or seed-handling code.
- GPS, if added later, is a passive receive-only satellite downlink.

The x402 payment flow is a documentation-only protocol spec (states,
transitions, data fields). It does NOT perform any real wallet signing,
Monero transfer, key generation, or network call. The actual payment
infrastructure is owned by the MyZubster gateway outside this kit.

This is the same safe-harbor pattern used by the #71 eco kit, #74 agri kit,
#76 garden kit, and #85 energy kit in this repository. The kit is offered as
documentation and deterministic firmware logic; the maintainer can tune the
motor gains, obstacle/tilt thresholds, blade ramp, and BOM prices for their
specific grass / lawn / supply situation.
