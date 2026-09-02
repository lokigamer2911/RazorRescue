import { createContext, useContext, useState, useCallback } from 'react';
import { generateTransactions, analyseTransactions, generateIncident } from '../utils/simulation';
import { api } from '../utils/api';

const AppContext = createContext(null);

const INITIAL_MERCHANT = {
  name: 'CampusKart',
  potentialRevenue: 1000000,
  totalTransactions: 10000,
};

export function AppStateProvider({ children }) {
  const [merchant, setMerchant] = useState(INITIAL_MERCHANT);
  const [transactions, setTransactions] = useState(() =>
    generateTransactions(10000, { targetBanks: ['BOB', 'UBI', 'INB'] })
  );
  const [analysis, setAnalysis] = useState(() =>
    analyseTransactions(generateTransactions(10000, { targetBanks: ['BOB', 'UBI', 'INB'] }))
  );
  const [incidents, setIncidents] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);
  const [timeline, setTimeline] = useState([
    { time: '19:42', icon: '🔴', title: 'Payment failure spike detected', desc: 'UPI failure rate increased from 4.2% to 13.7%', type: 'danger' },
    { time: '19:43', icon: '🔍', title: 'AI investigation started', desc: 'Multi-model spiderweb activated — 12 AI models analyzing', type: 'info' },
    { time: '19:43', icon: '📊', title: '428 affected transactions identified', desc: 'Segmented by bank, amount, and time window', type: 'info' },
    { time: '19:44', icon: '💰', title: '₹62,400 revenue at risk calculated', desc: 'Based on failed transaction amounts and recovery probability', type: 'danger' },
    { time: '19:44', icon: '🧠', title: 'Recovery strategy generated', desc: 'Send payment links with alternate methods — LOW risk', type: 'success' },
    { time: '19:45', icon: '👤', title: 'Merchant approval requested', desc: 'Waiting for CampusKart to approve recovery campaign', type: 'warning' },
  ]);
  const [recoveryActive, setRecoveryActive] = useState(false);
  const [recoveryData, setRecoveryData] = useState({
    customersContacted: 0,
    paymentsRecovered: 0,
    amountRecovered: 0,
    recoveryRate: 0,
    progress: 0,
  });
  const [autopilotMode, setAutopilotMode] = useState('recommend');
  const [estimatedRecovery] = useState(82400);
  const [autoDemoRunning, setAutoDemoRunning] = useState(false);
  const [replayActive, setReplayActive] = useState(false);

  const addTimelineEntry = useCallback((entry) => {
    setTimeline(prev => [...prev, entry]);
  }, []);

  const runIncident = useCallback((type, severity, volume) => {
    const incident = generateIncident(type, severity, volume);
    setActiveIncident(incident);
    setIncidents(prev => [...prev, incident]);
    const txns = generateTransactions(volume, {
      targetBanks: incident.affectedBanks?.length ? incident.affectedBanks : ['BOB', 'UBI', 'INB'],
    });
    setTransactions(txns);
    setAnalysis(analyseTransactions(txns));
    addTimelineEntry({
      time: new Date().toTimeString().slice(0, 5),
      icon: '🔬',
      title: `Simulation: ${type.replace(/-/g, ' ')} incident`,
      desc: `${incident.affectedTransactions} affected, ₹${incident.revenueAtRisk.toLocaleString('en-IN')} at risk`,
      type: 'danger',
    });
    // Save to backend
    api.saveIncident(incident).catch(() => {});
    return incident;
  }, [addTimelineEntry]);

  // Auto-demo: full flow from detection to recovery
  const runAutoDemo = useCallback(async () => {
    if (autoDemoRunning) return;
    setAutoDemoRunning(true);

    // Step 1: Generate incident
    const incident = runIncident('upi-failure', 'high', 10000);
    addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '🤖', title: 'AI auto-detected incident', desc: 'Continuous monitoring triggered investigation', type: 'info' });

    // Step 2: Investigation (wait 2s)
    await new Promise(r => setTimeout(r, 2000));
    addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '🔍', title: 'Root cause identified', desc: '3 banks responsible for 71% of failures — NPCI routing issue', type: 'info' });

    // Step 3: Calculate recovery (wait 1.5s)
    await new Promise(r => setTimeout(r, 1500));
    const recoverable = Math.round(incident.revenueAtRisk * 0.67);
    addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '💰', title: `₹${recoverable.toLocaleString('en-IN')} recovery opportunity found`, desc: `${Math.round(incident.affectedTransactions * 0.73)} eligible customers identified`, type: 'success' });

    // Step 4: AI proposes (wait 1.5s)
    await new Promise(r => setTimeout(r, 1500));
    addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '🧠', title: 'Recovery strategy ready', desc: 'Send payment links with alternate methods — LOW risk', type: 'success' });

    // Step 5: Ask merchant approval
    await new Promise(r => setTimeout(r, 1000));
    addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '👤', title: 'Merchant approval requested', desc: 'Waiting for CampusKart to approve recovery campaign', type: 'warning' });

    setAutoDemoRunning(false);
    return incident;
  }, [autoDemoRunning, runIncident, addTimelineEntry]);

  // Save campaign to backend
  const saveCampaign = useCallback(async (campaign) => {
    try { await api.saveCampaign(campaign); } catch {}
  }, []);

  // Save AI action to backend
  const saveAction = useCallback(async (action) => {
    try { await api.saveAction(action); } catch {}
  }, []);

  const value = {
    merchant, setMerchant,
    transactions, setTransactions,
    analysis, setAnalysis,
    incidents, activeIncident, setActiveIncident,
    timeline, addTimelineEntry,
    recoveryActive, setRecoveryActive,
    recoveryData, setRecoveryData,
    autopilotMode, setAutopilotMode,
    estimatedRecovery,
    autoDemoRunning, runAutoDemo,
    replayActive, setReplayActive,
    runIncident, saveCampaign, saveAction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
