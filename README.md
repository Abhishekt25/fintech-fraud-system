# FraudSentinel — Real-Time Fraud Detection System


##  Overview

FraudSentinel is a "real-time fraud detection system" that simulates how modern fintech platforms detect and respond to suspicious transactions.

It processes transactions through a "dynamic rule engine", assigns risk scores, and delivers "live updates via WebSockets" to an analyst dashboard.

---

## Live Demo

* Frontend (Vercel): https://fintechabhishek.vercel.app
* Backend (Render): https://fintech-fraud-system.onrender.com

---

## Deployment & Infrastructure

| Service          | Provider                    |
| ---------------- | --------------------------- |
| Frontend Hosting | Vercel                      |
| Backend Hosting  | Render                      |
| Database         | Neon (PostgreSQL)           |
| Cache / Redis    | Upstash                     |
| Real-time        | WebSockets (WSS over HTTPS) |

### Deployment Details

* Frontend is deployed on "Vercel" for fast CDN delivery
* Backend is hosted on "Render" as a Node.js web service
* PostgreSQL database is managed via "Neon"
* Redis caching and sliding window logic use "Upstash"
* Secure communication:

  * API → HTTPS
  * WebSocket → WSS


## Key Features

* Real-time transaction processing
* Dynamic rule engine (no restart required)
* Live updates using WebSockets (WSS)
* Analyst dashboard (users, rules, transactions)
* Risk scoring using EMA (Exponential Moving Average)
* Redis-based caching with in-memory fallback

---

## Tech Stack

| Layer     | Tech                           |
| --------- | ------------------------------ |
| Frontend  | React 18 + Vite + Tailwind CSS |
| Backend   | Node.js + Express              |
| Database  | PostgreSQL (Neon)              |
| Cache     | Redis (Upstash)                |
| Real-time | WebSockets (ws)                |
| State     | Zustand                        |




## Setup Instructions

## Architecture


```
Frontend (Vercel)
   │
   │ HTTPS + WSS
   ▼
Backend (Render)
   │
   ├── PostgreSQL (Neon DB)
   └── Redis (Upstash)
```

---

## Transaction Flow


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

##  Transaction Processing Flow


1. Transaction received via API
>>>>>>> 0cf98f4 (websocket URL issues)
2. Duplicate check (Redis / memory)
3. User validation (freeze check)
4. Sliding window calculations
5. Rule engine evaluation
6. Risk score calculation (EMA)
7. Data stored in PostgreSQL
8. Broadcast via WebSocket

---

## Rule Engine

* Stored in database
* Cached (5 seconds)
* Auto-refresh on update
* Supports AND / OR logic
* Evaluates:

  * `transaction.*`
  * `user.*`



## WebSocket

```
wss://fintech-fraud-system.onrender.com/ws
```

Broadcasts:

* Transactions
* User updates
* Rule updates
* Stats updates


Triggers:

* High Risk Country → BLOCK
* Large Transaction → FLAG
* Suspicious Category → FLAG


## Environment Variables

### Backend (Render)

```env
PORT=10000
DATABASE_URL=<Neon PostgreSQL URL>
UPSTASH_REDIS_REST_URL=<Upstash URL>
UPSTASH_REDIS_REST_TOKEN=<Upstash Token>
FRONTEND_URL=https://fintechabhishek.vercel.app
NODE_ENV=production
```

---

### Frontend (Vercel)

```env
VITE_API_URL=https://fintech-fraud-system.onrender.com
```

---

## Key Design Decisions

* Redis optional → system works without it
* Sliding window → efficient fraud detection
* EMA scoring → smooth risk updates
* Hot rule reload → no downtime
* WebSocket-first → real-time UX

