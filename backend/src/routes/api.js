import { Router } from 'express';
import { orchestrate } from '../services/orchestrator.js';
import { storeSnapshot, getSnapshot, snapshotSummary } from '../services/contextStore.js';
import { analyseTransactions } from '../services/simulation.js';
import { validate, aiLimiter } from '../middleware/security.js';

export const router = Router();

// ─── RAG context: the dashboard pushes its live analysis snapshot here ──────
router.post('/context', validate('context'), (req, res) => {
  try {
    const { sessionId, analysis, merchant, incidents } = req.body;
    if (!analysis || !Number.isFinite(analysis.total) || analysis.total <= 0) {
      return res.status(400).json({ error: 'analysis must include a positive numeric total', details: ['analysis.total'] });
    }
    const stored = storeSnapshot(sessionId, { analysis, merchant, incidents });
    res.json({ ok: true, ...stored });
  } catch (err) {
    console.error('[Context]', err.message);
    res.status(400).json({ error: 'Failed to store context' });
  }
});

// Read back the stored snapshot summary (used by the UI grounding indicator).
router.get('/context', (req, res) => {
  const sessionId = String(req.query.sessionId || 'default').slice(0, 64);
  const summary = snapshotSummary(getSnapshot(sessionId));
  if (!summary) return res.status(404).json({ error: 'No context snapshot stored' });
  res.json({ grounded: true, snapshot: summary });
});

// ─── Multi-agent query: Router → specialists → Chief Analyst ───────────────
router.post('/query', aiLimiter, validate('query'), async (req, res) => {
  try {
    const { prompt, sessionId } = req.body;
    const result = await orchestrate({ prompt, sessionId });
    res.json(result);
  } catch (err) {
    console.error('[AI Query]', err.message);
    res.status(502).json({ error: 'AI service temporarily unavailable' });
  }
});

// ─── Legacy single-model consult — now routed through the orchestrator ─────
router.post('/consult', aiLimiter, validate('consult'), async (req, res) => {
  try {
    const { prompt, sessionId } = req.body;
    const result = await orchestrate({ prompt, sessionId });
    res.json(result);
  } catch (err) {
    console.error('[AI Consult]', err.message);
    res.status(502).json({ error: 'AI service temporarily unavailable' });
  }
});

// Analyse transactions
router.post('/analyse', (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions must be a non-empty array' });
    }
    if (transactions.length > 100000) {
      return res.status(400).json({ error: 'Maximum 100,000 transactions per analysis' });
    }
    const analysis = analyseTransactions(transactions);
    res.json(analysis);
  } catch {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Available models — informational roster. ZERO-SPEND POLICY: all agents run on
// OpenRouter :free endpoints only (never a paid model) unless ALLOW_PAID_MODELS=true.
router.get('/models', (_req, res) => {
  res.json([
    { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B (free)', role: 'Chief Analyst & Recovery Planner', capability: 'Final synthesis of all agent outputs and recovery plan generation.' },
    { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B (free)', role: 'Pattern Detector (default)', capability: 'Default specialist for failure-pattern intents.' },
    { id: 'inclusionai/ling-3.0-flash-fin:free', name: 'Ling 3.0 Flash Finance (free)', role: 'Fast Risk Assessor', capability: 'Finance-tuned risk scoring used for risk intents.' },
    { id: 'minimax/minimax-m2.7:free', name: 'MiniMax M2.7 (free)', role: 'Fallback specialist', capability: 'Backup model if the primary free endpoint is rate-limited.' },
  ].concat(process.env.ALLOW_PAID_MODELS === 'true'
    ? [{ id: '(paid tier)', name: 'Claude / GPT premium models', role: 'Optional premium tier', capability: 'Enabled only when ALLOW_PAID_MODELS=true is set deliberately.' }]
    : []));
});
