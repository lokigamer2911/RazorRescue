import { Router } from 'express';
import { orchestrate } from '../services/orchestrator.js';
import { storeSnapshot, getSnapshot, snapshotSummary } from '../services/contextStore.js';
import { generateIncident, generateTransactions, analyseTransactions } from '../services/simulation.js';
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

// Generate transaction data — validated count
router.post('/generate-transactions', validate('generateTransactions'), (req, res) => {
  try {
    const { count, options } = req.body;
    const transactions = generateTransactions(count || 10000, options || {});
    res.json({ transactions, count: transactions.length });
  } catch {
    res.status(500).json({ error: 'Failed to generate transactions' });
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

// Generate incident — validated
router.post('/generate-incident', validate('generateIncident'), (req, res) => {
  try {
    const { type, severity, transactionCount } = req.body;
    const incident = generateIncident(type, severity, transactionCount || 10000);
    res.json(incident);
  } catch {
    res.status(500).json({ error: 'Failed to generate incident' });
  }
});

// Available models — informational roster with capabilities
router.get('/models', (_req, res) => {
  res.json([
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', role: 'Chief Analyst & Recovery Planner', capability: 'Final synthesis of all agent outputs and recovery plan generation.' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', role: 'Lead Pattern Detector', capability: 'Deep pattern extraction across banks, hours and methods.' },
    { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', role: 'Data Synthesizer', capability: 'Cross-section synthesis of large transaction slices.' },
    { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', role: 'Fast Risk Assessor', capability: 'Low-latency risk scoring used for risk intents (fallback: GPT-4o Mini).' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', role: 'Pattern Detector (default)', capability: 'Default specialist for failure-pattern intents.' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', role: 'Deep Reasoner', capability: 'Step-by-step root-cause reasoning for investigations.' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', role: 'Speed Analyst', capability: 'Near-instant pattern summaries for live dashboards.' },
    { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', role: 'Risk Assessor', capability: 'Alternate risk ranking with severity classification.' },
    { id: 'qwen/qwen3-235b-a22b', name: 'Qwen 3 235B', role: 'Quantitative Analyst', capability: 'Precise monetary computations and recovery math checks.' },
    { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', role: 'Narrative Generator', capability: 'Merchant-facing plain-language summaries.' },
    { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', role: 'Incident Monitor', capability: 'Continuous incident triage and alerting.' },
    { id: 'mistralai/mistral-small-3.2-24b', name: 'Mistral Small 3.2', role: 'Compliance Checker', capability: 'Validates every proposed action against safety policy.' },
  ]);
});
