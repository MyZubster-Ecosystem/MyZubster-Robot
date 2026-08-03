# x402 Micropayment Batching

Issue #92 targets tiny x402 payments in the `0.001-0.01 XMR` range. Sending every payment as its own Monero transaction can make the fee percentage too high, so the gateway should collect small payments and settle them in batches when that becomes economical.

## Policy

The batching helper uses these defaults:

- direct fee estimate: `baseFeeXmr + perOutputFeeXmr`
- fee ratio ceiling: `2.5%`
- micropayment range: `0.001-0.01 XMR`
- settlement threshold: `0.02 XMR` per recipient
- forced settlement: `25` payments or `3600` seconds

All thresholds can be overridden by passing a policy object to `planMicropaymentSettlement`.

## Flow

1. Robots or clients create small x402 payment intents.
2. The gateway records each pending payment with recipient, amount, work order, and timestamp.
3. `planMicropaymentSettlement` groups payments by recipient and currency.
4. A group becomes a settlement batch when it reaches the amount threshold, the batch size limit, or the maximum hold time.
5. The gateway submits one Monero settlement per batch instead of one transaction per micropayment.

## Example

```js
const { planMicropaymentSettlement } = require("./src/micropaymentBatcher");

const plan = planMicropaymentSettlement([
  { id: "p1", recipient: "robot-a", amountXmr: 0.004 },
  { id: "p2", recipient: "robot-a", amountXmr: 0.006 },
  { id: "p3", recipient: "robot-a", amountXmr: 0.01 }
]);

console.log(plan.batches[0]);
```

The three `robot-a` payments settle as one `0.02 XMR` batch, saving two direct transaction fees.

## Validation

```bash
node --test x402-gateway/test/micropaymentBatcher.test.js
node --check x402-gateway/src/micropaymentBatcher.js
```
