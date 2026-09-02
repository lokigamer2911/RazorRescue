import { Router } from 'express';
import { chatCompletion } from '../services/openrouter.js';
import { generateIncident, generateTransactions, analyseTransactions } from '../services/simulation.js';
import { validate, aiLimiter } from '../middleware/security.js';

export const router = Router();

// AI spiderweb consultation — strict rate limit + validation
router.post('/consult', aiLimiter, validate('consult'), async (req, res) => {
  try {
    const { prompt, model } = req.body;
    // System prompt is NEVER taken from user input — prevents injection
    const result = await chatCompletion(prompt, null, model);
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

// Get available models (read-only, no validation needed)
router.get('/models', (_req, res) => {
  res.json([
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', role: 'Chief Analyst' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', role: 'Pattern Detector' },
    { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', role: 'Data Synthesizer' },
    { id: 'anthropic/claude-haiku-3.5', name: 'Claude Haiku 3.5', role: 'Fast Responder' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', role: 'Customer Profiler' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', role: 'Deep Reasoner' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', role: 'Speed Analyst' },
    { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', role: 'Risk Assessor' },
    { id: 'qwen/qwen3-235b-a22b', name: 'Qwen 3 235B', role: 'Quantitative Analyst' },
    { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', role: 'Narrative Generator' },
    { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', role: 'Incident Monitor' },
    { id: 'mistralai/mistral-small-3.2-24b', name: 'Mistral Small 3.2', role: 'Compliance Checker' },
  ]);
});
