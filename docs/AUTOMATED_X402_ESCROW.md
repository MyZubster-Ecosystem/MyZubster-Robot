# Automated x402 + Escrow Flow

Issue #86 asks for a fully automated payment flow that connects x402 payment
requests with escrow release logic.

## Flow Covered

1. Robot creates an x402 `Payment Required` request.
2. Client payment is locked in escrow after a payment transaction is observed.
3. Robot starts work and submits completion evidence.
4. Client and robot sign the release.
5. Escrow releases payment to the robot after deducting the configured fees:
   2% platform, 8% network, and 5% referrer.
6. Timeout and dispute paths can refund the client or let the AI arbiter release
   or refund the escrow.

## Modules

- `src/automatedX402EscrowFlow.js`
  - Dependency-free workflow state machine.
  - Fee split calculator.
  - Release, refund, timeout, and dispute transitions.
- `src/automatedX402EscrowRoutes.js`
  - Lightweight route handler and in-memory store for gateway integration.
  - Documents unified endpoint behavior without requiring Express.

## Endpoint Surface

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/x402/escrow/request` | Create x402 payment request |
| POST | `/api/x402/escrow/:escrowId/lock` | Lock paid funds in escrow |
| POST | `/api/x402/escrow/:escrowId/start` | Robot starts work |
| POST | `/api/x402/escrow/:escrowId/evidence` | Robot submits work evidence |
| POST | `/api/x402/escrow/:escrowId/sign` | Client/robot signs release |
| POST | `/api/x402/escrow/:escrowId/dispute` | Raise a dispute |
| POST | `/api/x402/escrow/:escrowId/resolve` | AI arbiter resolves dispute |
| POST | `/api/x402/escrow/:escrowId/timeout` | Evaluate timeout behavior |
| GET | `/api/x402/escrow/:escrowId` | Read workflow state |

## Example

```js
const {
  createPaymentRequest,
  lockEscrow,
  startRobotWork,
  submitWorkEvidence,
  signWorkflow
} = require("./src/automatedX402EscrowFlow");

const request = createPaymentRequest({
  clientId: "client-1",
  robotId: "robot-1",
  amountXmr: 1
});

const locked = lockEscrow(request, { txId: "monero-tx-id" });
const started = startRobotWork(locked, { robotId: "robot-1" });
const submitted = submitWorkEvidence(started, { robotId: "robot-1" });
const clientSigned = signWorkflow(submitted, { role: "client", signerId: "client-1" });
const released = signWorkflow(clientSigned, { role: "robot", signerId: "robot-1" });
```

## Validation

Run:

```bash
node --test test/automatedX402EscrowFlow.test.js
node --check src/automatedX402EscrowFlow.js
node --check src/automatedX402EscrowRoutes.js
node --check test/automatedX402EscrowFlow.test.js
git diff --check
```

The tests cover x402 payment creation, escrow locking, the full release path,
fee splitting, timeout refunds, AI dispute resolution, signer validation,
terminal-state protection, endpoint definitions, and lightweight route handling.
