export type OrderType = 'BUY' | 'SELL';
export type OrderStatus = 'OPEN' | 'ACCEPTED' | 'CLOSED' | 'CANCELLED';
export type TradeStatus = 'IN_PROGRESS' | 'DISPUTED' | 'CLOSED';
export type Currency = 'INR' | 'USD' | 'EUR' | 'KES' | 'PHP';

export interface User {
  npub: string;
  fedi_username: string;
  country: string;
  preferred_currency: Currency;
  trust_score: number;
  created_at: string;
}

export interface Order {
  id: number;
  poster_npub: string;
  poster_username?: string;
  poster_trust_score?: number;
  type: OrderType;
  btc_amount: number;
  price_per_btc: number;
  currency: Currency;
  notes?: string;
  status: OrderStatus;
  created_at: string;
}

export interface Trade {
  id: number;
  order_id: number;
  poster_npub: string;
  acceptor_npub: string;
  poster_username?: string;
  acceptor_username?: string;
  status: TradeStatus;
  poster_confirmed: boolean;
  acceptor_confirmed: boolean;
  created_at: string;
  closed_at?: string;
  order?: Order;
}

export interface Dispute {
  id: number;
  trade_id: number;
  raised_by_npub: string;
  reason: string;
  admin_ruling?: string;
  ruling_notes?: string;
  created_at: string;
  trade?: Trade;
}

export interface TrustEvent {
  id: number;
  user_npub: string;
  delta: number;
  reason: string;
  created_at: string;
}

export interface AdminStats {
  total_trades: number;
  total_btc_volume: number;
  active_trades: number;
  open_disputes: number;
}

// WebSocket message types
export type WsMessageType =
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'TRADE_UPDATED'
  | 'PING'
  | 'PONG';

export interface WsMessage {
  type: WsMessageType;
  payload?: Order | Trade | Record<string, unknown>;
}
