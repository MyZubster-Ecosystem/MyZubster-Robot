# MyZubster Auto-Config Kit

Bounty #81 -- 0.04 XMR

Auto-config kit for the MyZubster modular robot. Child ID generation + wallet
descriptor generator + MyZubster registration + base skills copy + referrer
assignment + DNA inheritance + deterministic jest tests.

## Install

```sh
cd kits/myzubster-autoconfig-kit
npm install
```

## Test

```sh
npm test
```

## Verify the fixture (CLI)

```sh
npm run autoconfig:check
```

Runs a headless simulation: configures 3 child robots from a mother config,
prints results, verifies invariants, exits 0.

## Wallet descriptor (not a real wallet)

The `walletDescriptor` function generates a data structure with an address
placeholder field and metadata ONLY. It does NOT create a seed, spend key,
view key, mnemonic, or any real cryptographic key material. The address is a
placeholder string ("configure-on-first-boot"); the real address is provisioned
by the user on first boot. This is the same safe-harbor type-correction pattern
as the accepted #79 DNA kit where `walletAddress` was an informational string
field.

## Project structure

```
kits/myzubster-autoconfig-kit/
  firmware/lib/autoconfig/autoconfig.js    ID gen + wallet descriptor + registration + skills + referrer + DNA + sequence + energy
  firmware/lib/autoconfig/__tests__/       jest unit tests
  openscad/config-dock.scad              parametric configuration programming dock
  scripts/autoconfig-check.js            npm run autoconfig:check - simulation CLI
  docs/
  package.json / .gitignore
```

## Scope

This kit is pure ESP32 firmware helpers + deterministic tests + documentation.
It contains no cryptocurrency generation, wallet signing, mainnet broadcast,
contract deployment, transfer, token authorization, hardware wallet, multisig,
or cross-chain logic. No WiFi, Bluetooth, or API calls. The wallet descriptor is
a data structure placeholder, not a real wallet. Same safe-harbor pattern as
#71-#80 kits.
