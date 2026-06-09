import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/orderbook.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    npub TEXT PRIMARY KEY,
    fedi_username TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'IN',
    preferred_currency TEXT NOT NULL DEFAULT 'INR',
    trust_score INTEGER NOT NULL DEFAULT 50,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poster_npub TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('BUY', 'SELL')),
    btc_amount REAL NOT NULL,
    price_per_btc REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'ACCEPTED', 'CLOSED', 'CANCELLED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (poster_npub) REFERENCES users(npub)
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    poster_npub TEXT NOT NULL,
    acceptor_npub TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK(status IN ('IN_PROGRESS', 'DISPUTED', 'CLOSED')),
    poster_confirmed INTEGER NOT NULL DEFAULT 0,
    acceptor_confirmed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (poster_npub) REFERENCES users(npub),
    FOREIGN KEY (acceptor_npub) REFERENCES users(npub)
  );

  CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id INTEGER NOT NULL,
    raised_by_npub TEXT NOT NULL,
    reason TEXT NOT NULL,
    admin_ruling TEXT,
    ruling_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (trade_id) REFERENCES trades(id),
    FOREIGN KEY (raised_by_npub) REFERENCES users(npub)
  );

  CREATE TABLE IF NOT EXISTS trust_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_npub TEXT NOT NULL,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_npub) REFERENCES users(npub)
  );
`);

export default db;
