import db from './schema';
import { Currency, OrderStatus, OrderType, TradeStatus } from '../../../shared/types';

// --- Users ---

export function getUserByNpub(npub: string) {
  return db.prepare('SELECT * FROM users WHERE npub = ?').get(npub) as any;
}

export function createUser(npub: string, fedi_username: string, country: string, preferred_currency: Currency) {
  return db.prepare(
    'INSERT INTO users (npub, fedi_username, country, preferred_currency) VALUES (?, ?, ?, ?)'
  ).run(npub, fedi_username, country, preferred_currency);
}

export function updateUser(npub: string, fedi_username: string, country: string, preferred_currency: Currency) {
  return db.prepare(
    'UPDATE users SET fedi_username = ?, country = ?, preferred_currency = ? WHERE npub = ?'
  ).run(fedi_username, country, preferred_currency, npub);
}

export function getAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as any[];
}

export function adjustTrustScore(npub: string, delta: number, reason: string) {
  db.transaction(() => {
    db.prepare(`
      UPDATE users
      SET trust_score = MAX(0, MIN(100, trust_score + ?))
      WHERE npub = ?
    `).run(delta, npub);
    db.prepare(
      'INSERT INTO trust_events (user_npub, delta, reason) VALUES (?, ?, ?)'
    ).run(npub, delta, reason);
  })();
}

// --- Orders ---

export function getOpenOrders(currency?: string, type?: string) {
  let query = `
    SELECT o.*, u.fedi_username AS poster_username, u.trust_score AS poster_trust_score
    FROM orders o
    JOIN users u ON o.poster_npub = u.npub
    WHERE o.status = 'OPEN'
  `;
  const params: string[] = [];
  if (currency) {
    query += ' AND o.currency = ?';
    params.push(currency);
  }
  if (type && (type === 'BUY' || type === 'SELL')) {
    query += ' AND o.type = ?';
    params.push(type);
  }
  query += ' ORDER BY o.created_at DESC';
  return db.prepare(query).all(...params) as any[];
}

export function getOrderById(id: number) {
  return db.prepare(`
    SELECT o.*, u.fedi_username AS poster_username, u.trust_score AS poster_trust_score
    FROM orders o
    JOIN users u ON o.poster_npub = u.npub
    WHERE o.id = ?
  `).get(id) as any;
}

export function getAllOrdersAdmin(status?: string) {
  let query = `
    SELECT o.*, u.fedi_username AS poster_username
    FROM orders o
    JOIN users u ON o.poster_npub = u.npub
  `;
  const params: string[] = [];
  if (status) {
    query += ' WHERE o.status = ?';
    params.push(status);
  }
  query += ' ORDER BY o.created_at DESC';
  return db.prepare(query).all(...params) as any[];
}

