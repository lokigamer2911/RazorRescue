import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router as apiRouter } from './routes/api.js';
import { initDB, saveIncident, saveAIAction, saveRecoveryCampaign, getMerchantStats, getAuditLog } from './services/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), version: '1.0.0' });
});

// AI Agent routes
app.use('/api/agent', apiRouter);

// Database routes
app.get('/api/stats', async (_req, res) => {
  try {
    const stats = await getMerchantStats();
    res.json(stats);
  } catch (err) {
    res.json({ total_at_risk: 0, total_recovered: 0, total_incidents: 0, total_campaigns: 0 });
  }
});

app.get('/api/audit', async (_req, res) => {
  try {
    const log = await getAuditLog();
    res.json(log);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/incidents', async (req, res) => {
  try {
    const id = await saveIncident(req.body);
    await saveAIAction({ incidentId: id, type: 'detection', title: `Incident detected: ${req.body.type}`, description: req.body.rootCause, riskLevel: req.body.severity, status: 'completed' });
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const id = await saveRecoveryCampaign(req.body);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/actions', async (req, res) => {
  try {
    const id = await saveAIAction(req.body);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[RazorRescue]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Initialize
async function start() {
  try {
    if (process.env.DATABASE_URL) {
      await initDB();
    } else {
      console.log('⚠ No DATABASE_URL — running without database');
    }
  } catch (err) {
    console.log('⚠ Database init failed:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`\n⚡ RazorRescue Backend running on http://localhost:${PORT}`);
    console.log(`   OpenRouter API: ${process.env.OPENROUTER_API_KEY ? '✓ Configured' : '✗ No key set'}`);
    console.log(`   Database: ${process.env.DATABASE_URL ? '✓ Connected' : '✗ Not configured'}`);
  });
}

start();
