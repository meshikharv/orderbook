import { useState } from 'react';
import type { Trade, Order } from '../../../shared/types';
import { api } from '../api/client';

import { formatBTC, formatCurrency, shortNpub } from '../utils/format';

interface Props {
  trade: Trade & { order?: Order };
  currentNpub: string;
  onUpdate: () => void;
}

// TODO: Verify exact Fedi deep link format for opening DMs with the Fedi team
function fediChatLink(username: string): string {
  return `fedi://chat/${username}`;
}

export function TradeRoom({ trade, currentNpub, onUpdate }: Props) {
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPoster = trade.poster_npub === currentNpub;
  const counterpartyUsername = isPoster ? trade.acceptor_username : trade.poster_username;
  const counterpartyNpub = isPoster ? trade.acceptor_npub : trade.poster_npub;
  const myConfirmed = isPoster ? trade.poster_confirmed : trade.acceptor_confirmed;
  const theirConfirmed = isPoster ? trade.acceptor_confirmed : trade.poster_confirmed;
  const order = trade.order;

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      await api.confirmTrade(trade.id);
      onUpdate();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.disputeTrade(trade.id, disputeReason.trim());
      onUpdate();
    } catch (e: any) {
      setError(e.message || 'Failed to submit dispute. Please try again or contact the group admin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Trade Room</h1>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Trade #{trade.id}</p>
      </div>

      {/* Status banner */}
      {trade.status === 'DISPUTED' && (
        <div className="p-4 rounded-xl mb-4" style={{ background: '#EF444422', border: '1px solid #EF444444' }}>
          <p className="font-semibold text-sm" style={{ color: '#EF4444' }}>Trade Under Dispute</p>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
            This trade is under dispute. An admin will review and contact both parties.
          </p>
        </div>
      )}
      {trade.status === 'CLOSED' && (
        <div className="p-4 rounded-xl mb-4" style={{ background: '#22C55E22', border: '1px solid #22C55E44' }}>
          <p className="font-semibold" style={{ color: '#22C55E' }}>Trade Closed ✓</p>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Both parties confirmed. Trust points awarded.</p>
        </div>
      )}
      {trade.status === 'IN_PROGRESS' && myConfirmed && !theirConfirmed && (
        <div className="p-3 rounded-xl mb-4 text-sm" style={{ background: '#F7931A22', color: '#F7931A' }}>
          Waiting for <strong>{counterpartyUsername}</strong> to confirm completion.
        </div>
      )}

      {/* Order summary */}
      {order && (
        <div className="p-4 rounded-xl mb-4" style={{ background: '#1A1A1A' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: order.type === 'BUY' ? '#22C55E22' : '#EF444422', color: order.type === 'BUY' ? '#22C55E' : '#EF4444' }}>
              {order.type}
            </span>
            <span className="font-semibold mono text-white">{formatBTC(order.btc_amount)} BTC</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span style={{ color: '#9CA3AF' }}>Price per BTC</span>
              <span className="mono text-white">{formatCurrency(order.price_per_btc, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9CA3AF' }}>Total</span>
              <span className="mono font-bold text-white">{formatCurrency(order.btc_amount * order.price_per_btc, order.currency)}</span>
            </div>
            {order.notes && <p className="text-xs pt-1" style={{ color: '#9CA3AF' }}>{order.notes}</p>}
          </div>
        </div>
      )}

      {/* Counterparty */}
      <div className="p-4 rounded-xl mb-4" style={{ background: '#1A1A1A' }}>
        <p className="text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>COUNTERPARTY</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: '#7B4FFF22', color: '#7B4FFF' }}>
            {(counterpartyUsername || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{counterpartyUsername}</p>
            <p className="text-xs mono mt-0.5" style={{ color: '#9CA3AF' }}>{shortNpub(counterpartyNpub)}</p>
          </div>
        </div>
        <a
          href={fediChatLink(counterpartyUsername || '')}
          className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm text-white"
          style={{ background: '#7B4FFF' }}
        >
          <span>💬</span> Open Chat in Fedi
        </a>
      </div>

      {/* Actions */}
      {trade.status === 'IN_PROGRESS' && (
        <div className="space-y-3">
          {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

          {!myConfirmed && (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: '#22C55E' }}
            >
              {loading ? 'Confirming…' : 'Mark as Complete'}
            </button>
          )}
          {myConfirmed && (
            <div className="py-3 text-center text-sm font-medium rounded-xl"
              style={{ background: '#22C55E22', color: '#22C55E' }}>
              You confirmed ✓
            </div>
          )}

          {!showDisputeForm ? (
            <button
              onClick={() => setShowDisputeForm(true)}
              className="w-full py-3 rounded-xl font-bold"
              style={{ background: '#EF444422', color: '#EF4444' }}
            >
              Raise a Dispute
            </button>
          ) : (
            <form onSubmit={handleDispute} className="space-y-3 p-4 rounded-xl" style={{ background: '#242424' }}>
              <p className="text-sm font-semibold text-white">Dispute Reason</p>
              <textarea
                rows={3}
                placeholder="Describe the issue…"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDisputeForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: '#333', color: '#fff' }}>Cancel</button>
                <button type="submit" disabled={loading || !disputeReason.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#EF4444', color: '#fff' }}>
                  Submit Dispute
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
