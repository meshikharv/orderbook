/**
 * Mock API client used for the GitHub Pages static demo.
 * All state is in-memory — refreshing the page resets everything.
 */

import {
  MOCK_ORDERS, MOCK_DEMO_USER, MOCK_ACTIVE_TRADE, MOCK_USERS,
} from './mockData';
import type { Currency, Order, OrderType, Trade } from '../../../shared/types';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// Mutable in-memory state
let orders = MOCK_ORDERS.map((o) => ({ ...o }));
let activeTrade: (Trade & { order: Order; poster_username: string; acceptor_username: string }) | null = null;
let tradeIdCounter = 200;
let orderIdCounter = 10;

export const mockApi = {
  getMe: async () => {
    await delay();
    return { exists: true, user: MOCK_DEMO_USER };
  },

  onboard: async (body: { fedi_username: string; country: string; preferred_currency: string }) => {
    await delay();
    return { user: { ...MOCK_DEMO_USER, ...body } };
  },

  getOrders: async (params?: { currency?: string; type?: string }) => {
    await delay(300);
    let result = orders.filter((o) => o.status === 'OPEN');
    if (params?.currency) result = result.filter((o) => o.currency === params.currency);
    if (params?.type) result = result.filter((o) => o.type === params.type);
    return { orders: result };
  },

  createOrder: async (body: { type: string; btc_amount: number; price_per_btc: number; currency: string; notes?: string }) => {
    await delay(500);
    if (activeTrade) {
      throw new Error('You have an active trade in progress. Both parties must close it before you can post a new order.');
    }
    const order = {
      id: ++orderIdCounter,
      poster_npub: MOCK_DEMO_USER.npub,
      poster_username: MOCK_DEMO_USER.fedi_username,
      poster_trust_score: MOCK_DEMO_USER.trust_score,
      type: body.type as OrderType,
      btc_amount: body.btc_amount,
      price_per_btc: body.price_per_btc,
      currency: body.currency as Currency,
      notes: body.notes,
      status: 'OPEN' as const,
      created_at: new Date().toISOString().replace('Z', ''),
    };
    orders = [order, ...orders];
    return { order };
  },

  cancelOrder: async (id: number) => {
    await delay(300);
    orders = orders.map((o) => o.id === id ? { ...o, status: 'CANCELLED' as const } : o);
    return { success: true };
  },

  acceptOrder: async (order_id: number) => {
    await delay(600);
    if (activeTrade) {
      throw new Error("You're currently in an active trade. Finish it before starting a new one.");
    }
    const order = orders.find((o) => o.id === order_id);
    if (!order || order.status !== 'OPEN') {
      throw new Error('This order was just taken. Check back for other orders.');
    }
    if (order.poster_npub === MOCK_DEMO_USER.npub) {
      throw new Error("You can't trade with yourself.");
    }
    orders = orders.map((o) => o.id === order_id ? { ...o, status: 'ACCEPTED' as const } : o);
    const posterUser = MOCK_USERS.find((u) => u.npub === order.poster_npub);
    activeTrade = {
      id: ++tradeIdCounter,
      order_id,
      poster_npub: order.poster_npub,
      acceptor_npub: MOCK_DEMO_USER.npub,
      poster_username: posterUser?.fedi_username ?? order.poster_username ?? 'unknown',
      acceptor_username: MOCK_DEMO_USER.fedi_username,
      status: 'IN_PROGRESS',
      poster_confirmed: false,
      acceptor_confirmed: false,
      created_at: new Date().toISOString().replace('Z', ''),
      order: { ...order },
    };
    return { trade: activeTrade };
  },

  getActiveTrade: async () => {
    await delay(200);
    return { trade: activeTrade };
  },

  getTrade: async (_id: number) => {
    await delay(200);
    return { trade: activeTrade };
  },

  confirmTrade: async (_id: number) => {
    await delay(500);
    if (!activeTrade) throw new Error('Trade not found');
    // In demo: acceptor confirms, then simulate poster confirming too → closes
    activeTrade = {
      ...activeTrade,
      acceptor_confirmed: true,
      poster_confirmed: true,
      status: 'CLOSED',
      closed_at: new Date().toISOString().replace('Z', ''),
    };
    return { trade: activeTrade, closed: true };
  },

  disputeTrade: async (_id: number, _reason: string) => {
    await delay(500);
    if (!activeTrade) throw new Error('Trade not found');
    activeTrade = { ...activeTrade, status: 'DISPUTED' };
    return { success: true };
  },

  // Admin stubs — not used in demo mode
  adminStats: async () => ({ total_trades: 42, total_btc_volume: 3.27, active_trades: 2, open_disputes: 1 }),
  adminDisputes: async () => ({ disputes: [] }),
  adminRuleDispute: async () => ({ success: true }),
  adminUsers: async () => ({ users: MOCK_USERS }),
  adminAdjustTrust: async () => ({ success: true }),
  adminTrades: async () => ({ trades: [MOCK_ACTIVE_TRADE] }),
  adminOrders: async () => ({ orders }),
};
