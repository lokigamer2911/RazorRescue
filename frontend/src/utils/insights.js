// insights.js — single source of truth for derived numbers in the UI.
// Mirrors backend/src/services/contextStore.js → deriveFacts() so the dashboard,
// offline fallbacks and the server's agents always compute identical values.
import { formatCurrency } from './simulation';

export function deriveInsights(analysis) {
  const empty = {
    total: 0, failed: 0, successRate: 0, failedRate: 0, revenueAtRisk: 0,
    byBank: [], topBanks: [], worstBank: null, concentration: 0,
    peakWindow: null, peakFailed: 0, peakShare: 0,
    topMethods: [], avgTicket: 0, topReasons: [],
    confidence: 0, eligible: 0, recoverLow: 0, recoverHigh: 0, recoverMid: 0,
  };
  if (!analysis || !analysis.total || analysis.total <= 0) return empty;

  const total = analysis.total;
  const failed = analysis.failed || 0;
  const risk = analysis.revenueAtRisk || 0;
  const byBank = analysis.byBank || [];
  const byHour = analysis.byHour || {};
  const byMethod = analysis.byMethod || {};

  const banksWithRate = byBank
    .filter((b) => b && b.total > 0)
    .map((b) => ({ ...b, rate: (b.failed / b.total) * 100 }))
    .sort((x, y) => y.rate - x.rate);
  const worstBank = banksWithRate.length ? banksWithRate[0] : null;

  const top3 = byBank.slice(0, 3);
  const top3Failed = top3.reduce((s, b) => s + (b.failed || 0), 0);
  const concentration = failed > 0 ? (top3Failed / failed) * 100 : 0;

  let peak = null;
  for (let h = 0; h <= 21; h++) {
    let sum = 0;
    for (let k = 0; k < 3; k++) sum += (byHour[h + k]?.failed) || 0;
    if (!peak || sum > peak.sum) peak = { start: h, sum };
  }
  const peakWindow = peak && peak.sum > 0
    ? { start: peak.start, end: peak.start + 2, failed: peak.sum, share: (peak.sum / failed) * 100 }
    : null;

  const topMethods = Object.entries(byMethod)
    .map(([name, d]) => ({ name, count: d.count || 0, amount: d.amount || 0 }))
    .sort((x, y) => y.count - x.count)
    .slice(0, 3);

  const reasons = {};
  (analysis.topFailed || []).forEach((t) => {
    if (t.failureReason) reasons[t.failureReason] = (reasons[t.failureReason] || 0) + 1;
  });
  const topReasons = Object.entries(reasons).sort((x, y) => y[1] - x[1]).slice(0, 3);

  const avgTicket = failed > 0 ? risk / failed : 0;
  const eligible = Math.round(failed * 0.8);
  const recoverLow = Math.round(risk * 0.6);
  const recoverHigh = Math.round(risk * 0.8);
  const recoverMid = Math.round((recoverLow + recoverHigh) / 2);
  const confidence = Math.min(96, Math.max(62, Math.round(55 + concentration * 0.32 + (peakWindow ? peakWindow.share * 0.18 : 0))));

  // topBanks mirrors the backend deriveFacts() naming (banks sorted by failure count).
  const topBanks = [...byBank].sort((a, b) => (b.failed || 0) - (a.failed || 0));
  return {
    total, failed, successRate: analysis.successRate ? Number(analysis.successRate) : ((total - failed) / total) * 100,
    failedRate: (failed / total) * 100,
    revenueAtRisk: risk,
    byBank, topBanks,
    worstBank, concentration,
    peakWindow,
    peakFailed: peakWindow ? peakWindow.failed : 0,
    peakShare: peakWindow ? peakWindow.share : 0,
    topMethods, avgTicket, topReasons,
    confidence, eligible, recoverLow, recoverHigh, recoverMid,
  };
}

export function fmtPct(n) {
  return `${Number(n).toFixed(1)}%`;
}

export function peakLabel(w) {
  if (!w) return '';
  return `${String(w.start).padStart(2, '0')}:00–${String(w.end).padStart(2, '0')}:59`;
}

