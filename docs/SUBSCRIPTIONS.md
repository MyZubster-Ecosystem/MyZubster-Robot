# x402 Robot Subscriptions

Issue #88 asks for Robot-as-a-Service subscriptions where a client locks funds for a period and the robot receives tranche payments as recurring work is completed.

## Flow

1. Client and robot agree to a subscription period.
2. The client locks the full period amount in escrow.
3. The gateway splits the period into tranches.
4. For each tranche, the robot submits work evidence.
5. The client approves the completed tranche.
6. Due and approved tranches are released to the robot.
7. At the end of the period, the subscription can renew automatically.

## Gateway Module

`x402-gateway/src/subscriptionTranches.js` exports:

- `createRobotSubscription`
- `recordTrancheWork`
- `approveTranche`
- `releaseDueTranches`
- `refundRemainingTranches`
- `renewSubscription`
- `summarizeSubscription`

The module is dependency-free and stores plain objects, so it can be used with an in-memory store, a database record, or an HTTP route layer.

## Default Schedule

The default subscription is monthly-style:

- `periodDays`: `28`
- `trancheCount`: `4`
- `intervalDays`: `7`
- `autoRenew`: `true`

For an `0.08 XMR` monthly subscription, the gateway creates four weekly `0.02 XMR` tranches.

## Release Rules

A tranche releases only when:

- the due date has passed
- robot work evidence says `completed: true`
- no robot error is present
- the client approved the tranche

If the subscription is cancelled, unreleased tranches are marked refunded while already released tranches remain paid.

## Validation

```bash
node --test x402-gateway/test/subscriptionTranches.test.js
node --check x402-gateway/src/subscriptionTranches.js
```
