interface Props { connected: boolean }

export function WsStatusBanner({ connected }: Props) {
  if (connected) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 text-center text-sm py-2 font-medium"
      style={{ background: '#EF444422', color: '#EF4444', borderBottom: '1px solid #EF444444' }}>
      Connection lost. Reconnecting…
    </div>
  );
}
