import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { initRedis } from './db/redis.js';
import { initWebSocket } from './websocket/manager.js';
import { seedDefaultRules } from './db/seed.js';
import transactionRoutes from './routes/transactions.js';
import userRoutes from './routes/users.js';
import rulesRoutes from './routes/rules.js';
import statsRoutes from './routes/stats.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.method !== 'GET') console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api/transactions', transactionRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/rules',        rulesRoutes);
app.use('/api/stats',        statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await seedDefaultRules();
    await initRedis();
    initWebSocket(server);

    server.listen(PORT, () => {
      console.log(`\nFintech Fraud Detection Server`);
      console.log(`   API:       http://localhost:${PORT}/api`);
      console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
      console.log(`   Health:    http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();