# MyZubster Robot API

## Escrow API

The escrow API coordinates a 2-of-3 release flow between:

- `client`: the customer paying for robot work
- `robot`: the autonomous worker
- `arbiter`: the AI or human dispute resolver

Funds are represented by the on-chain `RobotEscrow` contract. The gateway keeps the operational state used by robots and clients while the smart contract remains the settlement authority.

### Create Escrow

`POST /api/escrow/create`

```json
{
  "clientId": "client-1",
  "robotId": "robot-42",
  "arbiterId": "ai-arbiter",
  "amount": 0.06,
  "currency": "XMR",
  "chain": "base-sepolia",
  "contractAddress": "0x...",
  "workOrder": {
    "task": "mow lawn",
    "location": "field-a"
  }
}
```

Response:

```json
{
  "escrow": {
    "id": "escrow_...",
    "status": "funded",
    "releaseApprovals": {},
    "refundApprovals": {}
  }
}
```

### Get Escrow

`GET /api/escrow/:id`

Returns the current escrow status, approvals, dispute, and AI review details.

### Confirm Release

`POST /api/escrow/:id/confirm-release`

```json
{
  "role": "client",
  "evidence": {
    "accepted": true
  }
}
```

Any two roles among `client`, `robot`, and `arbiter` release the escrow.

### Confirm Refund

`POST /api/escrow/:id/confirm-refund`

```json
{
  "role": "arbiter",
  "evidence": {
    "reason": "work incomplete"
  }
}
```

Any two refund approvals return funds to the client and settle the escrow as `refunded`.

### Raise Dispute

`POST /api/escrow/:id/dispute`

```json
{
  "role": "client",
  "reason": "robot stopped before completion"
}
```

The escrow moves to `disputed`, but it can still be settled by 2-of-3 release or refund approvals.

### Simulated AI Arbiter

`POST /api/escrow/:id/ai-arbitrate`

```json
{
  "telemetry": {
    "completed": true,
    "workUnits": 24
  },
  "evidence": {
    "photoCount": 2
  }
}
```

The simulated arbiter returns a review and, when confidence is high enough, adds the arbiter release approval.

### Robot Integration

`GET /api/robot/:robotId/escrows`

Returns every escrow currently linked to a robot. Robots can poll this endpoint before starting paid work or before requesting release approval.
