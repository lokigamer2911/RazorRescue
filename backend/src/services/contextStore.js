// contextStore.js — RAG grounding layer.
// The dashboard pushes its current analysis snapshot here; retrieval builds a
// precise, deterministic DATA block that every agent is instructed to cite from.
// Numbers are NEVER invented by an agent: they must come from this snapshot.

const snapshots = new Map(); // sessionId -> normalized snapshot
const MAX_INCIDENTS = 10;
const MAX_SNAPSHOT_BYTES = 120_000;

export function normalizeSnapshot(payload = {}) {
  const analysis = payload.analysis || {};
  const merchant = payload.merchant || {};
  const incidents = Array.isArray(payload.incidents) ? payload.incidents : [];

  const byBank = Array.isArray(analysis.byBank)
    ? analysis.byBank
        .filter((b) => b && typeof b.code === 'string' && Number.isFinite(b.failed))
        .map((b) => ({
          name: String(b.name || b.code).slice(0, 40),
          code: String(b.code).slice(0, 8),
          failed: Math.max(0, Math.round(Number(b.failed) || 0)),
          total: Math.max(0, Math.round(Number(b.total) || 0)),
          amount: Math.max(0, Math.round(Number(b.amount) || 0)),
        }))
        .sort((a, b) => b.failed - a.failed)
        .slice(0, 12)
    : [];

  const byHour = {};
  if (analysis.byHour && typeof analysis.byHour === 'object') {
    for (const [h, d] of Object.entries(analysis.byHour)) {
      const hh = Number(h);
      if (Number.isFinite(hh) && hh >= 0 && hh <= 23 && d && Number.isFinite(d.total)) {
        byHour[hh] = { total: Math.max(0, Math.round(d.total)), failed: Math.max(0, Math.round(d.failed || 0)) };
      }
    }
  }

  const byMethod = {};
  if (analysis.byMethod && typeof analysis.byMethod === 'object') {
    for (const [m, d] of Object.entries(analysis.byMethod)) {
      if (d && Number.isFinite(d.count)) {
        byMethod[String(m).slice(0, 24)] = { count: Math.max(0, Math.round(d.count)), amount: Math.max(0, Math.round(d.amount || 0)) };
      }
    }
  }

  // Strip customer PII; keep only a tiny sample of top failures for reason patterns.
  const topFailed = Array.isArray(analysis.topFailed)
    ? analysis.topFailed.slice(0, 8).map((t) => ({
        amount: Math.round(Number(t.amount) || 0),
        hour: Number(t.hour),
        bankCode: String(t.bankCode || '').slice(0, 8),
        failureReason: String(t.failureReason || '').slice(0, 40),
      }))
    : [];

  const total = Math.max(0, Math.round(Number(analysis.total) || 0));
  const failed = Math.max(0, Math.round(Number(analysis.failed) || 0));
  const revenueAtRisk = Math.max(0, Math.round(Number(analysis.revenueAtRisk) || 0));

  return {
    storedAt: Date.now(),
    merchant: {
      name: String(merchant.name || 'Merchant').slice(0, 60),
      potentialRevenue: Math.max(0, Math.round(Number(merchant.potentialRevenue) || 0)),
      totalTransactions: Math.max(0, Math.round(Number(merchant.totalTransactions) || 0)),
    },
    analysis: {
      total, failed, revenueAtRisk,
      successRate: total > 0 ? ((total - failed) / total) * 100 : 0,
      byBank, byHour, byMethod, topFailed,
    },
    incidents: incidents
      .slice(-MAX_INCIDENTS)
      .map((i) => ({
        type: String(i.type || '').slice(0, 30),
        severity: String(i.severity || '').slice(0, 12),
        affectedBanks: (Array.isArray(i.affectedBanks) ? i.affectedBanks : []).map((b) => String(b).slice(0, 8)).slice(0, 6),
        affectedTransactions: Math.max(0, Math.round(Number(i.affectedTransactions) || 0)),
        revenueAtRisk: Math.max(0, Math.round(Number(i.revenueAtRisk) || 0)),
        rootCause: String(i.rootCause || '').slice(0, 200),
        aiConfidence: Math.max(0, Math.min(100, Math.round(Number(i.aiConfidence) || 0))),
        expectedRecovery: i.expectedRecovery ? {
          low: Math.max(0, Math.round(Number(i.expectedRecovery.low) || 0)),
          high: Math.max(0, Math.round(Number(i.expectedRecovery.high) || 0)),
        } : null,
      }))
      .reverse(),
  };
}

