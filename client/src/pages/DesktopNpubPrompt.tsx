import { useState } from 'react';

interface Props {
  onResolve: (npub: string) => void;
}

export function DesktopNpubPrompt({ onResolve }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed.startsWith('npub1') || trimmed.length < 60) {
      setError("That doesn't look like a valid NOSTR npub. Check it and try again.");
      return;
    }
    setError('');
    onResolve(trimmed);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-4xl mb-4 text-center">₿</div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">Desktop Mode</h1>
        <p className="text-center text-sm mb-8" style={{ color: '#9CA3AF' }}>
          Enter your NOSTR npub to continue (desktop mode).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="npub1..."
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(''); }}
              className="mono"
            />
            {error && <p className="text-sm mt-1.5" style={{ color: '#EF4444' }}>{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 font-bold rounded-xl text-white"
            style={{ background: '#F7931A' }}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
