# x402 Escrow Dashboard

Issue #90 asks for a dashboard where clients and robots can see payment status, escrow state, fees, transaction history, and dispute alerts.

## What Is Included

- Dashboard data normalization for x402 payments, transactions, and disputes
- Payment status filters for pending, escrow locked, completed, disputed, and refunded work
- Fee and amount summaries in XMR
- Active dispute and stale escrow alerts
- React dashboard view factory that can be mounted by any existing React app
- API client definitions for dashboard, payment, transaction, and dispute endpoints

## API Surface

The dashboard client expects these read-only endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/dashboard/x402-escrow` | Aggregated dashboard payload |
| GET | `/api/dashboard/x402-escrow/payments` | Filterable payment list |
| GET | `/api/dashboard/x402-escrow/transactions` | Transaction and fee history |
| GET | `/api/dashboard/x402-escrow/disputes` | Open dispute alert feed |

Supported query filters are `status`, `robotId`, `clientId`, and `query`.

## React Usage

```js
const React = require("react");
const { createEscrowDashboard } = require("./dashboard/src/EscrowDashboard");
const { createEscrowDashboardApi } = require("./dashboard/src/escrowDashboardApi");

const EscrowDashboard = createEscrowDashboard(React);
const api = createEscrowDashboardApi({ baseUrl: "https://gateway.example" });
```

The view factory uses `React.createElement` instead of JSX so the module remains dependency-light and can be adopted by Vite, Next.js, or an existing dashboard without requiring a new build pipeline.

## Validation

```bash
node --test dashboard/test/escrowDashboard.test.js
node --check dashboard/src/escrowDashboardData.js
node --check dashboard/src/escrowDashboardApi.js
node --check dashboard/src/EscrowDashboard.js
node --check dashboard/test/escrowDashboard.test.js
git diff --check
```
