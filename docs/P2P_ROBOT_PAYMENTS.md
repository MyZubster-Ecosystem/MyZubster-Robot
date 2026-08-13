# x402 P2P Robot Payments

Issue #87 asks for robot-to-robot payments where one robot can request help from another robot, receive an x402 `Payment Required` response, lock funds, and release payment after service completion.

## Flow

1. Robot A creates a P2P service request for Robot B.
2. Robot B returns an x402 `Payment Required` payload.
3. Robot A locks funds in an escrow-style payment record.
4. Robot B accepts and performs the service.
5. Robot B submits completion evidence.
6. Robot A or the AI arbiter approves release.
7. Funds are released to Robot B or refunded to Robot A if the service fails.

## Reputation Gate

The module calculates a deterministic reputation score from:

- completed vs disputed jobs
- average rating
- successful vs failed payments
- completed-job volume

The default policy requires:

- requester reputation score at least `0.45`
- provider reputation score at least `0.55`

This keeps low-trust robots from creating or receiving automated P2P payment jobs without review.

## Endpoint Definitions

`src/p2pRobotPayments.js` exposes the state machine and `src/p2pRobotRoutes.js` exposes lightweight route handling for:

- `POST /api/p2p/requests`
- `GET /api/p2p/requests/:id`
- `POST /api/p2p/requests/:id/pay`
- `POST /api/p2p/requests/:id/accept`
- `POST /api/p2p/requests/:id/evidence`
- `POST /api/p2p/requests/:id/release`
- `POST /api/p2p/requests/:id/ai-decision`
- `POST /api/p2p/requests/:id/refund`

The route handler is dependency-free so it can be mounted behind Express, Fastify, a serverless adapter, or an existing x402 gateway.

## Validation

```bash
node --test test/p2pRobotPayments.test.js
node --check src/p2pRobotPayments.js
node --check src/p2pRobotRoutes.js
```
