import { Order } from '../../../shared/types';
import { TrustBadge } from './TrustBadge';
import { formatBTC, formatCurrency, timeAgo } from '../utils/format';

interface Props {
  order: Order;
  currentNpub: string;
  onTrade: (order: Order) => void;
}

export function OrderCard({ order, currentNpub, onTrade }: Props) {
  const isBuy = order.type === 'BUY';
  const accentColor = isBuy ? '#22C55E' : '#F7931A';
  const total = order.btc_amount * order.price_per_btc;
  const isOwn = order.poster_npub === currentNpub;

  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{ background: '#1A1A1A', borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                background: isBuy ? '#22C55E22' : '#EF444422',
                color: isBuy ? '#22C55E' : '#EF4444',
              }}
            >
              {order.type}
            </span>
            <span className="text-white font-semibold mono text-sm">
              {formatBTC(order.btc_amount)} BTC
            </span>
          </div>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{timeAgo(order.created_at)}</span>
        </div>

        <div className="mb-3">
          <div className="text-xl font-bold mono" style={{ color: '#F7931A' }}>
            {formatCurrency(order.price_per_btc, order.currency)}
          </div>
          <div className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            Total: <span className="text-white font-medium">{formatCurrency(total, order.currency)}</span>
          </div>
        </div>

        {order.notes && (
          <div className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: '#242424', color: '#9CA3AF' }}>
            {order.notes}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#7B4FFF22', color: '#7B4FFF' }}>
              {(order.poster_username || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {order.poster_username || 'Unknown'}
                {isOwn && <span className="ml-1 text-xs" style={{ color: '#9CA3AF' }}>(you)</span>}
              </div>
              <TrustBadge score={order.poster_trust_score ?? 50} />
            </div>
          </div>
          {!isOwn && (
            <button
              onClick={() => onTrade(order)}
              className="px-4 py-2 text-sm font-bold rounded-lg"
              style={{ background: '#7B4FFF', color: '#fff' }}
            >
              Trade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
