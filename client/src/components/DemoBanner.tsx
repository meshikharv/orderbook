const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export function DemoBanner() {
  if (!DEMO) return null;
  return (
    <div className="text-center text-xs py-2 px-4 font-medium"
      style={{ background: '#7B4FFF22', color: '#A78BFA', borderBottom: '1px solid #7B4FFF33' }}>
      🎭 Demo mode — all data is local & resets on refresh.{' '}
      <a href="https://github.com/meshikharv/orderbook" target="_blank" rel="noopener noreferrer"
        className="underline" style={{ color: '#7B4FFF' }}>
        View source →
      </a>
    </div>
  );
}
