import { useState, useEffect, useCallback } from 'react';
import { api, setAdminPassword } from '../api/client';
import { formatBTC, formatCurrency, timeAgo, trustColor, shortNpub } from '../utils/format';

type Tab = 'disputes' | 'users' | 'trades' | 'orders';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: '#1A1A1A' }}>
      <p className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-2xl font-bold text-white mono">{value}</p>
    </div>
  );
}

export function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [tab, setTab] = useState<Tab>('disputes');
  const [stats, setStats] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [trustEditing, setTrustEditing] = useState<string | null>(null);
  const [trustDelta, setTrustDelta] = useState('');
  const [trustReason, setTrustReason] = useState('');
  const [tradeStatusFilter, setTradeStatusFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAdminPassword(pwInput);
    try {
      const s = await api.adminStats();
      setStats(s);
      setAuthed(true);
    } catch {
      setPwError('Incorrect password');
    }
  }

  const loadData = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const [s, d, u] = await Promise.all([api.adminStats(), api.adminDisputes(), api.adminUsers()]);
      setStats(s); setDisputes(d.disputes); setUsers(u.users);
      const [t, o] = await Promise.all([api.adminTrades(tradeStatusFilter || undefined), api.adminOrders(orderStatusFilter || undefined)]);
      setTrades(t.trades); setOrders(o.orders);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [authed, tradeStatusFilter, orderStatusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function rule(dispute_id: number, ruling: string, penalized_npub: string) {
    try {
      await api.adminRuleDispute(dispute_id, { ruling, ruling_notes: '', penalized_npub });
      loadData();
    } catch (e: any) { alert(e.message); }
  }

  async function saveTrust(npub: string) {
    const delta = Number(trustDelta);
    if (!trustReason.trim() || isNaN(delta)) return;
    try {
      await api.adminAdjustTrust(npub, delta, trustReason.trim());
      setTrustEditing(null);
      loadData();
    } catch (e: any) { alert(e.message); }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0A0A0A' }}>
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Bitcoin P2P Orderbook</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Admin password" value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(''); }} />
            {pwError && <p className="text-sm" style={{ color: '#EF4444' }}>{pwError}</p>}
            <button type="submit" className="w-full py-3 rounded-xl text-white font-bold"
              style={{ background: '#F7931A' }}>Enter</button>
          </form>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'disputes', label: 'Disputes' },
    { id: 'users', label: 'Users' },
    { id: 'trades', label: 'Trades' },
    { id: 'orders', label: 'Orders' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A' }}>
      {/* Sidebar */}
      <div className="w-48 min-h-screen p-4 flex flex-col gap-1" style={{ background: '#111', borderRight: '1px solid #1A1A1A' }}>
        <div className="flex items-center gap-2 py-3 mb-4">
          <span className="text-lg" style={{ color: '#F7931A' }}>₿</span>
          <span className="font-bold text-white text-sm">Admin</span>
        </div>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: tab === t.id ? '#1A1A1A' : 'transparent',
              color: tab === t.id ? '#F7931A' : '#9CA3AF',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Trades" value={stats.total_trades} />
            <StatCard label="BTC Volume" value={`${Number(stats.total_btc_volume).toFixed(4)} BTC`} />
            <StatCard label="Active Trades" value={stats.active_trades} />
            <StatCard label="Open Disputes" value={stats.open_disputes} />
          </div>
        )}

        {loading && <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading…</p>}

        {/* Disputes */}
        {tab === 'disputes' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Open Disputes</h2>
            {disputes.length === 0 ? (
              <p className="text-sm" style={{ color: '#9CA3AF' }}>No open disputes.</p>
            ) : (
              <div className="space-y-4">
                {disputes.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl" style={{ background: '#1A1A1A' }}>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Trade #{d.trade_id}</p>
                        <p className="font-semibold text-white">{d.order_type} {formatBTC(d.btc_amount)} BTC @ {formatCurrency(d.price_per_btc, d.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Filed by</p>
                        <p className="font-semibold text-white">{d.raised_by_npub === d.poster_npub ? d.poster_username : d.acceptor_username}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Party A (poster)</p>
                        <p className="text-white">{d.poster_username}</p>
                        <p className="text-xs mono" style={{ color: '#9CA3AF' }}>{shortNpub(d.poster_npub)}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Party B (acceptor)</p>
                        <p className="text-white">{d.acceptor_username}</p>
                        <p className="text-xs mono" style={{ color: '#9CA3AF' }}>{shortNpub(d.acceptor_npub)}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg mb-3 text-sm" style={{ background: '#242424', color: '#9CA3AF' }}>
                      <span className="font-medium text-white">Reason: </span>{d.reason}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => rule(d.id, 'PARTY_A_WINS', d.acceptor_npub)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: '#22C55E22', color: '#22C55E' }}>
                        Rule for {d.poster_username}
                      </button>
                      <button onClick={() => rule(d.id, 'PARTY_B_WINS', d.poster_npub)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: '#22C55E22', color: '#22C55E' }}>
                        Rule for {d.acceptor_username}
                      </button>
                      <button onClick={() => rule(d.id, 'DISMISSED', '')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: '#EF444422', color: '#EF4444' }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Users ({users.length})</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: '#9CA3AF', borderBottom: '1px solid #242424' }}>
                    <th className="text-left py-2 pr-4">Username</th>
                    <th className="text-left py-2 pr-4">Trust</th>
                    <th className="text-left py-2 pr-4">Country</th>
                    <th className="text-left py-2 pr-4">Joined</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <>
                      <tr key={u.npub} style={{ borderBottom: '1px solid #1A1A1A' }}>
                        <td className="py-2 pr-4">
                          <p className="font-semibold text-white">{u.fedi_username}</p>
                          <p className="text-xs mono" style={{ color: '#9CA3AF' }}>{shortNpub(u.npub)}</p>
                        </td>
                        <td className="py-2 pr-4">
                          <span className="font-bold mono" style={{ color: trustColor(u.trust_score) }}>{u.trust_score}</span>
                        </td>
                        <td className="py-2 pr-4 text-white">{u.country}</td>
                        <td className="py-2 pr-4" style={{ color: '#9CA3AF' }}>{timeAgo(u.created_at)}</td>
                        <td className="py-2">
                          <button onClick={() => setTrustEditing(trustEditing === u.npub ? null : u.npub)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: '#242424', color: '#9CA3AF' }}>
                            Adjust Trust
                          </button>
                        </td>
                      </tr>
                      {trustEditing === u.npub && (
                        <tr key={u.npub + '_edit'} style={{ borderBottom: '1px solid #1A1A1A' }}>
                          <td colSpan={5} className="py-2">
                            <div className="flex gap-2 flex-wrap items-center">
                              <input type="number" placeholder="Delta (e.g. +5 or -10)"
                                value={trustDelta} onChange={(e) => setTrustDelta(e.target.value)}
                                className="w-40 text-sm py-1.5 px-2" />
                              <input type="text" placeholder="Reason (required)"
                                value={trustReason} onChange={(e) => setTrustReason(e.target.value)}
                                className="flex-1 min-w-[160px] text-sm py-1.5 px-2" />
                              <button onClick={() => saveTrust(u.npub)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                                style={{ background: '#F7931A', color: '#fff' }}>Save</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trades */}
        {tab === 'trades' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-white">All Trades</h2>
              <select value={tradeStatusFilter} onChange={(e) => setTradeStatusFilter(e.target.value)} className="text-sm py-1.5 w-40">
                <option value="">All statuses</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DISPUTED">Disputed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: '#9CA3AF', borderBottom: '1px solid #242424' }}>
                    <th className="text-left py-2 pr-4">ID</th>
                    <th className="text-left py-2 pr-4">Poster</th>
                    <th className="text-left py-2 pr-4">Acceptor</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #1A1A1A' }}>
                      <td className="py-2 pr-4 mono text-white">#{t.id}</td>
                      <td className="py-2 pr-4 text-white">{t.poster_username}</td>
                      <td className="py-2 pr-4 text-white">{t.acceptor_username}</td>
                      <td className="py-2 pr-4">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: t.status === 'CLOSED' ? '#22C55E22' : t.status === 'DISPUTED' ? '#EF444422' : '#F7931A22',
                            color: t.status === 'CLOSED' ? '#22C55E' : t.status === 'DISPUTED' ? '#EF4444' : '#F7931A',
                          }}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2" style={{ color: '#9CA3AF' }}>{timeAgo(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-white">All Orders</h2>
              <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="text-sm py-1.5 w-40">
                <option value="">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: '#9CA3AF', borderBottom: '1px solid #242424' }}>
                    <th className="text-left py-2 pr-4">ID</th>
                    <th className="text-left py-2 pr-4">Type</th>
                    <th className="text-left py-2 pr-4">Poster</th>
                    <th className="text-left py-2 pr-4">Amount</th>
                    <th className="text-left py-2 pr-4">Price</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #1A1A1A' }}>
                      <td className="py-2 pr-4 mono text-white">#{o.id}</td>
                      <td className="py-2 pr-4">
                        <span className="font-bold" style={{ color: o.type === 'BUY' ? '#22C55E' : '#EF4444' }}>{o.type}</span>
                      </td>
                      <td className="py-2 pr-4 text-white">{o.poster_username}</td>
                      <td className="py-2 pr-4 mono text-white">{formatBTC(o.btc_amount)}</td>
                      <td className="py-2 pr-4 mono text-white">{formatCurrency(o.price_per_btc, o.currency)}</td>
                      <td className="py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#1A1A1A', color: '#9CA3AF' }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
