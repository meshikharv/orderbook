const BASE = '/api';

let currentNpub: string | null = null;
let adminPassword: string | null = null;

export function setNpub(npub: string) { currentNpub = npub; }
export function setAdminPassword(pw: string) { adminPassword = pw; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (currentNpub) headers['X-User-Npub'] = currentNpub;
  if (adminPassword) headers['X-Admin-Password'] = adminPassword;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  // Users
  getMe: () => request<{ exists: boolean; user?: any }>('/users/me'),
  onboard: (body: { fedi_username: string; country: string; preferred_currency: string }) =>
    request<{ user: any }>('/users/onboard', { method: 'POST', body: JSON.stringify(body) }),

  // Orders
  getOrders: (params?: { currency?: string; type?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<{ orders: any[] }>(`/orders${qs}`);
  },
  createOrder: (body: { type: string; btc_amount: number; price_per_btc: number; currency: string; notes?: string }) =>
    request<{ order: any }>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  cancelOrder: (id: number) =>
    request<{ success: boolean }>(`/orders/${id}`, { method: 'DELETE' }),

  // Trades
  acceptOrder: (order_id: number) =>
    request<{ trade: any }>(`/trades/accept/${order_id}`, { method: 'POST' }),
  getActiveTrade: () => request<{ trade: any }>('/trades/active'),
  getTrade: (id: number) => request<{ trade: any }>(`/trades/${id}`),
  confirmTrade: (id: number) =>
    request<{ trade: any; closed: boolean }>(`/trades/${id}/confirm`, { method: 'POST' }),
  disputeTrade: (id: number, reason: string) =>
    request<{ success: boolean }>(`/trades/${id}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Admin
  adminStats: () => request<any>('/admin/stats'),
  adminDisputes: () => request<{ disputes: any[] }>('/admin/disputes'),
  adminRuleDispute: (id: number, body: { ruling: string; ruling_notes: string; penalized_npub: string }) =>
    request<{ success: boolean }>(`/admin/disputes/${id}/rule`, { method: 'POST', body: JSON.stringify(body) }),
  adminUsers: () => request<{ users: any[] }>('/admin/users'),
  adminAdjustTrust: (npub: string, delta: number, reason: string) =>
    request<{ success: boolean }>(`/admin/users/${npub}/trust`, { method: 'POST', body: JSON.stringify({ delta, reason }) }),
  adminTrades: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<{ trades: any[] }>(`/admin/trades${qs}`);
  },
  adminOrders: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<{ orders: any[] }>(`/admin/orders${qs}`);
  },
};