export function storeSnapshot(sessionId = 'default', payload = {}) {
  const snapshot = normalizeSnapshot(payload);
  const serialized = JSON.stringify(snapshot);
  if (serialized.length > MAX_SNAPSHOT_BYTES) {
    // Drop the heaviest slice (top failures) rather than rejecting the snapshot.
    snapshot.analysis.topFailed = [];
  }
  snapshots.set(String(sessionId).slice(0, 64), snapshot);
  const a = snapshot.analysis;
  return {
    storedAt: snapshot.storedAt,
    total: a.total, failed: a.failed,
    revenueAtRisk: a.revenueAtRisk,
    successRate: Number(a.successRate.toFixed(1)),
    snapshotBytes: JSON.stringify(snapshot).length,
  };
}

export function getSnapshot(sessionId = 'default') {
  return snapshots.get(String(sessionId).slice(0, 64)) || null;
}

// ─── Derived facts (single source of truth for every agent) ───────────────
// Mirrors frontend/src/utils/insights.js so both sides compute identical values.

export function deriveFacts(snapshot) {
  const zero = () => ({
    total: 0, failed: 0, successRate: 0, revenueAtRisk: 0,
    topBanks: [], worstBank: null, concentration: 0,
    peakWindow: null, peakFailed: 0, peakShare: 0,
    topMethods: [], avgTicket: 0, topReasons: [],
    confidence: 0, eligible: 0, recoverLow: 0, recoverHigh: 0, recoverMid: 0,
  });
  if (!snapshot || !snapshot.analysis) return zero();
  const a = snapshot.analysis;
  if (a.total <= 0) return zero();

  const failed = a.failed;
  const risk = a.revenueAtRisk;

  // Worst banks by failure RATE (requires per-bank totals).
  const banksWithRate = a.byBank
    .filter((b) => b.total > 0)
    .map((b) => ({ ...b, rate: (b.failed / b.total) * 100 }))
    .sort((x, y) => y.rate - x.rate);
  const worstBank = banksWithRate.length ? banksWithRate[0] : null;

  const top3 = a.byBank.slice(0, 3);
  const top3Failed = top3.reduce((s, b) => s + b.failed, 0);
  const concentration = failed > 0 ? (top3Failed / failed) * 100 : 0;

  // Best contiguous 3-hour window by failed count.
  let peak = null;
  for (let h = 0; h <= 21; h++) {
    let sum = 0;
    for (let k = 0; k < 3; k++) sum += (a.byHour[h + k]?.failed || 0);
    if (!peak || sum > peak.sum) peak = { start: h, sum };
  }
  const peakWindow = peak && peak.sum > 0
    ? { start: peak.start, end: peak.start + 2, failed: peak.sum, share: (peak.sum / failed) * 100 }
    : null;

  const topMethods = Object.entries(a.byMethod)
    .map(([name, d]) => ({ name, count: d.count, amount: d.amount }))
    .sort((x, y) => y.count - x.count)
    .slice(0, 3);

  const reasons = {};
  a.topFailed.forEach((t) => { if (t.failureReason) reasons[t.failureReason] = (reasons[t.failureReason] || 0) + 1; });
  const topReasons = Object.entries(reasons).sort((x, y) => y[1] - x[1]).slice(0, 3);

  const avgTicket = failed > 0 ? risk / failed : 0;
  const eligible = Math.round(failed * 0.8); // modelled: 80% reachable via email/SMS
  const recoverLow = Math.round(risk * 0.6);
  const recoverHigh = Math.round(risk * 0.8);
  const recoverMid = Math.round((recoverLow + recoverHigh) / 2);

  // Deterministic confidence proxy: failure concentration + peak clarity.
  const confidence = Math.min(96, Math.max(62, Math.round(55 + concentration * 0.32 + (peakWindow ? peakWindow.share * 0.18 : 0))));

  return {
    total: a.total, failed, successRate: a.successRate, revenueAtRisk: risk,
    topBanks: a.byBank, worstBank, concentration,
    peakWindow, peakFailed: peakWindow ? peakWindow.failed : 0, peakShare: peakWindow ? peakWindow.share : 0,
    topMethods, avgTicket, topReasons,
    confidence, eligible, recoverLow, recoverHigh, recoverMid,
  };
}