export function createOrder(
  poster_npub: string,
  type: OrderType,
  btc_amount: number,
  price_per_btc: number,
  currency: Currency,
  notes?: string
) {
  return db.prepare(
    'INSERT INTO orders (poster_npub, type, btc_amount, price_per_btc, currency, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(poster_npub, type, btc_amount, price_per_btc, currency, notes || null);
}

export function updateOrderStatus(id: number, status: OrderStatus) {
  return db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
}

export function hasActiveOrder(npub: string): boolean {
  const row = db.prepare(`
    SELECT o.id FROM orders o
    JOIN trades t ON t.order_id = o.id
    WHERE (t.poster_npub = ? OR t.acceptor_npub = ?)
      AND t.status = 'IN_PROGRESS'
    LIMIT 1
  `).get(npub, npub);
  return !!row;
}

// --- Trades ---

export function getTradeByOrderId(order_id: number) {
  return db.prepare(`
    SELECT t.*,
      u1.fedi_username AS poster_username,
      u2.fedi_username AS acceptor_username
    FROM trades t
    JOIN users u1 ON t.poster_npub = u1.npub
    JOIN users u2 ON t.acceptor_npub = u2.npub
    WHERE t.order_id = ?
  `).get(order_id) as any;
}

export function getTradeById(id: number) {
  return db.prepare(`
    SELECT t.*,
      u1.fedi_username AS poster_username,
      u2.fedi_username AS acceptor_username
    FROM trades t
    JOIN users u1 ON t.poster_npub = u1.npub
    JOIN users u2 ON t.acceptor_npub = u2.npub
    WHERE t.id = ?
  `).get(id) as any;
}

export function getActiveTradeForUser(npub: string) {
  return db.prepare(`
    SELECT t.*,
      u1.fedi_username AS poster_username,
      u2.fedi_username AS acceptor_username
    FROM trades t
    JOIN users u1 ON t.poster_npub = u1.npub
    JOIN users u2 ON t.acceptor_npub = u2.npub
    WHERE (t.poster_npub = ? OR t.acceptor_npub = ?)
      AND t.status = 'IN_PROGRESS'
    LIMIT 1
  `).get(npub, npub) as any;
}

export function getAllTradesAdmin(status?: string) {
  let query = `
    SELECT t.*,
      u1.fedi_username AS poster_username,
      u2.fedi_username AS acceptor_username
    FROM trades t
    JOIN users u1 ON t.poster_npub = u1.npub
    JOIN users u2 ON t.acceptor_npub = u2.npub
  `;
  const params: string[] = [];
  if (status) {
    query += ' WHERE t.status = ?';
    params.push(status);
  }
  query += ' ORDER BY t.created_at DESC';
  return db.prepare(query).all(...params) as any[];
}

// Atomic accept — prevents race conditions
export function acceptOrderTransaction(order_id: number, poster_npub: string, acceptor_npub: string) {
  return db.transaction(() => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND status = 'OPEN'").get(order_id) as any;
    if (!order) return { success: false, reason: 'ORDER_TAKEN' };

    const existingTrade = db.prepare(`
      SELECT id FROM trades
      WHERE (poster_npub = ? OR acceptor_npub = ?)
        AND status = 'IN_PROGRESS'
      LIMIT 1
    `).get(acceptor_npub, acceptor_npub) as any;
    if (existingTrade) return { success: false, reason: 'ALREADY_IN_TRADE' };

    db.prepare("UPDATE orders SET status = 'ACCEPTED' WHERE id = ?").run(order_id);
    const result = db.prepare(
      'INSERT INTO trades (order_id, poster_npub, acceptor_npub) VALUES (?, ?, ?)'
    ).run(order_id, poster_npub, acceptor_npub);

    return { success: true, trade_id: result.lastInsertRowid };
  })();
}

export function confirmTrade(trade_id: number, npub: string) {
  return db.transaction(() => {
    const trade = db.prepare("SELECT * FROM trades WHERE id = ? AND status = 'IN_PROGRESS'").get(trade_id) as any;
    if (!trade) return { success: false, reason: 'TRADE_NOT_FOUND' };

    const isPoster = trade.poster_npub === npub;
    const isAcceptor = trade.acceptor_npub === npub;
    if (!isPoster && !isAcceptor) return { success: false, reason: 'NOT_PARTICIPANT' };

    if (isPoster) {
      db.prepare('UPDATE trades SET poster_confirmed = 1 WHERE id = ?').run(trade_id);
    } else {
      db.prepare('UPDATE trades SET acceptor_confirmed = 1 WHERE id = ?').run(trade_id);
    }

    const updated = db.prepare('SELECT * FROM trades WHERE id = ?').get(trade_id) as any;
    if (updated.poster_confirmed && updated.acceptor_confirmed) {
      db.prepare("UPDATE trades SET status = 'CLOSED', closed_at = datetime('now') WHERE id = ?").run(trade_id);
      db.prepare("UPDATE orders SET status = 'CLOSED' WHERE id = ?").run(updated.order_id);
      // Award trust points
      adjustTrustScore(updated.poster_npub, 5, 'Trade completed successfully');
      adjustTrustScore(updated.acceptor_npub, 5, 'Trade completed successfully');
      return { success: true, closed: true };
    }
    return { success: true, closed: false };
  })();
}

