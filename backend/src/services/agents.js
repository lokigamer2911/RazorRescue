// agents.js — the agent roster with explicit instructions + deterministic engines.
// Every agent grounds itself in the DATA snapshot from contextStore. When the
// OpenRouter key is available, agents are backed by real LLMs; otherwise (or on
// any failure) the same agent runs its deterministic engine, which computes
// answers from the exact same numbers — so output is always data-accurate.

import { deriveFacts, severityOf } from './contextStore.js';

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
const pct1 = (n) => Number(n).toFixed(1) + '%';

const GROUNDING_RULES = `You are part of a multi-agent analysis network for RazorRescue (a revenue-recovery agent for Razorpay merchants).

HARD RULES (never violate):
1. NEVER invent, estimate, or round numbers that are not in the DATA SNAPSHOT. If a figure is not present, say it is not available in the current data.
2. Every figure you state must be traceable to the DATA SNAPSHOT or the DERIVED FACTS section provided.
3. Be concise and structured. Use markdown headings and bullet points.
4. Never fabricate bank names, merchant names, timelines, or incident causes. Only report what DATA shows.
5. If DATA shows zero transactions or no snapshot, answer honestly that no merchant data is loaded, and suggest connecting data — never produce fake metrics.
6. Percentages, confidence levels, severity labels (CRITICAL/HIGH/ELEVATED/NORMAL), ranges and totals: cite ONLY values that appear VERBATIM in DATA or DERIVED FACTS. Do NOT attach a percentage or confidence to individual banks, methods, or actions; do NOT sum, multiply, average, or round figures into new numbers. If a figure is not printed in the supplied sections, omit it — never compute or estimate it.`;

// ─── ROSTER ─────────────────────────────────────────────────────────────────

export const ROSTER = {
  router: {
    id: 'router', name: 'Intent Router', model: null, role: 'Classifies the user question and selects the specialist agents to run.',
  },
  pattern: {
    id: 'pattern', name: 'Pattern Detector', model: 'openai/gpt-4o-mini', fallbacks: ['anthropic/claude-haiku-4.5'], role: 'Detects failure patterns: worst banks, peak hours, methods, dominant reasons.',
  },
  risk: {
    id: 'risk', name: 'Risk Assessor', model: 'anthropic/claude-haiku-4.5', fallbacks: ['openai/gpt-4o-mini'], role: 'Quantifies revenue at risk, concentration, and severity per bank.',
  },
  recovery: {
    id: 'recovery', name: 'Recovery Planner', model: 'anthropic/claude-sonnet-4', fallbacks: ['openai/gpt-4o-mini'], role: 'Builds a safe recovery plan from exact at-risk amounts and eligible customers.',
  },
  chief: {
    id: 'chief', name: 'Chief Analyst', model: 'anthropic/claude-sonnet-4', fallbacks: ['openai/gpt-4o-mini'], role: 'Synthesises every specialist output into one clear, final answer.',
  },
};

// Models an agent tries in order. Kept current with OpenRouter's public catalog
// so a retired model id degrades to a live model — not silently to demo mode.

// ─── INTENT ROUTER (deterministic — zero cost, instant) ────────────────────

export function classifyIntent(prompt) {
  const q = String(prompt).toLowerCase();
  const has = (words) => words.some((w) => q.includes(w));
  if (has(['why', 'root cause', 'cause', 'reason', 'happened', 'explain the drop', 'investigate', 'investigation', 'diagnos'])) return 'investigate';
  if (has(['recover', 'recovery', 'recoup', 'get back', 'strategy', 'action plan', 'what should', 'campaign', 'retry', 'plan'])) return 'recovery';
  if (has(['risk', 'worst', 'danger', 'severity', 'exposure', 'biggest threat', 'top bank'])) return 'risk';
  if (has(['pattern', 'trend', 'spike', 'peak', 'hour', 'bank pattern', 'method', 'when', 'time of day', 'correlat'])) return 'patterns';
  if (has(['summary', 'overview', 'status', 'brief', 'what is happening', 'headline', 'tell me everything'])) return 'summary';
  return 'investigate';
}

// Which specialists run for each intent (router -> specialists -> chief).
export function planAgents(intent) {
  switch (intent) {
    case 'recovery': return ['pattern', 'risk', 'recovery'];
    case 'risk': return ['pattern', 'risk'];
    case 'patterns': return ['pattern'];
    case 'summary': return ['risk'];
    default: return ['pattern', 'risk'];
  }
}

// ─── AGENT SYSTEM PROMPTS (explicit instructions per role) ─────────────────

