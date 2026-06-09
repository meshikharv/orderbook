import { useState, useEffect, useCallback } from 'react';
import { Order, WsMessage, Currency } from '../../../shared/types';
import { api } from '../api/client';
import { OrderCard } from '../components/OrderCard';
import { PostOrderModal } from './PostOrderModal';
import { TradeConfirmModal } from './TradeConfirmModal';
import { useWebSocket } from '../hooks/useWebSocket';
import { WsStatusBanner } from '../components/WsStatusBanner';
import { shortNpub } from '../utils/format';

interface Props {
  user: any;
  npub: string;
  onTradeStart: (trade: any) => void;
  onLogout: () => void;
}

export function Dashboard({ user, npub, onTradeStart, onLogout }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showPost, setShowPost] = useState(false);
  const [tradeTarget, setTradeTarget] = useState<Order | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filterCurrency) params.currency = filterCurrency;
      if (filterType) params.type = filterType;
      const { orders } = await api.getOrders(params);
      setOrders(orders);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filterCurrency, filterType]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type === 'ORDER_CREATED') {
      const order = msg.payload as Order;
      if (order.status === 'OPEN') {
        setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
      }
    } else if (msg.type === 'ORDER_UPDATED') {
      const order = msg.payload as Order;
      setOrders((prev) =>
        order.status === 'OPEN'
          ? prev.map((o) => (o.id === order.id ? order : o))
          : prev.filter((o) => o.id !== order.id)
      );
    }
  }, []);

  const { connected } = useWebSocket(handleWs);

  function sortedOrders(): Order[] {
    return [...orders].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price_asc') return a.price_per_btc - b.price_per_btc;
      if (sortBy === 'price_desc') return b.price_per_btc - a.price_per_btc;
      if (sortBy === 'trust') return (b.poster_trust_score ?? 50) - (a.poster_trust_score ?? 50);
      return 0;
    });
  }

  async function handleTrade(order: Order) {
    setTradeTarget(order);
    setTradeError('');
  }

  async function confirmTrade() {
    if (!tradeTarget) return;
    setTradeLoading(true);
    setTradeError('');
    try {
      const { trade } = await api.acceptOrder(tradeTarget.id);
      setTradeTarget(null);
      onTradeStart(trade);
    } catch (e: any) {
      setTradeError(e.message);
    } finally {
      setTradeLoading(false);
    }
  }

  const currencies: Currency[] = ['INR', 'USD', 'EUR', 'KES', 'PHP'];

  return (
    <>
      <WsStatusBanner connected={connected} />
      <div className="min-h-screen" style={{ paddingTop: connected ? 0 : 36 }}>
        {/* Header */}
        <div className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
          style={{ background: '#0D0D0D', borderBottom: '1px solid #1A1A1A' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black" style={{ color: '#F7931A' }}>₿</span>
            <span className="font-bold text-white text-sm">P2P Orderbook</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{user.fedi_username}</p>
              <p className="text-xs mono" style={{ color: '#9CA3AF' }}>{shortNpub(npub)}</p>
            </div>
            <button
              onClick={onLogout}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: '#242424', color: '#9CA3AF' }}
            >
              Log out
            </button>
          </div>
        </div>

        <div className="p-4 max-w-2xl mx-auto">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 min-w-[100px] text-sm py-2">
              <option value="">All Orders</option>
              <option value="BUY">BUY only</option>
              <option value="SELL">SELL only</option>
            </select>
            <select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)}
              className="flex-1 min-w-[100px] text-sm py-2">
              <option value="">All Currencies</option>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 min-w-[120px] text-sm py-2">
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="trust">Highest trust</option>
            </select>
          </div>

          {/* Post CTA */}
          <button
            onClick={() => setShowPost(true)}
            className="w-full py-3 mb-4 rounded-xl font-bold text-sm"
            style={{ background: '#F7931A', color: '#fff' }}
          >
            + Post an Order
          </button>

          {/* Order list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: '#1A1A1A' }} />
              ))}
            </div>
          ) : sortedOrders().length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-white font-semibold mb-1">No open orders right now.</p>
              <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>Be the first to post one.</p>
              <button onClick={() => setShowPost(true)} className="px-6 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#F7931A', color: '#fff' }}>
                Post Order
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedOrders().map((order) => (
                <OrderCard key={order.id} order={order} currentNpub={npub} onTrade={handleTrade} />
              ))}
            </div>
          )}
        </div>
      </div>

      <PostOrderModal
        open={showPost}
        onClose={() => setShowPost(false)}
        onCreated={(order) => setOrders((prev) => [order, ...prev])}
        preferredCurrency={user.preferred_currency}
      />
      <TradeConfirmModal
        open={!!tradeTarget}
        order={tradeTarget}
        onClose={() => setTradeTarget(null)}
        onConfirm={confirmTrade}
        loading={tradeLoading}
        error={tradeError}
      />
    </>
  );
}
