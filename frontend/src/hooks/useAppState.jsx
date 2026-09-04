import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { generateTransactions, analyseTransactions, generateIncident, formatCurrency } from '../utils/simulation';
import { deriveInsights } from '../utils/insights';
import { api } from '../utils/api';

const AppContext = createContext(null);

const INITIAL_MERCHANT = {
  name: 'CampusKart',
  potentialRevenue: 1000000,
  totalTransactions: 10000,
};

const INITIAL_TARGET_BANKS = ['BOB', 'UBI', 'INB'];

const nowHM = () => new Date().toTimeString().slice(0, 5);

// Compact snapshot for the backend RAG store (no customer PII).
function buildSnapshot(merchant, analysis, incidents) {
  const a = analysis || {};
  const trim = (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []);
  return {
    merchant: {
      name: merchant?.name || 'Merchant',
      potentialRevenue: merchant?.potentialRevenue || 0,
      totalTransactions: merchant?.totalTransactions || 0,
    },
    analysis: {
      total: a.total || 0,
      failed: a.failed || 0,
      revenueAtRisk: a.revenueAtRisk || 0,
      byBank: trim(a.byBank, 12).map((b) => ({ name: b.name, code: b.code, failed: b.failed, total: b.total, amount: b.amount })),
      byHour: a.byHour || {},
      byMethod: a.byMethod || {},
      topFailed: trim(a.topFailed, 8).map((t) => ({ amount: t.amount, hour: t.hour, bankCode: t.bankCode, failureReason: t.failureReason })),
    },
    incidents: trim(incidents, 10).map((i) => ({
      type: i.type, severity: i.severity,
      affectedBanks: i.affectedBanks, affectedTransactions: i.affectedTransactions,
      revenueAtRisk: i.revenueAtRisk, rootCause: i.rootCause,
      aiConfidence: i.aiConfidence, expectedRecovery: i.expectedRecovery,
    })),
  };
}

