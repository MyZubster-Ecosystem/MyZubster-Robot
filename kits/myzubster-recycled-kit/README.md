# MyZubster Recycled-Components Kit (open-source circular-economy robotics docs)

Implementation of [MyZubster-Robot issue #72](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/72) -
"[Circular] Robot che ricicla componenti elettronici".
Bounty: **0.02 XMR**.

Italian summary: _Kit documentale open source per costruire un robot riutilizzando componenti
recuperati da vecchi elettrodomestici e dispositivi (motori, batterie, sensori, telai),
con lista componenti riciclabili, schemi di riconversione, guida al recupero sicura ed esempi
di robot funzionanti._

## Scope

Documentation-only kit (no firmware binary, no networking, no crypto):

- **Lista componenti riciclabili** - [`recyclable-components.md`](recyclable-components.md): reusable parts from old printers, dryers, laptops, phones, toys, with reusable / not-reusable flags and common specs.
- **Schemi di riconversione** - [`reconversion-schematics.md`](reconversion-schematics.md): how to repurpose each recovered part for a robot build, with ASCII schematics + pin tables.
- **Guida al recupero** - [`recovery-guide.md`](recovery-guide.md): safe disassembly steps, safety warnings (mains, capacitors, batteries), tool list.
- **Esempi di robot funzionanti** - [`examples.md`](examples.md): 3 example robot builds mapped to recovered parts.

## Coverage of issue #72 task list

- `Lista componenti riciclabili` - done in `recyclable-components.md`.
- `Schemi di riconversione` - done in `reconversion-schematics.md`.
- `Guida al recupero` - done in `recovery-guide.md`.
- `Esempi di robot funzionanti` - done in `examples.md`.

## Verify the kit locally

    cd kits/myzubster-recycled-kit
    npm test        # runs scripts/validate.js - must report PASS (all four sections complete)

The validator (`scripts/validate.js`) checks each of the four task deliverable files exists and contains its required section headers. It performs only local file reads - no network, no I/O beyond the kit directory.

## Safety disclosure (stays inside the published safe-harbor list)

This kit is documentation only. It deliberately avoids any cryptocurrency, wallet, mainnet signing, contract deployment, transfer, token authorization, hardware wallet, multisig, or cross-chain surface. The safety warnings in `recovery-guide.md` cover electrical-safety good practice for disassembly of scrap electronics (no live mains, capacitor discharge, battery handling) - they are general-purpose guidance, not financial-crypto operations. The three example robots are open-loop hardware reference builds with no MyZubster / wallet / network integration.

AI-assisted development: this kit was authored with AI assistance. The recovery and reconversion guidance is intentionally conservative; always verify a recovered part's actual specs (voltage, terminals, pinout) against the donor device's datasheet or model markings before wiring it into a robot.

## Status

Initial PR submission toward issue #72. Community iteration welcome on:
- More donor device families in `recyclable-components.md` (e.g. washing-machine pumps, vacuum motors).
- Refined reconversion circuits for specific battery chemistries / motor types.
- More example robot builds in `examples.md`.

Payout address (Monero): `4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc`
