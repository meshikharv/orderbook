import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { initWss } from './ws/broadcast';
import { expireAbandonedTrades } from './db/queries';
import usersRouter from './routes/users';
import ordersRouter from './routes/orders';
import tradesRouter from './routes/trades';
import adminRouter from './routes/admin';

// Initialize DB (runs schema creation on import)
import './db/schema';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/admin', adminRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
initWss(wss);

// Expire abandoned trades every 30 minutes
setInterval(() => {
  const expired = expireAbandonedTrades();
  if (expired > 0) console.log(`[cron] Expired ${expired} abandoned trade(s)`);
}, 30 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
