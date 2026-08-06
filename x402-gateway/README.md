# 🚪 x402 Gateway for Robots

**HTTP 402 Payment Required endpoints for autonomous robots**

---

## 📡 **API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/robot/register` | Register a new robot |
| `GET` | `/api/robot/charge` | Request recharge (returns 402) |
| `GET` | `/api/robot/:id` | Get robot info |
| `POST` | `/api/escrow/create` | Create a funded robot-work escrow |
| `GET` | `/api/escrow/:id` | Read escrow status and approvals |
| `POST` | `/api/escrow/:id/confirm-release` | Add a release approval |
| `POST` | `/api/escrow/:id/confirm-refund` | Add a refund approval |
| `POST` | `/api/escrow/:id/dispute` | Raise a disputed escrow |
| `POST` | `/api/escrow/:id/ai-arbitrate` | Run the simulated AI arbiter |
| `GET` | `/api/robot/:id/escrows` | List escrows assigned to a robot |

---

## 🚀 **Quick Start**

```bash
npm install
npm start
