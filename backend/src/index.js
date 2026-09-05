import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router as apiRouter } from './routes/api.js';
import { router as gatewayRouter } from './routes/gateway.js';
import { initDB, saveIncident, saveAIAction, saveRecoveryCampaign, getMerchantStats, getAuditLog } from './services/database.js';
import { requireAuth } from './middleware/firebaseAuth.js';
import { apiLimiter, validate } from './middleware/security.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS — whitelist allowed origins
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000,https://razorrescue.vercel.app')
  .split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing with size limit (must fit full transaction uploads for /analyse — up to 100k txns)
app.use(express.json({ limit: '25mb' }));

// Global rate limiter
app.use('/api', apiLimiter);

// Health check (no rate limit)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), version: '1.0.0' });
});

// AI Agent routes
app.use('/api/agent', apiRouter);

// Payment gateway routes (Firebase-auth protected)
app.use('/api/gateway', gatewayRouter);

// Database routes — all scoped to the verified Firebase uid.
app.use(['/api/stats', '/api/audit', '/api/incidents', '/api/campaigns', '/api/actions'], requireAuth);

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getMerchantStats(req.user.uid);
    res.json(stats);
  } catch {
    res.json({ total_at_risk: 0, total_recovered: 0, total_incidents: 0, total_campaigns: 0 });
  }
});

app.get('/api/audit', async (req, res) => {
  try {
    const log = await getAuditLog(req.user.uid);
    res.json(log);
  } catch {
    res.json([]);
  }
});

app.post('/api/incidents', validate('saveIncident'), async (req, res) => {
  try {
    const id = await saveIncident(req.body, req.user.uid);
    await saveAIAction({ incidentId: id, type: 'detection', title: `Incident detected: ${req.body.type}`, description: req.body.rootCause, riskLevel: req.body.severity, status: 'completed' }, req.user.uid);
    res.json({ id });
  } catch {
    res.status(500).json({ error: 'Failed to save incident' });
  }
});

app.post('/api/campaigns', validate('saveCampaign'), async (req, res) => {
  try {
    const id = await saveRecoveryCampaign(req.body, req.user.uid);
    res.json({ id });
  } catch {
    res.status(500).json({ error: 'Failed to save campaign' });
  }
});

app.post('/api/actions', validate('saveAction'), async (req, res) => {
  try {
    const id = await saveAIAction(req.body, req.user.uid);
    res.json({ id });
  } catch {
    res.status(500).json({ error: 'Failed to save action' });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler — never leak internals
app.use((err, _req, res, _next) => {
  console.error('[RazorRescue]', err.message);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.status(500).json({ error: 'Internal server error' });
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
