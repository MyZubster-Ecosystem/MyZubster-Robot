# Escrow API — MyZubster Robot

API Gateway per l'escrow 2-di-3 (`contracts/RobotEscrow.sol`). Questo documento
descrive gli endpoint REST esposti dal gateway, il modello di integrazione con
MyZubster Gateway e la simulazione dell'AI Arbitro.

> Issue di riferimento: `MyZubster-Ecosystem/MyZubster-Robot#69`
> Contratto: `contracts/RobotEscrow.sol` (Polygon/Base)

---

## 1. Modello 2-di-3

Tre attori firmatari:

| Ruolo        | Chi è                                      | Firma                    |
|--------------|--------------------------------------------|--------------------------|
| **Cliente**  | Chi commissiona il lavoro                  | `clientApproved`         |
| **Robot**    | Chi esegue il lavoro                       | `robotApproved`          |
| **AI Arbitro** | Bot che verifica/risolve le dispute      | `arbiterApproved`        |

- **2 firme su 3** sbloccano il pagamento al Robot (firme combinate: Cliente+Robot,
  Cliente+Arbitro, Robot+Arbitro).
- L'**AI Arbitro** è lo spareggio: in disputa decide `releaseToRobot` (paga) o
  `refund` (rimborsa).

---

## 2. Endpoint del Gateway

Tutti gli endpoint autenticati con API key del gateway. Base URL: `/v1/escrow`.

### 2.1 Creare un job

```
POST /v1/escrow/jobs
{
  "robot": "0xRobotAddress",
  "arbiter": "0xArbiterAddress",
  "durationSeconds": 86400
}
```

Risposta:

```json
{ "jobId": "0x...", "status": "AwaitingFunding", "deadline": 1739000000 }
```

### 2.2 Depositare fondi (Cliente)

```
POST /v1/escrow/jobs/{jobId}/fund
{ "amountWei": "1000000000000000000" }
```

### 2.3 Avviare / completare il lavoro

```
POST /v1/escrow/jobs/{jobId}/start      # Robot
POST /v1/escrow/jobs/{jobId}/approve    # Cliente | Robot | Arbitro (firma)
```

Con la 2ª firma il contratto rilascia automaticamente i fondi al Robot
(evento `Released`).

### 2.4 Disputa e risoluzione

```
POST /v1/escrow/jobs/{jobId}/dispute                    # qualsiasi parte
POST /v1/escrow/jobs/{jobId}/resolve                   # solo AI Arbitro
{ "releaseToRobot": true }
```

### 2.5 Lettura stato

```
GET /v1/escrow/jobs/{jobId}   -> getJob() (client, robot, arbiter, amount, status, ...)
GET /v1/escrow/jobs           -> jobCount() + jobAt(i)
```

---

## 3. Integrazione con MyZubster Gateway

Il gateway MyZubster (webhook, reward, robot dashboard) inoltra gli eventi
on-chain dell'escrow tramite le seguenti azioni:

1. **`JOB_CREATED`** → il gateway registra il job e notifica il Robot.
2. **`FUNDED`** → il Cliente riceve conferma del blocco fondi.
3. **`WORK_STARTED`** → aggiorna la dashboard robot (`InProgress`).
4. **`APPROVED` / `RELEASED`** → chiude la bounty e attiva il payout MYZ/XTM.
5. **`DISPUTED` / `RESOLVED`** → l'AI Arbitro interviene e il gateway applica l'esito.

Il mapping evento → stato bounty è bidirezionale: una bounty "in-progress" sul
gateway corrisponde a un job `InProgress` on-chain.

---

## 4. AI Arbitro (simulato)

In assenza del bot off-chain, il verdetto è simulato in modo deterministico
tramite il contratto (`simulateArbiterVerdict`) o lato gateway:

```js
function simulateVerdict(jobId, nonce) {
  const h = sha256(`${jobId}:${nonce}`);
  return parseInt(h.slice(0, 8), 16) % 2 === 0; // true = rilascia al Robot
}
```

Il bot di produzione valuta l'evidenza (log del Robot, esito CI, proof-of-work)
e chiama `resolveDispute(jobId, releaseToRobot)` con la decisione reale.

---

## 5. Stati del contratto

```
AwaitingFunding → Funded → InProgress → Completed   (pagamento al Robot)
                          ↘ Disputed → (release | refund)
AwaitingFunding → Funded → (timeout) → Refunded     (rimborso Cliente)
```

Requisiti di sicurezza implementati:

- **2-di-3**: nessuna singola parte può sbloccare i fondi.
- **Timeout**: il Cliente può rimborsarsi se il lavoro scade.
- **Reentrancy-safe**: stato e saldo azzerati *prima* del trasferimento esterno
  (checks-effects-interactions).
- **Autorizzazione**: ogni funzione verifica il ruolo del chiamante.
