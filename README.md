# 🛡️ FraudSentinel — Real-Time Fraud Detection System

## Overview

FraudSentinel is a **real-time fraud detection system** designed to simulate how modern fintech platforms detect suspicious transactions.

It processes transactions through a **dynamic rule engine**, assigns risk scores, and provides **live updates via WebSockets** to an analyst dashboard.

This project demonstrates backend system design, real-time architecture, and scalable fraud detection logic.

---

## Key Capabilities

* Real-time fraud detection pipeline
* Dynamic rule engine (no server restart required)
* Live updates via WebSockets
* Analyst dashboard for monitoring and control
* Risk scoring using exponential moving average (EMA)
* Redis-backed performance optimizations (with fallback)

---

## Tech Stack

| Layer            | Tech                            |
| ---------------- | ------------------------------- |
| Frontend         | React 18 + Vite + Tailwind CSS  |
| Backend          | Node.js + Express (ESM)         |
| Database         | PostgreSQL                      |
| Cache/State      | Redis (with in-memory fallback) |
| Real-time        | WebSockets (`ws`)               |
| State Management | Zustand                         |

---

## ⚙️ Setup Instructions

### 1. Database Setup

```sql
CREATE DATABASE fintech_db;
```

---

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env`:

```env
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/fintech_fraud
REDIS_URL=redis://localhost:6379
```

Run backend:

```bash
npm run dev
```

Backend runs on:
`http://localhost:3001`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
`http://localhost:5173`

---

## System Architecture

```
Frontend (React + Zustand)
        │
        │ HTTP + WebSocket
        ▼
Backend (Express)
        │
        ├── PostgreSQL (persistent storage)
        └── Redis (cache + sliding windows)
```

---

## ⚡ Transaction Processing Flow

1. Incoming transaction received via API
2. Duplicate check (Redis / memory)
3. User status validation (freeze check)
4. Sliding window metrics calculation
5. Rule engine evaluation (dynamic rules)
6. Risk score calculation (EMA-based)
7. Data persisted to PostgreSQL
8. Real-time update sent via WebSocket

---

## Rule Engine

* Rules stored in database
* Cached for 5 seconds
* Auto-invalidated on update
* Supports AND / OR conditions
* Evaluates both:

  * `transaction.*`
  * `user.*`

---

##  API Endpoints

### Transactions

* `POST /api/transactions` — Submit transaction
* `GET /api/transactions` — Fetch transactions
* `PATCH /api/transactions/:id/override` — Analyst override

### Users

* `GET /api/users` — List users
* `POST /api/users` — Create user
* `PATCH /api/users/:id/freeze` — Freeze/unfreeze
* `PATCH /api/users/:id/reset-risk` — Reset risk

### Rules

* `GET /api/rules` — List rules
* `POST /api/rules` — Create rule
* `PUT /api/rules/:id` — Update rule
* `PATCH /api/rules/:id/toggle` — Enable/disable
* `DELETE /api/rules/:id` — Delete

### Stats

* `GET /api/stats` — Dashboard metrics

---

## WebSocket

```
ws://localhost:3001/ws
```

Broadcasts:

* Transactions
* Rule updates
* User updates
* Stats updates

---

##  Default Fraud Rules

| Priority | Rule                        | Action |
| -------- | --------------------------- | ------ |
| P100     | High risk user (score ≥ 80) | BLOCK  |
| P95      | High risk countries         | BLOCK  |
| P90      | High velocity transactions  | FLAG   |
| P85      | Multi-country activity      | FLAG   |
| P80      | Large transactions          | FLAG   |

---

##  Example Transaction

```json
{
  "user_id": "uuid",
  "amount": 7500,
  "merchant": "Binance",
  "category": "crypto",
  "country": "NK",
  "device_id": "device-1"
}
```

This may trigger:

* High Risk Country → BLOCK
* Large Transaction → FLAG
* Suspicious Category → FLAG

---

## 🧩 Key Design Decisions

* **Redis optional fallback** → system works even without Redis
* **Sliding window logic** → efficient fraud pattern detection
* **EMA risk scoring** → smooth risk evolution over time
* **Hot rule reload** → no downtime for rule updates
* **WebSocket-first updates** → real-time UX



---

##  Author

Built as part of a technical assignment to demonstrate:

* Backend system design
* Real-time data handling
* Scalable architecture
* Clean API design