export function AppStateProvider({ children }) {
  const [merchant, setMerchant] = useState(INITIAL_MERCHANT);
  // One consistent dataset: analysis is ALWAYS derived from the same transactions.
  const [transactions, setTransactions] = useState(() =>
    generateTransactions(INITIAL_MERCHANT.totalTransactions, { targetBanks: INITIAL_TARGET_BANKS })
  );
  const [analysis, setAnalysis] = useState(() => analyseTransactions(transactions));
  const [incidents, setIncidents] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);
  const [recoveryActive, setRecoveryActive] = useState(false);
  const [recoveryData, setRecoveryData] = useState({
    customersContacted: 0,
    paymentsRecovered: 0,
    amountRecovered: 0,
    recoveryRate: 0,
    progress: 0,
  });
  const [autopilotMode, setAutopilotMode] = useState('recommend');
  const [autoDemoRunning, setAutoDemoRunning] = useState(false);
  const [replayActive, setReplayActive] = useState(false);

  // Derived facts — every number on the dashboard comes from this one source.
  const insights = useMemo(() => deriveInsights(analysis), [analysis]);
  const estimatedRecovery = insights.recoverMid;

  // Seed timeline entries derived from the REAL initial analysis (no fake figures).
  const [timeline, setTimeline] = useState(() => {
    const f = deriveInsights(analysis);
    if (f.total <= 0) return [];
    const t0 = new Date(Date.now() - 4 * 60000);
    const at = (mins) => new Date(t0.getTime() + mins * 60000).toTimeString().slice(0, 5);
    const banks = f.byBank.slice(0, 3).map((b) => b.name);
    return [
      { time: at(0), icon: '🔴', title: 'Failure rate anomaly detected', desc: `Failure rate climbed to ${f.failedRate.toFixed(1)}% across the transaction stream`, type: 'danger' },
      { time: at(1), icon: '🔍', title: 'AI investigation started', desc: 'Pattern Detector + Risk Assessor analysing the snapshot', type: 'info' },
      { time: at(1), icon: '📊', title: `${f.failed.toLocaleString('en-IN')} failed transactions identified`, desc: `Concentrated in ${banks.join(', ')}`, type: 'info' },
      { time: at(2), icon: '💰', title: `${formatCurrency(f.revenueAtRisk)} revenue at risk calculated`, desc: 'Sum of all failed transaction amounts in the snapshot', type: 'danger' },
      { time: at(3), icon: '🧠', title: `Recovery strategy ready — est. ${formatCurrency(f.recoverLow)}–${formatCurrency(f.recoverHigh)}`, desc: 'Payment links with alternate methods, customer approval required', type: 'success' },
      { time: at(4), icon: '👤', title: 'Merchant approval requested', desc: `Waiting for ${merchant?.name || 'merchant'} to approve the recovery campaign`, type: 'warning' },
    ];
  });

  const addTimelineEntry = useCallback((entry) => {
    setTimeline((prev) => [...prev, entry]);
  }, []);

  const runIncident = useCallback((type, severity, volume) => {
    const incident = generateIncident(type, severity, volume);
    setActiveIncident(incident);
    setIncidents((prev) => [...prev, incident]);
    const txns = generateTransactions(volume, {
      targetBanks: incident.affectedBanks?.length ? incident.affectedBanks : INITIAL_TARGET_BANKS,
    });
    setTransactions(txns);
    const nextAnalysis = analyseTransactions(txns);
    setAnalysis(nextAnalysis);
    const f = deriveInsights(nextAnalysis);
    addTimelineEntry({
      time: nowHM(),
      icon: '🔬',
      title: `Simulation: ${type.replace(/-/g, ' ')} incident`,
      desc: `${f.failed.toLocaleString('en-IN')} failed in the new stream — ${formatCurrency(f.revenueAtRisk)} at risk`,
      type: 'danger',
    });
    // Save to backend
    api.saveIncident(incident).catch(() => {});
    return incident;
  }, [addTimelineEntry]);

  // Auto-demo: full flow from detection to recovery — every figure data-derived.
  const runAutoDemo = useCallback(async () => {
    if (autoDemoRunning) return;
    setAutoDemoRunning(true);

    // Step 1: Generate incident (this also updates transactions + analysis).
    const incident = runIncident('upi-failure', 'high', 10000);
    addTimelineEntry({ time: nowHM(), icon: '🤖', title: 'AI auto-detected incident', desc: 'Continuous monitoring triggered the investigation network', type: 'info' });

    await new Promise((r) => setTimeout(r, 2000));
    addTimelineEntry({
      time: nowHM(), icon: '🔍', title: 'Root cause identified',
      desc: incident.affectedBanks.length ? `${incident.affectedBanks.join(', ')} endpoints affected — ${incident.rootCause.slice(0, 90)}` : incident.rootCause.slice(0, 120),
      type: 'info',
    });

    await new Promise((r) => setTimeout(r, 1500));
    const recoverable = Math.round(incident.revenueAtRisk * 0.7);
    const eligible = Math.round(incident.affectedTransactions * 0.8);
    addTimelineEntry({
      time: nowHM(), icon: '💰', title: `${formatCurrency(recoverable)} recovery opportunity estimated`,
      desc: `${eligible.toLocaleString('en-IN')} eligible customers identified (modelled 80% reachable)`, type: 'success',
    });

    await new Promise((r) => setTimeout(r, 1500));
    addTimelineEntry({
      time: nowHM(), icon: '🧠', title: `Recovery strategy ready — est. ${formatCurrency(Math.round(incident.expectedRecovery.low))}–${formatCurrency(Math.round(incident.expectedRecovery.high))}`,
      desc: 'Payment links with alternate methods — LOW risk, merchant approval required', type: 'success',
    });

    await new Promise((r) => setTimeout(r, 1000));
    addTimelineEntry({
      time: nowHM(), icon: '👤', title: 'Merchant approval requested',
      desc: `Waiting for ${merchant?.name || 'merchant'} to approve the recovery campaign`, type: 'warning',
    });

    setAutoDemoRunning(false);
    return incident;
  }, [autoDemoRunning, runIncident, addTimelineEntry, merchant]);

  // Push the current analysis snapshot to the backend RAG store (debounced).
  const firstPush = useRef(true);
  useEffect(() => {
    const id = setTimeout(() => {
      const snapshot = buildSnapshot(merchant, analysis, incidents);
      api.pushContext(snapshot).then((res) => {
        if (!res) return;
        firstPush.current = false;
        console.info('[RAG] snapshot synced:', res.storedAt ? 'ok' : 'n/a');
      });
    }, firstPush.current ? 500 : 800);
    return () => clearTimeout(id);
  }, [analysis, incidents, merchant]);

  const saveCampaign = useCallback(async (campaign) => {
    try { await api.saveCampaign(campaign); } catch {}
  }, []);

  const saveAction = useCallback(async (action) => {
    try { await api.saveAction(action); } catch {}
  }, []);

  const value = {
    merchant, setMerchant,
    transactions, setTransactions,
    analysis, setAnalysis,
    insights, estimatedRecovery,
    incidents, activeIncident, setActiveIncident,
    timeline, addTimelineEntry,
    recoveryActive, setRecoveryActive,
    recoveryData, setRecoveryData,
    autopilotMode, setAutopilotMode,
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
