import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../api/client';
import type { Currency, OrderType } from '../../../shared/types';
import { formatCurrency } from '../utils/format';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (order: any) => void;
  preferredCurrency: Currency;
}

const CURRENCIES: Currency[] = ['INR', 'USD', 'EUR', 'KES', 'PHP'];

export function PostOrderModal({ open, onClose, onCreated, preferredCurrency }: Props) {
  const [type, setType] = useState<OrderType>('BUY');
  const [btcAmount, setBtcAmount] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>(preferredCurrency);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [btcRef, setBtcRef] = useState<number | null>(null);
  const [btcRefError, setBtcRefError] = useState('');

  useEffect(() => {
    if (!open) return;
    setConfirmed(false);
    setErrors({});
    setServerError('');
    // Fetch BTC reference price
    const cur = currency.toLowerCase();
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${cur}`)
      .then((r) => r.json())
      .then((data) => {
        const ref = data?.bitcoin?.[cur];
        if (ref) setBtcRef(ref);
      })
      .catch(() => setBtcRefError("Couldn't fetch the current BTC price. You can enter it manually."));
  }, [open, currency]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!btcAmount || isNaN(Number(btcAmount)) || Number(btcAmount) <= 0)
      e.btcAmount = 'Enter a valid BTC amount';
    if (!price || isNaN(Number(price)) || Number(price) <= 0)
      e.price = 'Enter a valid price';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) setConfirmed(true);
  }

  async function handleSubmit() {
    setLoading(true);
    setServerError('');
    try {
      const { order } = await api.createOrder({
        type,
        btc_amount: Number(btcAmount),
        price_per_btc: Number(price),
        currency,
        notes: notes.trim() || undefined,
      });
      onCreated(order);
      onClose();
      resetForm();
    } catch (err: any) {
      setServerError(err.message);
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setBtcAmount(''); setPrice(''); setNotes(''); setConfirmed(false); setErrors({}); setServerError('');
  }

  const total = Number(btcAmount) * Number(price);

  if (confirmed) {
    return (
      <Modal open={open} onClose={onClose} title="Confirm Order">
        <div className="space-y-4">
          <div className="p-4 rounded-xl" style={{ background: '#242424' }}>
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: '#9CA3AF' }}>Type</span>
              <span className="font-bold" style={{ color: type === 'BUY' ? '#22C55E' : '#EF4444' }}>{type}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: '#9CA3AF' }}>BTC Amount</span>
              <span className="mono font-semibold text-white">{btcAmount} BTC</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: '#9CA3AF' }}>Price per BTC</span>
              <span className="mono font-semibold text-white">{formatCurrency(Number(price), currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2" style={{ borderColor: '#333' }}>
              <span className="text-white">Total</span>
              <span className="text-white mono">{formatCurrency(total, currency)}</span>
            </div>
            {notes && <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Notes: {notes}</p>}
          </div>
          {serverError && <p className="text-sm" style={{ color: '#EF4444' }}>{serverError}</p>}
          <div className="flex gap-3">
            <button onClick={() => setConfirmed(false)} className="flex-1 py-3 rounded-xl"
              style={{ background: '#242424', color: '#fff' }}>Edit</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl text-white font-bold"
              style={{ background: '#F7931A' }}>
              {loading ? 'Posting…' : 'Post Order'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Post an Order">
      <form onSubmit={handleReview} className="space-y-4">
        {/* Buy/Sell toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ background: '#242424' }}>
          {(['BUY', 'SELL'] as OrderType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={{
                background: type === t ? (t === 'BUY' ? '#22C55E' : '#EF4444') : 'transparent',
                color: type === t ? '#fff' : '#9CA3AF',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: '#9CA3AF' }}>BTC Amount</label>
          <input type="number" step="0.00000001" min="0" placeholder="0.01"
            value={btcAmount} onChange={(e) => { setBtcAmount(e.target.value); setErrors((p) => ({ ...p, btcAmount: '' })); }}
            className="mono" />
          {errors.btcAmount && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.btcAmount}</p>}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 flex justify-between" style={{ color: '#9CA3AF' }}>
            <span>Price per BTC ({currency})</span>
            {btcRef && <span className="text-xs">Ref: {formatCurrency(btcRef, currency)}</span>}
          </label>
          {btcRefError && <p className="text-xs mb-1" style={{ color: '#EAB308' }}>{btcRefError}</p>}
          <input type="number" min="0" placeholder={btcRef ? String(btcRef) : '7200000'}
            value={price} onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: '' })); }}
            className="mono" />
          {errors.price && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.price}</p>}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: '#9CA3AF' }}>Notes (optional)</label>
          <textarea placeholder="e.g. UPI only, quick trade preferred" rows={2}
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {serverError && <p className="text-sm" style={{ color: '#EF4444' }}>{serverError}</p>}

        {Number(btcAmount) > 0 && Number(price) > 0 && (
          <div className="text-sm" style={{ color: '#9CA3AF' }}>
            Total: <span className="text-white font-semibold">{formatCurrency(total, currency)}</span>
          </div>
        )}

        <button type="submit" className="w-full py-3 rounded-xl text-white font-bold"
          style={{ background: '#F7931A' }}>
          Review Order
        </button>
      </form>
    </Modal>
  );
}