// Grounded offline answer — every number is computed from the live analysis.
export function buildAnswerFromAnalysis(analysis, q) {
  const f = deriveInsights(analysis);
  if (f.total <= 0) {
    return 'No transaction data is loaded, so I cannot give real figures yet. Run a payment-incident simulation or connect Razorpay data — then ask me again.';
  }
  const lower = String(q).toLowerCase();
  const out = [];
  out.push(`*Analysing the current snapshot: ${f.total.toLocaleString('en-IN')} transactions, ${f.failed.toLocaleString('en-IN')} failed (${fmtPct(f.failedRate)} overall failure rate), ${formatCurrency(f.revenueAtRisk)} at risk.*`);
  out.push('');

  if (/(why|cause|reason|happened|drop|investigat|diagnos)/.test(lower)) {
    if (f.worstBank) out.push(`The failures concentrate at **${f.worstBank.name}** with a **${f.worstBank.rate.toFixed(1)}%** failure rate (${f.worstBank.failed.toLocaleString('en-IN')} of ${f.worstBank.total.toLocaleString('en-IN')} transactions).`);
    if (f.topBanks.length) out.push(`Most failures come from ${f.topBanks.slice(0, 3).map((b) => `**${b.name}** (${b.failed.toLocaleString('en-IN')})`).join(', ')} — together they hold ${f.concentration.toFixed(0)}% of all failures.`);
    if (f.peakWindow) out.push(`Failures peak between **${peakLabel(f.peakWindow)}** (${f.peakWindow.failed.toLocaleString('en-IN')} failures, ${f.peakShare.toFixed(0)}% of the total).`);
    if (f.topMethods.length) out.push(`Top affected methods: ${f.topMethods.map((m) => `**${m.name}** (${m.count.toLocaleString('en-IN')})`).join(', ')}.`);
    out.push('');
    out.push(`**Revenue impact:** ${formatCurrency(f.revenueAtRisk)} is at risk across ${f.failed.toLocaleString('en-IN')} failed transactions.`);
  } else if (/(risk|worst|danger|sever|exposure)/.test(lower)) {
    out.push(`**${formatCurrency(f.revenueAtRisk)}** is at risk across **${f.failed.toLocaleString('en-IN')}** failed transactions.`);
    const flagged = f.byBank.slice(0, 4).map((b) => {
      const rate = b.total > 0 ? (b.failed / b.total) * 100 : 0;
      const lvl = rate > 15 ? 'CRITICAL' : rate > 10 ? 'HIGH' : rate > 6 ? 'ELEVATED' : 'NORMAL';
      return `- ${b.name}: **${lvl}** — ${fmtPct(rate)} failure rate, ${formatCurrency(b.amount)} at risk`;
    });
    if (flagged.length) out.push('**Risk ranking by bank:**', ...flagged);
    out.push('');
    out.push(`Top 3 banks concentrate **${f.concentration.toFixed(0)}%** of failures. Data-derived confidence: **${f.confidence}%**.`);
  } else if (/(recover|plan|strategy|what should|recoup|get back|action)/.test(lower)) {
    out.push(`**${f.eligible.toLocaleString('en-IN')}** of ${f.failed.toLocaleString('en-IN')} failed customers are eligible for recovery links (modelled 80% reachable).`);
    out.push(`**Estimated recovery:** ${formatCurrency(f.recoverLow)} – ${formatCurrency(f.recoverHigh)} (60–80% of ${formatCurrency(f.revenueAtRisk)} at risk).`);
    const targets = f.byBank.filter((b) => b.total > 0 && (b.failed / b.total) > 0.06).slice(0, 3).map((b) => b.name);
    if (targets.length) out.push(`**Priority audience:** failed customers at ${targets.join(', ')} — resend payment links with alternate methods (Net Banking / Card).`);
    out.push('');
    out.push('**Safeguards:** no amount changes · no auto refunds · customer approval required · full audit trail.');
  } else if (/(pattern|trend|spike|peak|hour|method|when)/.test(lower)) {
    if (f.peakWindow) out.push(`**Peak window:** ${peakLabel(f.peakWindow)} — ${f.peakWindow.failed.toLocaleString('en-IN')} failures (${f.peakShare.toFixed(0)}% of total).`);
    if (f.topMethods.length) out.push(`**By method:** ${f.topMethods.map((m) => `${m.name} (${m.count.toLocaleString('en-IN')})`).join(', ')}.`);
    if (f.topReasons.length) out.push(`**Common reasons (from top-failure sample):** ${f.topReasons.map((r) => `${r[0]} (${r[1]})`).join(', ')}.`);
  } else {
    out.push(`Currently **${formatCurrency(f.revenueAtRisk)}** is at risk from **${f.failed.toLocaleString('en-IN')}** failed transactions (${fmtPct(f.failedRate)} failure rate, ${fmtPct(100 - f.failedRate)} success).`);
    if (f.worstBank) out.push(`Worst affected: **${f.worstBank.name}** at ${f.worstBank.rate.toFixed(1)}% failure rate.`);
  }
  out.push('');
  out.push(`**Suggested next step:** ${f.eligible > 0 ? `target the ${f.eligible.toLocaleString('en-IN')} eligible customers with payment-link resends (est. ${formatCurrency(f.recoverLow)}–${formatCurrency(f.recoverHigh)}) after merchant approval` : 'connect transaction data to begin recovery planning'}.`);
  out.push(`Confidence (data-derived): **${f.confidence}%**.`);
  return out.join('\n');
}
