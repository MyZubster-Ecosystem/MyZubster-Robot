# x402 Gateway for Robots

HTTP 402 and escrow coordination endpoints for autonomous robots.

## Escrow Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/escrow/create` | Register an existing on-chain escrow reference |
| `GET` | `/api/escrow/:id` | Read metadata, proposals, and confirmed chain state |
| `POST` | `/api/escrow/:id/confirm-release` | Record a participant release proposal |
| `POST` | `/api/escrow/:id/confirm-refund` | Record a participant refund proposal |
| `POST` | `/api/escrow/:id/dispute` | Record a participant dispute |
| `POST` | `/api/escrow/:id/ai-arbitrate` | Evaluate evidence under the AI safety guardrails |
| `POST` | `/api/escrow/:id/reconcile` | Read and validate canonical on-chain state |
| `GET` | `/api/robot/:id/escrows` | List escrows assigned to a robot |

Approval endpoints require the participant's `actorId`; callers cannot select a
role directly. Authentication must bind the request identity to that actor ID.
The gateway never reports `released` or `refunded` until reconciliation confirms
the contract state.

## Development

```bash
npm ci
npm run test:escrow
npm --workspace x402-gateway start
```

See [`../docs/ESCROW.md`](../docs/ESCROW.md) for the trust model, EVM/XMR
boundary, deployment procedure, and security assumptions.
