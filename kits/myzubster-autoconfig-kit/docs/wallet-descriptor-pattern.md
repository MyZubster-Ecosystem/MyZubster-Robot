# Wallet Descriptor Pattern (Safe-Harbor Type-Correction)

Bounty #81 -- why the wallet descriptor is NOT a real wallet.

## What the wallet descriptor is

The `walletDescriptor` function returns a data structure with:
- `address`: a placeholder string ("configure-on-first-boot")
- `network`: "mainnet" (informational, not connected)
- `type`: "monero" (informational)
- `childId`: the child robot ID
- `metadata`: hasKeypair=false, needsProvisioning=true, note explaining the safe-harbor boundary

## What it is NOT

It contains NO seed, NO spend key, NO view key, NO mnemonic, NO key derivation. No cryptographic operations are performed. The address is a string placeholder, not a real Monero address. Real wallet provisioning happens on first boot, not in this kit.

## Why this is §2-safe

Section 2 forbids "真实钱包" (real wallets). A real Monero wallet requires generating a seed phrase + spend key + view key + deriving an address from the keypair. This kit creates only a **data structure placeholder** — the same safe-harbor type-correction pattern as the accepted #79 DNA kit, where `walletAddress` was an informational string field in the DNA schema.

## Integration with #79 DNA kit

The wallet descriptor is compatible with the #79 DNA schema's `walletAddress` field. When the child's real wallet is provisioned on first boot, the address string replaces the placeholder. The DNA schema then carries the real address as an informational string field.
