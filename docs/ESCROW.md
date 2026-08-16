# Robot Escrow Trust Model

Issue #69 adds a 2-of-3 escrow for EVM-native and ERC-20 robot work orders. The
three participants are the client, robot, and arbiter. Any two distinct
participants can release or refund an escrow.

## Settlement Authority

`RobotEscrow.sol` is the only settlement authority. The gateway stores job
metadata, evidence, disputes, and proposed approvals, but it never marks money
as released or refunded from its own counters. A final status is recorded only
after `POST /api/escrow/:id/reconcile` reads and validates the contract state.

The included `EvmChainReader` reads `getEscrow` from `EVM_RPC_URL` and queries
the settlement event from `EVM_ESCROW_DEPLOYMENT_BLOCK`. Reconciliation rejects
a snapshot when the client, robot, arbiter, token,
amount, or work hash differs from the gateway record. It also rejects backward
status transitions. A production `chainReader` must read from a configured RPC
provider and return a transaction hash and block number for auditability.

## Contract Security

- OpenZeppelin `SafeERC20` supports tokens that return `bool` and tokens that
  return no value.
- False-return tokens are rejected.
- Fee-on-transfer tokens are rejected at funding so the recorded amount always
  equals the contract balance increase.
- OpenZeppelin `ReentrancyGuard` protects funding and settlement calls.
- Status is finalized before the external native-token transfer.
- Duplicate approvals and non-participant callers revert.

## AI Arbiter Boundary

The included arbiter is deterministic test scaffolding, not an autonomous
payment authority. It can propose the arbiter release vote only when:

1. confidence is at least `0.85`;
2. no dispute exists; and
3. the client or robot has already proposed release.

Even then, the gateway remains pending until the two approvals are submitted to
the contract and reconciliation observes the resulting on-chain settlement.
Low-confidence and disputed cases always require human review.

## XMR Is Separate

The Solidity contract cannot hold or release Monero. `XMR` requests are rejected
by this EVM adapter. Monero work orders must use the repository's separate
Monero multisig coordinator and its own verifiable transaction flow. Examples
must not label EVM native/ERC-20 escrow balances as XMR.

## Reproducible Validation

```bash
npm ci
npm run test:escrow
```

The suite compiles Solidity locally and tests all approval combinations,
duplicate and unauthorized approvals, disputes, native/ERC-20 transfers,
non-standard tokens, reentrancy, AI guardrails, and gateway/chain divergence.

## Local Deployment

```bash
npm ci
npm --workspace x402-gateway run node:local
```

In a second terminal:

```bash
npm --workspace x402-gateway run deploy:local
```

Store the printed contract address in the gateway deployment configuration.
Production deployments should use an audited network-specific script or plugin,
a funded deployer supplied through the environment, and a verified contract.
No private key belongs in this repository. Runtime reconciliation requires:

```bash
EVM_RPC_URL=https://your-rpc.example
EVM_ESCROW_DEPLOYMENT_BLOCK=123456
```
