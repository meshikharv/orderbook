export function formatBTC(amount: number): string {
  return amount.toFixed(8).replace(/\.?0+$/, '');
}

export function formatCurrency(amount: number, currency: string): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export function trustColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 50) return '#EAB308';
  return '#EF4444';
}

export function trustLabel(score: number): string {
  if (score >= 80) return 'Trusted';
  if (score >= 50) return 'Neutral';
  return 'Caution';
}

export function shortNpub(npub: string): string {
  return `${npub.slice(0, 10)}…${npub.slice(-6)}`;
}
