import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Spinner from './components/Spinner';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import CommandCenter from './pages/CommandCenter';
import Investigation from './pages/Investigation';
import Recovery from './pages/Recovery';
import Timeline from './pages/Timeline';
import Settings from './pages/Settings';
import ConnectGateway from './pages/ConnectGateway';
import Sidebar from './components/Sidebar';
import Copilot from './components/Copilot';
import { AppStateProvider } from './hooks/useAppState';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { getIdToken } from 'firebase/auth';
import { api, setAuthToken } from './utils/api';

const VIEWS = {
  'command-center': CommandCenter,
  investigation: Investigation,
  recovery: Recovery,
  timeline: Timeline,
  settings: Settings,
};

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
      {/* Mount point for Firebase reCAPTCHA (invisible) used by phone OTP sign-in/linking. */}
      <div id="phone-recaptcha" aria-hidden="true" style={{ position: 'fixed', left: '-9999px', width: '0', height: '0', overflow: 'hidden' }} />
    </AuthProvider>
  );
}

function AppInner() {
  const { user, initializing, logout, processVerificationLink } = useAuth();
  const [page, setPage] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  const [authMode, setAuthMode] = useState('login');
  const [view, setView] = useState('command-center');
  const [copilotOpen, setCopilotOpen] = useState(false);
  // gatewayState: 'checking' | 'none' | 'connected'
  const [gatewayState, setGatewayState] = useState('checking');

  // Keep the API layer authenticated with a fresh Firebase ID token.
  useEffect(() => {
    if (!user) {
      setAuthToken(null);
      return undefined;
    }
    let cancelled = false;
    getIdToken(user).then((token) => {
      if (!cancelled) setAuthToken(token);
    });
    return () => { cancelled = true; };
  }, [user]);

  // Check gateway connection when entering the dashboard.
  const checkGateway = useCallback(async () => {
    setGatewayState('checking');
    try {
      const status = await api.gatewayStatus();
      setGatewayState(status && status.connected ? 'connected' : 'none');
    } catch {
      setGatewayState('none');
    }
  }, []);

  const goAuth = (mode) => {
    setAuthMode(mode);
    setPage('auth');
  };

  useEffect(() => {
    if (page === 'dashboard' && user) checkGateway();
  }, [page, user, checkGateway]);

  // Opened from an email-verification link (?mode=verifyEmail&oobCode=…):
  // confirm the code, then a verified signed-in user lands on the dashboard.
  useEffect(() => {
    let cancelled = false;
    processVerificationLink().then((applied) => {
      if (applied && !cancelled) setPage('dashboard');
    });
    return () => {
      cancelled = true;
    };
  }, [processVerificationLink]);

  if (initializing) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center gap-3">
        <Spinner className="w-6 h-6 text-blue-600" />
        <span className="text-[12px] text-gray-400">Loading…</span>
      </div>
    );
  }

  if (page === 'landing') {
    return (
      <Landing
        onLaunch={() => (user ? setPage('dashboard') : goAuth('signup'))}
        onLogin={() => goAuth('login')}
        onSignup={() => goAuth('signup')}
        loggedIn={!!user}
      />
    );
  }

  if (page === 'auth' || !user) {
    return (
      <AuthPage
        initialMode={authMode}
        onSuccess={() => setPage('dashboard')}
        onBack={() => setPage('landing')}
      />
    );
  }

  // Signed in — checking gateway connection, or onboarding the merchant.
  if (gatewayState === 'checking') {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center gap-3">
        <Spinner className="w-6 h-6 text-blue-600" />
        <span className="text-[12px] text-gray-400">Checking your account…</span>
      </div>
    );
  }

  if (gatewayState === 'none') {
    return (
      <ConnectGateway
        onConnected={async () => {
          const status = await api.gatewayStatus();
          setGatewayState(status && status.connected ? 'connected' : 'none');
        }}
      />
    );
  }

  const CurrentView = VIEWS[view];

  return (
    <AppStateProvider userId={user.uid}>
      <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
        <Sidebar
          view={view}
          setView={setView}
          onHome={() => setPage('landing')}
          onLogout={async () => {
            await logout();
            setAuthToken(null);
            setView('command-center');
            setPage('landing');
          }}
        />
        <main className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <CurrentView key={view} view={view} setView={setView} />
          </AnimatePresence>
        </main>
        <Copilot open={copilotOpen} onToggle={() => setCopilotOpen(!copilotOpen)} />
      </div>
    </AppStateProvider>
  );
}