export function updateTradeStatus(trade_id: number, status: TradeStatus) {
  return db.prepare('UPDATE trades SET status = ? WHERE id = ?').run(status, trade_id);
}

// --- Disputes ---

export function createDispute(trade_id: number, raised_by_npub: string, reason: string) {
  return db.transaction(() => {
    db.prepare("UPDATE trades SET status = 'DISPUTED' WHERE id = ?").run(trade_id);
    return db.prepare(
      'INSERT INTO disputes (trade_id, raised_by_npub, reason) VALUES (?, ?, ?)'
    ).run(trade_id, raised_by_npub, reason);
  })();
}

export function getOpenDisputes() {
  return db.prepare(`
    SELECT d.*,
      t.poster_npub, t.acceptor_npub,
      u1.fedi_username AS poster_username,
      u2.fedi_username AS acceptor_username,
      o.btc_amount, o.price_per_btc, o.currency, o.type AS order_type
    FROM disputes d
    JOIN trades t ON d.trade_id = t.id
    JOIN users u1 ON t.poster_npub = u1.npub
    JOIN users u2 ON t.acceptor_npub = u2.npub
    JOIN orders o ON t.order_id = o.id
    WHERE d.admin_ruling IS NULL
    ORDER BY d.created_at DESC
  `).all() as any[];
}

export function resolveDispute(
  dispute_id: number,
  admin_ruling: string,
  ruling_notes: string,
  penalized_npub: string
) {
  return db.transaction(() => {
    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(dispute_id) as any;
    if (!dispute) return { success: false };

    db.prepare(
      'UPDATE disputes SET admin_ruling = ?, ruling_notes = ? WHERE id = ?'
    ).run(admin_ruling, ruling_notes, dispute_id);

    db.prepare("UPDATE trades SET status = 'CLOSED', closed_at = datetime('now') WHERE id = ?")
      .run(dispute.trade_id);

    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(dispute.trade_id) as any;
    db.prepare("UPDATE orders SET status = 'CLOSED' WHERE id = ?").run(trade.order_id);

    if (penalized_npub) {
      adjustTrustScore(penalized_npub, -15, `Admin ruled dispute against user (dispute #${dispute_id})`);
    }
    return { success: true };
  })();
}

// --- Auto-expire abandoned trades (called periodically) ---

export function expireAbandonedTrades() {
  const cutoff = "datetime('now', '-48 hours')";
  const abandoned = db.prepare(`
    SELECT * FROM trades
    WHERE status = 'IN_PROGRESS'
      AND created_at < ${cutoff}
  `).all() as any[];

  for (const trade of abandoned) {
    db.transaction(() => {
      db.prepare("UPDATE trades SET status = 'CLOSED', closed_at = datetime('now') WHERE id = ?").run(trade.id);
      db.prepare("UPDATE orders SET status = 'CANCELLED' WHERE id = ?").run(trade.order_id);
      adjustTrustScore(trade.poster_npub, -10, 'Trade abandoned — auto-expired after 48h');
      adjustTrustScore(trade.acceptor_npub, -10, 'Trade abandoned — auto-expired after 48h');
    })();
  }
  return abandoned.length;
}

// --- Stats ---

export function getAdminStats() {
  const total_trades = (db.prepare("SELECT COUNT(*) as c FROM trades").get() as any).c;
  const total_btc_volume = (db.prepare("SELECT COALESCE(SUM(o.btc_amount), 0) as v FROM trades t JOIN orders o ON t.order_id = o.id WHERE t.status = 'CLOSED'").get() as any).v;
  const active_trades = (db.prepare("SELECT COUNT(*) as c FROM trades WHERE status = 'IN_PROGRESS'").get() as any).c;
  const open_disputes = (db.prepare("SELECT COUNT(*) as c FROM disputes WHERE admin_ruling IS NULL").get() as any).c;
  return { total_trades, total_btc_volume, active_trades, open_disputes };
}
