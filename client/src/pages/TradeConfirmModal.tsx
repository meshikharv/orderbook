import { Modal } from '../components/Modal';
import { Order } from '../../../shared/types';
import { formatBTC, formatCurrency } from '../utils/format';
import { TrustBadge } from '../components/TrustBadge';

interface Props {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string;
}

export function TradeConfirmModal({ open, order, onClose, onConfirm, loading, error }: Props) {
  if (!order) return null;
  return (
    <Modal open={open} onClose={onClose} title="Confirm Trade">
      <div className="space-y-4">
        <div className="p-4 rounded-xl" style={{ background: '#242424' }}>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: '#9CA3AF' }}>Order Type</span>
            <span className="font-bold" style={{ color: order.type === 'BUY' ? '#22C55E' : '#EF4444' }}>{order.type}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: '#9CA3AF' }}>BTC Amount</span>
            <span className="mono font-semibold text-white">{formatBTC(order.btc_amount)} BTC</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: '#9CA3AF' }}>Price per BTC</span>
            <span className="mono text-white">{formatCurrency(order.price_per_btc, order.currency)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2" style={{ borderColor: '#333' }}>
            <span className="text-white">Total</span>
            <span className="mono text-white">{formatCurrency(order.btc_amount * order.price_per_btc, order.currency)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: '#9CA3AF' }}>Counterparty:</span>
          <span className="font-semibold text-white">{order.poster_username}</span>
          <TrustBadge score={order.poster_trust_score ?? 50} />
        </div>

        {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl"
            style={{ background: '#242424', color: '#fff' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 rounded-xl font-bold"
            style={{ background: '#7B4FFF', color: '#fff' }}>
            {loading ? 'Starting…' : 'Start Trade'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
