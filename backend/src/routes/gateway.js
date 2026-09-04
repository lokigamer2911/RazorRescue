import { Router } from 'express';
import { requireAuth } from '../middleware/firebaseAuth.js';
import { validate } from '../middleware/security.js';
import { encryptSecret, decryptSecret, testConnection, syncGatewayData, maskKey } from '../services/gateway.js';
import { saveGatewayConnection, getGatewayConnection, deleteGatewayConnection, touchGatewaySync } from '../services/database.js';
import { storeSnapshot, snapshotSummary, getSnapshot } from '../services/contextStore.js';

export const router = Router();

// All gateway routes require a verified Firebase session.
router.use(requireAuth);

// ─── Connect: validate live, then store encrypted credentials ──────────────
router.post('/connect', validate('gatewayConnect'), async (req, res) => {
  let test;
  try {
    const { provider, keyId, keySecret } = req.body;
    test = await testConnection(provider, keyId, keySecret);
  } catch (err) {
    console.error('[Gateway connect]', err.message);
    if (err.code === 'invalid_credentials') {
      return res.status(401).json({ error: 'These credentials were rejected by the provider. Double-check the key id and secret.' });
    }
    if (err.code === 'unsupported_provider') {
      return res.status(400).json({ error: 'Unsupported provider.' });
    }
    return res.status(502).json({ error: 'Could not reach the payment provider. Try again in a moment.' });
  }
  try {
    const { provider, keyId, keySecret } = req.body;
    await saveGatewayConnection(req.user.uid, {
      provider,
      keyIdEnc: encryptSecret(keyId),
      keySecretEnc: encryptSecret(keySecret),
      merchantName: test.merchantName,
    });
    res.json({ connected: true, provider, merchantName: test.merchantName, keyIdMasked: maskKey(keyId) });
  } catch (err) {
    console.error('[Gateway store]', err.message);
    res.status(500).json({ error: 'Credentials validated, but saving them failed. Try again.' });
  }
});

// ─── Status: is this user connected? (no secrets ever leave the server) ────
router.get('/status', async (req, res) => {
  let conn = null;
  try {
    conn = await getGatewayConnection(req.user.uid);
  } catch {
    // DB unavailable — treat as not connected so the UI can still show the flow.
  }
  if (!conn) return res.json({ connected: false });
  res.json({
    connected: true,
    provider: conn.provider,
    merchantName: conn.merchant_name,
    lastSyncAt: conn.last_sync_at,
  });
});

// ─── Sync: pull real payments → analyse → ground the RAG store ─────────────
router.post('/sync', async (req, res) => {
  let conn = null;
  try {
    conn = await getGatewayConnection(req.user.uid);
  } catch {
    // fall through to the not-connected response
  }
  if (!conn) return res.status(404).json({ error: 'No payment gateway connected' });
  try {

    const keyId = decryptSecret(conn.key_id_enc);
    const keySecret = decryptSecret(conn.key_secret_enc);
    const { transactions, analysis, fetched } = await syncGatewayData(conn.provider, keyId, keySecret);
    try { await touchGatewaySync(req.user.uid); } catch { /* cache stamp best-effort */ }

    // Ground the AI store on the merchant's REAL data (per-user session).
    storeSnapshot(req.user.uid, {
      analysis,
      merchant: { name: conn.merchant_name || 'Merchant' },
      incidents: [],
    });

    res.json({
      ok: true,
      fetched,
      transactions,
      analysis,
      merchantName: conn.merchant_name,
      snapshot: snapshotSummary(getSnapshot(req.user.uid)),
    });
  } catch (err) {
    console.error('[Gateway sync]', err.message);
    if (err.code === 'invalid_credentials') {
      return res.status(401).json({ error: 'Stored credentials are no longer valid. Reconnect the gateway.' });
    }
    res.status(502).json({ error: 'Failed to fetch payments from the provider.' });
  }
});

// ─── Disconnect: remove credentials entirely ────────────────────────────────
router.post('/disconnect', async (req, res) => {
  try {
    await deleteGatewayConnection(req.user.uid);
    res.json({ ok: true });
  } catch {
    // Treat as success when nothing is stored (idempotent disconnect).
    res.json({ ok: true });
  }
});