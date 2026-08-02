# Robot Escrow Design

Issue #69 asks for a 2-of-3 escrow system for robot jobs. This implementation adds:

- `contracts/RobotEscrow.sol`: on-chain settlement for native or ERC-20 funds
- `x402-gateway/src/escrowStore.js`: gateway state for robot jobs
- `x402-gateway/src/aiArbiter.js`: simulated AI review for completion evidence
- `x402-gateway/src/server.js`: HTTP endpoints for clients, robots, and arbiters

## Flow

1. The client creates and funds an escrow.
2. The robot sees the escrow through `GET /api/robot/:robotId/escrows`.
3. The robot performs work and submits release approval.
4. The client or AI arbiter approves completion.
5. Once two approvals exist, the gateway marks the escrow as `released` and the smart contract can release funds.

If a dispute is raised, any two refund approvals settle the escrow as `refunded`.

## On-Chain Contract

`RobotEscrow` supports native token escrows and ERC-20 escrows:

- `createNativeEscrow(robot, arbiter, workHash)`
- `createTokenEscrow(token, robot, arbiter, amount, workHash)`
- `approveRelease(escrowId)`
- `approveRefund(escrowId)`
- `raiseDispute(escrowId, reason)`
- `getEscrow(escrowId)`

The contract stores participant addresses, amount, token, work hash, approvals, and settlement status. It does not depend on external Solidity packages, so it can be compiled in Hardhat, Foundry, Remix, or deployment pipelines without dependency setup.

## Simulated AI Arbiter

The AI arbiter is intentionally deterministic for tests:

- Completion flags and work units increase confidence.
- Photo evidence slightly increases confidence.
- Failure, fraud, damage, incomplete work, or telemetry errors reduce confidence.
- Confidence at or above `0.65` adds the arbiter release approval.

This keeps the behavior testable while leaving room to replace the simulator with Anthropic MCP or another model-backed arbiter later.
