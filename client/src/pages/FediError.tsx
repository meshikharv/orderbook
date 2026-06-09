export function FediError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
      style={{ background: '#0D0D0D' }}>
      <div className="text-5xl mb-6">₿</div>
      <h1 className="text-2xl font-bold text-white mb-3">Open inside Fedi</h1>
      <p className="mb-6" style={{ color: '#9CA3AF', maxWidth: 300 }}>
        This app needs to run inside the Fedi app to detect your identity.
      </p>
      <a
        href="https://fedi.xyz"
        className="px-6 py-3 rounded-xl font-bold text-white inline-block"
        style={{ background: '#7B4FFF' }}
      >
        Get Fedi →
      </a>
    </div>
  );
}
