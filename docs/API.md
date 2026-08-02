# 📚 MyZubster Robot – API Documentation

Questa documentazione copre tutte le API disponibili nel gateway MyZubster Robot.

---

## 📡 **Endpoint disponibili**

| Sezione | Endpoint base | Descrizione |
|---------|---------------|-------------|
| Monero | `/api/monero` | Integrazione Monero |
| Pagamenti | `/api/payments` | Gestione pagamenti |
| Robot | `/api/robot` | Gestione robot |
| Referral | `/api/referral` | Sistema referral |
| Escrow | `/api/escrow` | Garanzia e arbitraggio |
| Bounty | `/api/bounties` | GitHub bounties |

---

## ₿ **Monero API**

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/monero/main-balance` | Saldo wallet principale |
| POST | `/api/monero/generate-address` | Genera subaddress |
| POST | `/api/monero/check-balance` | Controlla saldo indirizzo |
| POST | `/api/monero/create-transaction` | Crea transazione |
| POST | `/api/monero/create-multisig` | Crea transazione multisig |

---

## 💰 **Payments API**

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Crea un ordine di pagamento |
| GET | `/api/payments/status/:orderId` | Verifica stato pagamento |

---

## 🤖 **Robot API**

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/robot/register` | Registra un robot |
| GET | `/api/robot/ricarica` | Richiede ricarica (x402, italiano) |
| GET | `/api/robot/charge` | Richiede ricarica (x402, standard) |
| GET | `/api/robot/:robotId` | Ottieni info robot |
| POST | `/api/robot/:robotId/location` | Aggiorna posizione GPS |
| POST | `/api/robot/clone` | Clona robot con referral |
| GET | `/api/robot/` | Lista tutti i robot attivi |

---

## 🔗 **Referral API**

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/referral/:referrer` | Ottieni fee accumulate dal referrer |
| POST | `/api/referral/withdraw` | Ritira le fee accumulate |

---

## 🔒 **Escrow API**

L'escrow è il sistema di garanzia che blocca i fondi fino al completamento del lavoro. Distribuisce automaticamente 90% al proprietario del robot, 2% a MyZubster, 8% al Bosco Comune.

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/escrow/create` | Crea un nuovo escrow |
| POST | `/api/escrow/:escrowId/complete` | Completa il lavoro (cliente) |
| POST | `/api/escrow/:escrowId/dispute` | Apri una disputa |
| POST | `/api/escrow/:escrowId/release` | Rilascia fondi (AI arbiter) |
| GET | `/api/escrow/:escrowId` | Ottieni stato escrow |

### 1️⃣ **Crea escrow**

```bash
curl -X POST http://localhost:10003/api/escrow/create \
  -H "Content-Type: application/json" \
  -d '{
    "robotId": "robot_001",
    "clientAddress": "45M4DW1...cliente...",
    "amount": 0.01,
    "jobDescription": "Taglio erba"
  }'