export function systemPromptFor(agentId) {
  const base = `${GROUNDING_RULES}\n\nYour role: ${ROSTER[agentId]?.role}`;
  switch (agentId) {
    case 'pattern':
      return `${base}

Your task (Pattern Detector):
- Identify the worst banks by failure RATE (failed / total per bank) and by failure COUNT.
- Identify the peak time window(s) and what share of failures they contain.
- Identify which payment methods concentrate failures.
- Identify the most common failure reasons seen in the sample.
- Output: "## Pattern Analysis" with tight bullets, each citing exact numbers from DATA.`;
    case 'risk':
      return `${base}

Your task (Risk Assessor):
- State total revenue at risk and the failure count from DATA.
- Rank banks by amount at risk (₹) and by failure rate; flag each as CRITICAL / HIGH / ELEVATED / NORMAL using DATA rates.
- Report concentration: what % of all failures sit in the top 3 banks.- Report the overall diagnosis confidence exactly as printed in DERIVED FACTS — never attach confidence percentages to individual banks or methods.
      - Output: "## Risk Assessment" with a short table or bullets, exact numbers only, each traceable to DATA or DERIVED FACTS.`;
    case 'recovery':
      return `${base}

Your task (Recovery Planner):
- Determine eligible customers and the recoverable amount range strictly from DATA (use failed-transaction count and revenue at risk).
- Propose recovery actions: payment-link resends with alternate methods, targeted at the failing banks/methods DATA shows.
- Every action must be LOW risk: no amount changes, no auto refunds, customer approval required.
- Output: "## Recovery Plan" — numbered steps with exact numbers, plus a one-line risk statement.`;
    case 'chief':
      return `${base}

You are the final synthesizer. You receive the user's question plus outputs from specialist agents. Produce ONE polished answer:
- Start with a one-line direct answer.
- Follow with concise sections that merge the specialists, citing exact numbers.- End with a "Suggested next step" line and the diagnosis confidence from DERIVED FACTS if present.
      - Never add figures, percentages, confidence levels, or totals that do not appear VERBATIM in the specialist outputs, DATA, or DERIVED FACTS.`;
    default:
      return base;
  }
}

// ─── DETERMINISTIC ENGINES (identical math to frontend insights.js) ────────
// These guarantee correctness when no LLM key is present or an LLM call fails.

function engineFor(agentId, facts) {
  const lines = [];
  switch (agentId) {
    case 'pattern': {
      lines.push(`**Overall:** ${facts.failed.toLocaleString('en-IN')} of ${facts.total.toLocaleString('en-IN')} transactions failed (${pct1(facts.total ? (facts.failed / facts.total) * 100 : 0)}% failure rate) in the current snapshot.`);
      if (facts.worstBank) lines.push(`**Worst bank by rate:** ${facts.worstBank.name} at ${pct1(facts.worstBank.rate)} failure rate (${facts.worstBank.failed} failures of ${facts.worstBank.total} txns).`);
      if (facts.topBanks.length) lines.push(`**Most failures:** ${facts.topBanks.slice(0, 3).map((b) => `${b.name} (${b.failed})`).join(', ')}.`);
      if (facts.peakWindow) lines.push(`**Peak window:** ${String(facts.peakWindow.start).padStart(2, '0')}:00–${String(facts.peakWindow.end).padStart(2, '0')}:59 with ${facts.peakWindow.failed} failures (${pct1(facts.peakWindow.share)} of all failures).`);
      if (facts.topMethods.length) lines.push(`**Top methods:** ${facts.topMethods.map((m) => `${m.name} (${m.count})`).join(', ')}.`);
      if (facts.topReasons.length) lines.push(`**Common reasons (sample):** ${facts.topReasons.map((r) => `${r[0]} (${r[1]})`).join(', ')}.`);
      break;
    }
    case 'risk': {
      lines.push(`**Revenue at risk:** ${inr(facts.revenueAtRisk)} across ${facts.failed.toLocaleString('en-IN')} failed transactions.`);
      const flagged = facts.topBanks.slice(0, 4).map((b) => {
        const rate = b.total > 0 ? (b.failed / b.total) * 100 : 0;
        return `${b.name}: ${severityOf(rate)} (${pct1(rate)}, ${inr(b.amount)} at risk)`;
      });
      lines.push(`**Bank risk ranking:** ${flagged.join('; ') || 'none in snapshot'}.`);
      lines.push(`**Concentration:** top 3 banks hold ${pct1(facts.concentration)} of all failures.`);
      lines.push(`**Diagnosis confidence (data-derived):** ${facts.confidence}%.`);
      break;
    }
    case 'recovery': {
      lines.push(`**Eligible customers (modelled 80% reachable):** ${facts.eligible.toLocaleString('en-IN')} of ${facts.failed.toLocaleString('en-IN')} failed customers.`);
      lines.push(`**Estimated recovery range:** ${inr(facts.recoverLow)} – ${inr(facts.recoverHigh)} (60–80% of ${inr(facts.revenueAtRisk)} at risk).`);
      const targets = facts.topBanks.slice(0, 3).filter((b) => b.total > 0 && (b.failed / b.total) > 0.06).map((b) => b.name);
      if (targets.length) lines.push(`**Priority audience:** failed customers at ${targets.join(', ')} — resend payment links with alternate methods (Net Banking / Card).`);
      lines.push(`**Safeguards:** no amount changes · no auto refunds · customer approval required · full audit trail.`);
      break;
    }
    case 'chief': {
      // Compose-only; handled by orchestrator merge. This branch is a fallback if chief LLM fails.
      lines.push(`Merged findings from specialists for the current snapshot.`);
      break;
    }
  }
  return lines.join('\n');
}

// Facts are derived once in the orchestrator and shared by all engines.
export function engineSummary(agentId, facts) {
  if (!facts || facts.total <= 0) {
    return 'No merchant data loaded — connect transaction data before analysis.';
  }
  return engineFor(agentId, facts);
}

export { deriveFacts };
