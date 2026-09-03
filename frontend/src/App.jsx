import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Spinner from './components/Spinner';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import CommandCenter from './pages/CommandCenter';
import Investigation from './pages/Investigation';
import Recovery from './pages/Recovery';
import Timeline from './pages/Timeline';
import Simulator from './pages/Simulator';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Copilot from './components/Copilot';
import { AppStateProvider } from './hooks/useAppState';
import { AuthProvider, useAuth } from './hooks/useAuth';

const VIEWS = {
  'command-center': CommandCenter,
  investigation: Investigation,
  recovery: Recovery,
  timeline: Timeline,
  simulate: Simulator,
  settings: Settings,
};

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const { user, initializing, logout, processVerificationLink } = useAuth();
  const [page, setPage] = useState('landing'); // 'landing' | 'auth' | 'dashboard'

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
  const [authMode, setAuthMode] = useState('login');
  const [view, setView] = useState('command-center');
  const [copilotOpen, setCopilotOpen] = useState(false);

  const goAuth = (mode) => {
    setAuthMode(mode);
    setPage('auth');
  };

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

  const CurrentView = VIEWS[view];

  return (
    <AppStateProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
        <Sidebar
          view={view}
          setView={setView}
          onHome={() => setPage('landing')}
          onLogout={async () => {
            await logout();
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