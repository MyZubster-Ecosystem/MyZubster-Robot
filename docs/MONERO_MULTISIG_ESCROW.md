# Monero Multisig Escrow

This bounty implementation adds a dependency-free coordinator for a real Monero wallet-rpc 2-of-3 escrow between:

- client
- robot
- AI arbiter

It does not invent a simulated on-chain result. Unit tests mock wallet-rpc so the flow is deterministic in CI, while the implementation calls the real Monero wallet-rpc method names and payload shapes used for testnet or mainnet wiring.

## Scope

- Create a 2-of-3 escrow state with client, robot, and arbiter wallet-rpc clients.
- Run `prepare_multisig`, `make_multisig`, and `finalize_multisig` for the multisig setup.
- Verify `is_multisig` readiness with threshold `2` and total signers `3`.
- Export and import multisig sync data through `export_multisig_info` and `import_multisig_info`.
- Record a confirmed funding transaction only after the required confirmation count.
- Create release or refund transactions through `transfer` with `do_not_relay: true`.
- Require two unique signers through `sign_multisig`.
- Submit the signed multisig txset through `submit_multisig`.

The wallet-rpc method boundaries follow the official Monero wallet-rpc multisig flow:
https://web.getmonero.org/resources/developer-guides/wallet-rpc.html

## Testnet Plan

Run three isolated wallet-rpc instances on testnet, each with its own wallet directory:

```bash
monero-wallet-rpc --testnet --wallet-dir ./wallet-client --rpc-bind-port 38083 --daemon-address 127.0.0.1:28081 --disable-rpc-login
monero-wallet-rpc --testnet --wallet-dir ./wallet-robot --rpc-bind-port 38084 --daemon-address 127.0.0.1:28081 --disable-rpc-login
monero-wallet-rpc --testnet --wallet-dir ./wallet-arbiter --rpc-bind-port 38085 --daemon-address 127.0.0.1:28081 --disable-rpc-login
```

Production deployments should use authenticated wallet-rpc behind a trusted service boundary. If `--rpc-login` is enabled, provide a fetch/transport adapter that handles the deployment auth mode.

## API Usage

```js
const {
  createMoneroWalletRpcClient,
  createMoneroMultisigEscrow,
  setupMoneroMultisig,
  syncMultisigInfo,
  recordFunding,
  createSpendTransaction,
  signSpendTransaction,
  submitSpendTransaction,
} = require("./src/moneroMultisigEscrow");

const escrow = createMoneroMultisigEscrow({
  escrowId: "robot-job-123",
  network: "testnet",
  amountXmr: "0.10",
  releaseAddress: "robot payout address",
  refundAddress: "client refund address",
  client: { id: "client", rpc: createMoneroWalletRpcClient({ endpoint: "http://127.0.0.1:38083" }) },
  robot: { id: "robot", rpc: createMoneroWalletRpcClient({ endpoint: "http://127.0.0.1:38084" }) },
  arbiter: { id: "arbiter", rpc: createMoneroWalletRpcClient({ endpoint: "http://127.0.0.1:38085" }) },
});
```

Flow:

1. `setupMoneroMultisig(escrow)` creates the shared 2-of-3 multisig wallet.
2. Fund `escrow.multisigAddress` on testnet.
3. Use `syncMultisigInfo(escrow)` after funding and before spending.
4. Use `recordFunding(escrow, { txHash, amountXmr, confirmations })` after the funding transaction is confirmed.
5. Use `createSpendTransaction(..., { spendType: "release" })` for robot payout or `{ spendType: "refund" }` for client refund.
6. Use `signSpendTransaction(spend, ["client", "robot"])`, `["client", "arbiter"]`, or `["robot", "arbiter"]`.
7. Use `submitSpendTransaction(signed, submitterRole)` to submit the final txset.

## Validation

```bash
node --test test/moneroMultisigEscrow.test.js
node --check src/moneroMultisigEscrow.js
node --check test/moneroMultisigEscrow.test.js
git diff --check
```
