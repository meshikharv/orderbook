import { useState, useEffect } from 'react';
import { useFediIdentity } from './hooks/useFediIdentity';
import { FediError } from './pages/FediError';
import { DesktopNpubPrompt } from './pages/DesktopNpubPrompt';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { Dashboard } from './pages/Dashboard';
import { TradeRoom } from './pages/TradeRoom';
import { AdminDashboard } from './pages/AdminDashboard';
import { api, setNpub } from './api/client';

type AppState = 'loading' | 'onboarding' | 'dashboard' | 'trade_room';

function AdminGate() {
  return <AdminDashboard />;
}

function UserApp() {
  const { state: identityState, npub, resolveManualNpub, clearIdentity, getFediUsername } = useFediIdentity();
  const [appState, setAppState] = useState<AppState>('loading');
  const [user, setUser] = useState<any>(null);
  const [activeTrade, setActiveTrade] = useState<any>(null);

  useEffect(() => {
    if (identityState.status !== 'resolved' || !npub) return;
    setNpub(npub);
    checkUser();
  }, [identityState.status, npub]);

  async function checkUser() {
    try {
      const { exists, user: u } = await api.getMe();
      if (!exists || !u) {
        setAppState('onboarding');
        return;
      }
      setUser(u);
      const { trade } = await api.getActiveTrade();
      if (trade) {
        setActiveTrade(trade);
        setAppState('trade_room');
      } else {
        setAppState('dashboard');
      }
    } catch {
      setAppState('onboarding');
    }
  }

  function handleOnboardComplete(u: any) {
    setUser(u);
    setAppState('dashboard');
  }

  function handleTradeStart(trade: any) {
    setActiveTrade(trade);
    setAppState('trade_room');
  }

  async function refreshTrade() {
    if (!activeTrade) return;
    try {
      const { trade } = await api.getTrade(activeTrade.id);
      setActiveTrade(trade);
      if (trade.status === 'CLOSED') {
        setTimeout(() => {
          setActiveTrade(null);
          setAppState('dashboard');
        }, 2000);
      }
    } catch { /* ignore */ }
  }

  if (identityState.status === 'loading' || (identityState.status === 'resolved' && appState === 'loading')) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-4xl animate-pulse" style={{ color: '#F7931A' }}>₿</div>
      </div>
    );
  }
  if (identityState.status === 'mobile_no_fedi') return <FediError />;
  if (identityState.status === 'desktop_prompt') {
    return <DesktopNpubPrompt onResolve={resolveManualNpub} />;
  }
  if (!npub) return null;

  if (appState === 'onboarding') {
    return (
      <OnboardingWizard
        npub={npub}
        prefillUsername={getFediUsername()}
        onComplete={handleOnboardComplete}
      />
    );
  }

  if (appState === 'trade_room' && activeTrade) {
    return (
      <TradeRoom
        trade={activeTrade}
        currentNpub={npub}
        onUpdate={refreshTrade}
      />
    );
  }

  if (appState === 'dashboard' && user) {
    return (
      <Dashboard
        user={user}
        npub={npub}
        onTradeStart={handleTradeStart}
        onLogout={clearIdentity}
      />
    );
  }

  return null;
}

export default function App() {
  const isAdmin = window.location.pathname.startsWith('/admin');
  if (isAdmin) return <AdminGate />;
  return <UserApp />;
}
