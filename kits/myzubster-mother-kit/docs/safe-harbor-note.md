# Safe-Harbor Note (Scope)

This kit is pure OpenSCAD design + ESP32 firmware helpers + deterministic jest tests +
documentation. It contains:

- NO cryptocurrency generation, wallet signing, or mainnet broadcast.
- NO contract deployment, token authorization, or transfer.
- NO hardware wallet, multisig, or cross-chain logic.
- NO WiFi, Bluetooth, or network API calls.
- The "birth firmware" is a deterministic firmware-spec generator that runs entirely offline.

This is the same safe-harbor pattern used by the existing #71 eco kit, #74 agri kit, #75 DIY kit, #76 garden kit, and #77 seed kit in this repository. The kit is offered as documentation and deterministic firmware logic; the maintainer can tune arm link lengths, gear ratios, and magazine slot count for their specific hardware.
