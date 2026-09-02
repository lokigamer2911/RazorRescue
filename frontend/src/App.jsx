import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import CommandCenter from './pages/CommandCenter';
import Investigation from './pages/Investigation';
import Recovery from './pages/Recovery';
import Timeline from './pages/Timeline';
import Simulator from './pages/Simulator';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Copilot from './components/Copilot';
import { AppStateProvider } from './hooks/useAppState';

const VIEWS = {
  'command-center': CommandCenter,
  investigation: Investigation,
  recovery: Recovery,
  timeline: Timeline,
  simulate: Simulator,
  settings: Settings,
};

export default function App() {
  const [view, setView] = useState('command-center');
  const [copilotOpen, setCopilotOpen] = useState(false);

  const CurrentView = VIEWS[view];

  return (
    <AppStateProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-surface-0">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet/[0.04] rounded-full blur-[120px]" />
          <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-emerald/[0.02] rounded-full blur-[100px]" />
          <div className="grid-pattern absolute inset-0 opacity-30" />
        </div>

        {/* Main Layout */}
        <Sidebar view={view} setView={setView} />
        
        <main className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <CurrentView key={view} />
          </AnimatePresence>
        </main>

        {/* AI Copilot */}
        <Copilot open={copilotOpen} onToggle={() => setCopilotOpen(!copilotOpen)} />
      </div>
    </AppStateProvider>
  );
}
