# x402 Conditional Payments

Issue #89 asks for an x402 payment flow where funds are released only when the robot completes work successfully. If the work fails, the client gets the funds back. If client and robot disagree, a simulated AI decision can release or refund the payment.

## State Flow

1. `escrow_locked`: funds are locked before work starts.
2. `work_in_progress`: the robot accepted and started the job.
3. `awaiting_client_confirmation`: the robot submitted completion evidence.
4. `released`: robot evidence and client approval satisfy the success condition.
5. `refunded`: the robot reports failure or AI rejects the work.
6. `disputed`: the client rejects the work and AI/manual review is needed.

## Success Conditions

The default policy requires:

- robot completion evidence
- client approval
- no robot-reported error
- AI confidence of at least `0.65` when AI review is used

Projects can relax or tighten these conditions through the `successCriteria` object when creating a payment.

## Gateway Module

`x402-gateway/src/conditionalPayment.js` exports:

- `createConditionalPayment`
- `markWorkStarted`
- `submitRobotEvidence`
- `recordClientDecision`
- `recordRobotFailure`
- `simulateAiReview`
- `applyAiDecision`

The module is dependency-free and can be wired into HTTP routes or an escrow service without requiring a specific database.

## Example

```js
const {
  createConditionalPayment,
  submitRobotEvidence,
  recordClientDecision
} = require("./src/conditionalPayment");

let payment = createConditionalPayment({
  clientId: "client-1",
  robotId: "robot-1",
  amountXmr: 0.06
});

payment = submitRobotEvidence(payment, { completed: true, workUnits: 24 });
payment = recordClientDecision(payment, { approved: true });

console.log(payment.status); // released
```

## Validation

```bash
node --test x402-gateway/test/conditionalPayment.test.js
node --check x402-gateway/src/conditionalPayment.js
```
