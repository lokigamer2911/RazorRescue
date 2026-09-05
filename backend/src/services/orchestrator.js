// orchestrator.js — runs the multi-agent pipeline:
//   Intent Router -> [specialists in parallel] -> Chief Analyst
// Each agent is LLM-backed when OPENROUTER_API_KEY exists, otherwise (or on
// failure) its deterministic engine runs instead — identical grounding, so
// output is always traceable to the DATA snapshot.

import { getSnapshot, deriveFacts, renderDataset, snapshotSummary } from './contextStore.js';
import { ROSTER, classifyIntent, planAgents, systemPromptFor, engineSummary, isModelSpendFree, isPaidAllowed } from './agents.js';
import { chatCompletion } from './openrouter.js';

const hasKey = () => Boolean(process.env.OPENROUTER_API_KEY);

export async function orchestrate({ prompt, sessionId = 'default' }) {
  const snapshot = getSnapshot(sessionId);
  const intent = classifyIntent(prompt);
  const chosen = planAgents(intent);
  const facts = deriveFacts(snapshot);
  const hasData = Boolean(snapshot) && facts.total > 0;
  const startedAt = Date.now();

  const pipeline = [];

  if (!hasData) {
    return {
      intent,
      grounded: false,
      mode: 'engine',
      snapshotAt: null,
      answer: 'No merchant data is loaded yet, so I cannot give you real figures.\n\n**To begin:** connect your Razorpay data — my analysis network (Pattern Detector, Risk Assessor, Recovery Planner, Chief Analyst) will then analyse your actual transactions and answer with numbers that come from your data only.',
      pipeline: [{ agent: 'router', name: ROSTER.router.name, model: 'built-in', status: 'done', summary: 'No data snapshot available — analysis deferred.' }],
      elapsedMs: Date.now() - startedAt,
    };
  }

  const dataBlock = renderDataset(snapshot);
  const routeNote = `Intent classified as "${intent}". Specialist agents selected: ${chosen.map((id) => ROSTER[id].name).join(', ')}.`;

  // 1) Specialists — parallel.
  const specialistResults = await Promise.all(chosen.map(async (agentId) => {
    const agent = ROSTER[agentId];
    let mode = 'engine';
    let output = null;
    let usedModel = agent.model;
    if (hasKey()) {
      // ZERO-SPEND POLICY: only :free endpoints run unless ALLOW_PAID_MODELS=true.
      const candidates = [agent.model, ...(agent.fallbacks || [])].filter((m) => isModelSpendFree(m) || isPaidAllowed());
      // Try each candidate in order (resilience to retired/rate-limited ids).
      for (const m of candidates) {
        try {
          const llm = await chatCompletion(
            `${dataBlock}\n\nUser question: ${prompt}\n\nProduce your specialist analysis now.`,
            systemPromptFor(agentId),
            m,
          );
          if (!llm.demo) {
            output = String(llm.content || '').trim();
            mode = 'live';
            usedModel = m;
            break;
          }
        } catch (err) {
          console.error(`[Orchestrator] ${agent.name} LLM ${m} failed → ${agent.fallbacks?.length ? 'next fallback' : 'engine'}:`, err.message);
        }
      }
    }
    if (mode !== 'live') {
      output = engineSummary(agentId, facts);
      if (hasKey()) mode = 'mixed'; // LLM configured but this agent fell back
    }
    pipeline.push({
      agent: agentId,
      name: agent.name,
      model: mode === 'engine' ? 'built-in analyzer' : usedModel,
      mode,
      status: 'done',
      summary: String(output).replace(/\s+/g, ' ').slice(0, 260),
    });
    return { agentId, output };
  }));

  // 2) Chief Analyst — synthesise.
  const blocks = specialistResults.map((r) => `### ${ROSTER[r.agentId].name} (${ROSTER[r.agentId].role})\n${r.output}`).join('\n\n');
  let answer;
  let chiefMode = 'engine';
  let chiefModel = ROSTER.chief.model;
  if (hasKey()) {
    const chiefCandidates = [ROSTER.chief.model, ...(ROSTER.chief.fallbacks || [])].filter((m) => isModelSpendFree(m) || isPaidAllowed());
    for (const m of chiefCandidates) {
      try {
        const chief = await chatCompletion(
          `${dataBlock}\n\nSpecialist outputs:\n${blocks}\n\nUser question: ${prompt}\n\nProduce the final unified answer now.`,
          systemPromptFor('chief'),
          m,
        );
        if (!chief.demo) {
          answer = String(chief.content || '').trim();
          chiefMode = 'live';
          chiefModel = m;
          break;
        }
      } catch (err) {
        console.error(`[Orchestrator] Chief LLM ${m} failed → ${ROSTER.chief.fallbacks?.length ? 'next fallback' : 'engine'}:`, err.message);
      }
    }
  }
  if (chiefMode !== 'live') {
    answer = composeAnswer(prompt, facts, specialistResults);
  }
  pipeline.push({
    agent: 'chief', name: ROSTER.chief.name,
    model: chiefMode === 'engine' ? 'built-in synthesizer' : chiefModel,
    mode: chiefMode,
    status: 'done',
    summary: 'Synthesised all specialist outputs into the final answer.',
  });

  const mode = pipeline.some((p) => p.mode === 'live') ? 'live' : 'engine';
  const summary = snapshotSummary(snapshot);
  const intro = `*(Grounded in the current data snapshot: ${summary.total.toLocaleString('en-IN')} transactions, ${summary.failed.toLocaleString('en-IN')} failed, ${inr(summary.revenueAtRisk)} at risk — snapshot ${new Date(summary.storedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.)*\n\n`;
  return {
    intent,
    grounded: true,
    mode,
    snapshotAt: snapshot.storedAt,
    snapshot: summary,
    routeNote,
    answer: intro + answer,
    pipeline,
    elapsedMs: Date.now() - startedAt,
  };
}

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

function composeAnswer(prompt, facts, specialistResults) {
  const byAgent = (id) => {
    const r = specialistResults.find((x) => x.agentId === id);
    return r ? r.output : null;
  };
  const parts = [];
  const q = String(prompt).toLowerCase();
  if (q.includes('why') || q.includes('cause') || q.includes('drop') || q.includes('happened')) {
    parts.push(`Revenue impact: ${inr(facts.revenueAtRisk)} is at risk from ${facts.failed.toLocaleString('en-IN')} failed transactions.`);
    if (facts.worstBank) parts.push(`Failures concentrate at ${facts.worstBank.name} (${facts.worstBank.rate.toFixed(1)}% failure rate) and peaked ${facts.peakWindow ? `between ${String(facts.peakWindow.start).padStart(2, '0')}:00–${String(facts.peakWindow.end).padStart(2, '0')}:59` : ''}, which accounts for ${facts.peakShare.toFixed(0)}% of all failures.`);
  }
  const pattern = byAgent('pattern');
  const risk = byAgent('risk');
  const recovery = byAgent('recovery');
  if (risk) parts.push(`\n## Risk\n${risk}`);
  if (pattern && pattern !== risk) parts.push(`\n## Patterns\n${pattern}`);
  if (recovery) parts.push(`\n## Recovery Plan\n${recovery}`);
  parts.push(`\n**Suggested next step:** ${facts.eligible > 0 ? `target the ${facts.eligible.toLocaleString('en-IN')} eligible customers with payment-link resends (est. ${inr(facts.recoverLow)}–${inr(facts.recoverHigh)} recoverable) after merchant approval.` : 'connect transaction data to enable recovery planning.'}`);
  parts.push(`**Confidence (data-derived):** ${facts.confidence}%.`);
  return parts.join('\n');
}