// ─── Deterministic DATA block for LLM grounding ────────────────────────────
export function renderDataset(snapshot, opts = {}) {
  if (!snapshot) return '(No merchant data snapshot available yet.)';
  const a = snapshot.analysis;
  const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
  const pct = (n) => (Number(n) * 100).toFixed(1) + '%';
  const rows = [];
  rows.push('=== DATA SNAPSHOT (ground truth — cite ONLY these numbers) ===');
  rows.push(`Merchant: ${snapshot.merchant.name}`);
  rows.push(`Snapshot time: ${new Date(snapshot.storedAt).toISOString()}`);
  rows.push(`Transactions analysed: ${a.total.toLocaleString('en-IN')}`);
  rows.push(`Failed: ${a.failed.toLocaleString('en-IN')} (${pct(a.total > 0 ? a.failed / a.total : 0)})`);
  rows.push(`Success rate: ${pct(a.total > 0 ? a.successRate / 100 : 0)}`);
  rows.push(`Revenue at risk: ${inr(a.revenueAtRisk)}`);
  if (a.byBank.length) {
    rows.push('Banks (code | failures | total | failure-rate | amount at risk):');
    a.byBank.forEach((b) => rows.push(`- ${b.code} | ${b.failed} | ${b.total} | ${pct(b.total > 0 ? b.failed / b.total : 0)} | ${inr(b.amount)}`));
  }
  if (Object.keys(a.byHour).length && opts.hourly !== false) {
    const peakHours = Object.entries(a.byHour).filter(([, d]) => d.failed > 0).sort((x, y) => y[1].failed - x[1].failed).slice(0, 6);
    if (peakHours.length) {
      rows.push('Top failure hours (hour | failed):');
      peakHours.forEach(([h, d]) => rows.push(`- ${String(h).padStart(2, '0')}:00-${String(h).padStart(2, '0')}:59 | ${d.failed}`));
    }
  }
  if (Object.keys(a.byMethod).length) {
    rows.push('By method (method | failures | amount at risk):');
    Object.entries(a.byMethod).sort((x, y) => y[1].count - x[1].count).slice(0, 4)
      .forEach(([m, d]) => rows.push(`- ${m} | ${d.count} | ${inr(d.amount)}`));
  }
  if (opts.incidents !== false && snapshot.incidents.length) {
    rows.push('Recent incidents (type | severity | affected | risk | confidence):');
    snapshot.incidents.forEach((i) => rows.push(`- ${i.type} | ${i.severity} | ${i.affectedTransactions} | ${inr(i.revenueAtRisk)} | ${i.aiConfidence}%`));
  }
  rows.push('=== END DATA SNAPSHOT ===');
  return rows.join('\n');
}

export function snapshotSummary(snapshot) {
  if (!snapshot) return null;
  const a = snapshot.analysis;
  return {
    storedAt: snapshot.storedAt,
    merchant: snapshot.merchant.name,
    total: a.total, failed: a.failed,
    revenueAtRisk: a.revenueAtRisk,
    successRate: Number((a.successRate || 0).toFixed(1)),
    incidents: snapshot.incidents.length,
  };
}
