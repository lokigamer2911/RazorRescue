import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { generateTransactions, analyseTransactions, generateIncident } from '../utils/simulation';

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
    { time: '19:43', icon: '🔍', title: 'AI investigation started', desc: 'Multi-model spiderweb activated — 8 AI models analyzing', type: 'info' },
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
    return incident;
  }, [addTimelineEntry]);

  const value = {
    merchant, setMerchant,
    transactions, setTransactions,
    analysis, setAnalysis,
    incidents, activeIncident, setActiveIncident,
    timeline, addTimelineEntry,
    recoveryActive, setRecoveryActive,
    recoveryData, setRecoveryData,
    autopilotMode, setAutopilotMode,
    runIncident,

  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
