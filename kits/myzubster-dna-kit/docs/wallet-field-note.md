# The `walletAddress` field is informational (§2 safety note)

Issue #79 lists **"Wallet Monero e history"** as one of the DNA fields the schema must model. This page is the explicit, auditable statement of how this kit handles that field, so a maintainer can rely on it without grepping the helpers.

## What the kit DOES with `walletAddress`

- **Models it**: the JSON schema (`schema/dna.schema.json`) declares `walletAddress` as `string | null`, optional, with a `description` that it is informational only.
- **Reads it**: `readDNA(record, 'walletAddress')` returns the string value, so any downstream consumer (a dashboard, an audit report) can read the field like any other.
- **Inherits it literally**: `inheritance(parent, childOpts)` copies `parent.walletAddress` to the child verbatim (or `null`). No transformation, no generation, no signing.
- **Preserves it on mutation**: `mutate(dna, capsule)` copies `dna.walletAddress` to the mutated record verbatim. The capsule cannot alter the wallet.

## What the kit does NOT do with `walletAddress`

- **Never generates** a wallet, private key, or mnemonic from any DNA edge.
- **Never signs** anything against a wallet.
- **Never broadcasts** a transaction to any chain.
- **Never authorizes** a token or transfer.
- **Never contacts** a wallet daemon, RPC node, or chain explorer.

There is no `crypto`/`secp256k1`/`axios`/`fetch` import anywhere in `firmware/lib/dna/dna.js` or `scripts/dna-check.js`: the helpers contain only `Object`/`Array`/`String`/`Math` operations. The `dna.test.js` suite asserts `walletAddress` behaves as a plain string:

- `createDNA` accepts a provided string and stores it verbatim.
- `inheritance` copies the parent's wallet to the child literally.
- `mutate` preserves the wallet across a mutation.

## Why model it at all?

The DNA is the data structure that describes a robot; robots in the MyZubster ecosystem do carry a wallet the maintainer wires upstream. Modeling the wallet as a documented optional string keeps the schema honest without forcing the kit to touch real funds - the same way the `#75 DIY kit`, the `#71 eco kit`, and the `#74 agri kit` each model a "notify MyZubster" / "weather forecast" hook as a local no-op stub while leaving the real integration to the maintainer. The §2 safe-harbor boundary explicitly allows **type correction / public test vectors / static analysis / audit reports** - defining `walletAddress` as a nullable string field is type work, not monetary work.

## Downstream wiring (not in this PR)

An integrator who actually wants a robot to manage its own wallet would:

1. Provide a wallet address string to `createDNA({ walletAddress })` at birth (the kit stores it).
2. Wire the real signing surface (a separate, isolated secrets module that lives outside this repo) that **reads** `readDNA(robot, 'walletAddress')` to know which wallet to use - but never asks the DNA helper to sign.

That separation keeps the DNA helpers pure and the secrets surface isolated, which is the whole reason this kit is inside the safe-harbor list.
