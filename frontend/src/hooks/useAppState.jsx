import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { analyseTransactions, formatCurrency } from '../utils/simulation';
import { deriveInsights } from '../utils/insights';
import { api } from '../utils/api';

const AppContext = createContext(null);

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

export function AppStateProvider({ children, userId }) {
  const [merchant, setMerchant] = useState({ name: 'My business', potentialRevenue: 0, totalTransactions: 0 });
  // Real data only — populated by the payment-gateway sync. Never simulated.
  const [transactions, setTransactions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
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
  const [dataLoading, setDataLoading] = useState(true);
  const [syncError, setSyncError] = useState('');

  // Derived facts — every number on the dashboard comes from this one source.
  const insights = useMemo(() => deriveInsights(analysis), [analysis]);
  const estimatedRecovery = insights.recoverMid;

  // Seed timeline entries derived from the REAL analysis (no fake figures).
  const [timeline, setTimeline] = useState([]);
  useEffect(() => {
    const f = deriveInsights(analysis);
    if (!analysis || f.total <= 0 || timeline.length > 0) return;
    const t0 = new Date(Date.now() - 4 * 60000);
    const at = (mins) => new Date(t0.getTime() + mins * 60000).toTimeString().slice(0, 5);
    const banks = f.byBank.slice(0, 3).map((b) => b.name);
    setTimeline([
      { time: at(0), icon: '🔴', title: 'Failure rate anomaly detected', desc: `Failure rate at ${f.failedRate.toFixed(1)}% across the live payment stream`, type: 'danger' },
      { time: at(1), icon: '🔍', title: 'AI investigation started', desc: 'Pattern Detector + Risk Assessor analysing the live snapshot', type: 'info' },
      { time: at(1), icon: '📊', title: `${f.failed.toLocaleString('en-IN')} failed transactions identified`, desc: `Concentrated in ${banks.join(', ')}`, type: 'info' },
      { time: at(2), icon: '💰', title: `${formatCurrency(f.revenueAtRisk)} revenue at risk calculated`, desc: 'Sum of all failed transaction amounts in the snapshot', type: 'danger' },
      { time: at(3), icon: '🧠', title: `Recovery strategy ready — est. ${formatCurrency(f.recoverLow)}–${formatCurrency(f.recoverHigh)}`, desc: 'Payment links with alternate methods, customer approval required', type: 'success' },
      { time: at(4), icon: '👤', title: 'Merchant approval requested', desc: `Waiting for ${merchant?.name || 'merchant'} to approve the recovery campaign`, type: 'warning' },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis]);

  const addTimelineEntry = useCallback((entry) => {
    setTimeline((prev) => [...prev, entry]);
  }, []);

  // Sync real payments from the connected gateway and re-derive everything.
  const refreshData = useCallback(async () => {
    setDataLoading(true);
    setSyncError('');
    try {
      const res = await api.gatewaySync();
      if (!res) {
        setSyncError('Could not reach the server. Check your connection.');
        return;
      }
      if (!res.ok || !res.analysis) {
        setSyncError(res?.error || 'Sync failed.');
        return;
      }
      const txns = Array.isArray(res.transactions) ? res.transactions : [];
      setTransactions(txns);
      setAnalysis(res.analysis);
      if (res.merchantName) setMerchant((m) => ({ ...m, name: res.merchantName, totalTransactions: res.analysis.total || 0 }));
      setDataLoading(false);
    } catch (err) {
      setSyncError(err.message || 'Sync failed.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Load real data on mount (per-user gateway).
  useEffect(() => {
    if (!userId) {
      setDataLoading(false);
      return;
    }
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Push the current analysis snapshot to the backend RAG store (debounced).
  const firstPush = useRef(true);
  useEffect(() => {
    if (!analysis || !analysis.total) return;
    const id = setTimeout(() => {
      const snapshot = buildSnapshot(merchant, analysis, incidents);
      api.pushContext(snapshot, userId).then((res) => {
        if (!res) return;
        firstPush.current = false;
        console.info('[RAG] snapshot synced:', res.storedAt ? 'ok' : 'n/a');
      });
    }, firstPush.current ? 500 : 800);
    return () => clearTimeout(id);
  }, [analysis, incidents, merchant, userId]);

  const saveCampaign = useCallback(async (campaign) => {
    try { await api.saveCampaign(campaign); } catch {}
  }, []);

  const saveAction = useCallback(async (action) => {
    try { await api.saveAction(action); } catch {}
  }, []);

  const value = {
    userId,
    merchant, setMerchant,
    transactions, setTransactions,
    analysis, setAnalysis,
    insights, estimatedRecovery,
    incidents, activeIncident, setActiveIncident,
    timeline, addTimelineEntry,
    recoveryActive, setRecoveryActive,
    recoveryData, setRecoveryData,
    autopilotMode, setAutopilotMode,
    dataLoading, syncError, refreshData,
    saveCampaign, saveAction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}