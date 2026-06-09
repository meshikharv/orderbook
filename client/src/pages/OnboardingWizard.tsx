import { useState } from 'react';
import { api } from '../api/client';
import type { Currency } from '../../../shared/types';

interface Props {
  npub: string;
  prefillUsername?: string | null;
  onComplete: (user: any) => void;
}

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'INR', label: '🇮🇳 INR — Indian Rupee' },
  { value: 'USD', label: '🇺🇸 USD — US Dollar' },
  { value: 'EUR', label: '🇪🇺 EUR — Euro' },
  { value: 'KES', label: '🇰🇪 KES — Kenyan Shilling' },
  { value: 'PHP', label: '🇵🇭 PHP — Philippine Peso' },
];

const COUNTRIES = [
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'KE', label: '🇰🇪 Kenya' },
  { value: 'PH', label: '🇵🇭 Philippines' },
  { value: 'OTHER', label: '🌍 Other' },
];

export function OnboardingWizard({ npub: _npub, prefillUsername, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState(prefillUsername || '');
  const [country, setCountry] = useState('IN');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const stepHints = [
    'Your Fedi username helps other traders identify you.',
    'Your country helps us tailor the experience.',
    'Your preferred currency is used for price display.',
  ];

  async function finish() {
    setLoading(true);
    setError('');
    try {
      const { user } = await api.onboard({ fedi_username: username.trim(), country, preferred_currency: currency });
      onComplete(user);
    } catch (e: any) {
      setError(e.message || 'Failed to save profile. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#242424' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ background: '#F7931A', width: step >= s ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Step {step} of 3</p>
        <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>{stepHints[step - 1]}</p>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">What's your Fedi username?</h2>
            <input
              type="text"
              placeholder="e.g. satoshi_india"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoFocus
            />
            {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
            <button
              onClick={() => {
                if (!username.trim()) { setError('Username is required'); return; }
                setStep(2);
              }}
              className="w-full py-3 text-white rounded-xl font-bold"
              style={{ background: '#F7931A' }}
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Select your country</h2>
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold"
                style={{ background: '#242424', color: '#fff' }}>← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl font-bold text-white"
                style={{ background: '#F7931A' }}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Preferred currency</h2>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold"
                style={{ background: '#242424', color: '#fff' }}>← Back</button>
              <button
                onClick={finish}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-white"
                style={{ background: '#F7931A' }}
              >
                {loading ? 'Saving…' : 'Finish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
