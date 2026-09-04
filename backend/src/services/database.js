import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT 'CampusKart',
        potential_revenue BIGINT DEFAULT 1000000,
        total_transactions INT DEFAULT 10000,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        merchant_id INT REFERENCES merchants(id),
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        affected_banks TEXT[],
        affected_transactions INT,
        revenue_at_risk BIGINT,
        peak_window VARCHAR(100),
        root_cause TEXT,
        ai_confidence INT,
        recovery_strategy TEXT,
        expected_recovery_low BIGINT,
        expected_recovery_high BIGINT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_actions (
        id SERIAL PRIMARY KEY,
        merchant_id INT REFERENCES merchants(id),
        incident_id INT REFERENCES incidents(id),
        action_type VARCHAR(100) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        risk_level VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        revenue_recovered BIGINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS recovery_campaigns (
        id SERIAL PRIMARY KEY,
        merchant_id INT REFERENCES merchants(id),
        incident_id INT REFERENCES incidents(id),
        status VARCHAR(20) DEFAULT 'ready',
        customers_contacted INT DEFAULT 0,
        payments_recovered INT DEFAULT 0,
        amount_recovered BIGINT DEFAULT 0,
        recovery_rate INT DEFAULT 0,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        merchant_id INT REFERENCES merchants(id),
        action VARCHAR(100) NOT NULL,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gateway_connections (
        user_id VARCHAR(128) PRIMARY KEY,
        provider VARCHAR(20) NOT NULL,
        key_id_enc TEXT NOT NULL,
        key_secret_enc TEXT NOT NULL,
        merchant_name VARCHAR(255),
        last_sync_at TIMESTAMPTZ,
        connected_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Seed default merchant if not exists
      INSERT INTO merchants (name, potential_revenue, total_transactions)
      SELECT 'CampusKart', 1000000, 10000
      WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE name = 'CampusKart');
    `);
    console.log('✓ Database initialized');
  } finally {
    client.release();
  }
}

export async function saveIncident(incident, merchantId = 1) {
  const { rows } = await pool.query(
    `INSERT INTO incidents (merchant_id, type, severity, affected_banks, affected_transactions, revenue_at_risk, peak_window, root_cause, ai_confidence, recovery_strategy, expected_recovery_low, expected_recovery_high)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [merchantId, incident.type, incident.severity, incident.affectedBanks, incident.affectedTransactions, incident.revenueAtRisk, incident.peakWindow, incident.rootCause, incident.aiConfidence, incident.recoveryStrategy, incident.expectedRecovery?.low, incident.expectedRecovery?.high]
  );
  return rows[0].id;
}

export async function saveAIAction(action, merchantId = 1) {
  const { rows } = await pool.query(
    `INSERT INTO ai_actions (merchant_id, incident_id, action_type, title, description, risk_level, status, revenue_recovered)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [merchantId, action.incidentId, action.type, action.title, action.description, action.riskLevel, action.status, action.revenueRecovered || 0]
  );
  return rows[0].id;
}

export async function saveRecoveryCampaign(campaign, merchantId = 1) {
  const { rows } = await pool.query(
    `INSERT INTO recovery_campaigns (merchant_id, incident_id, status, customers_contacted, payments_recovered, amount_recovered, recovery_rate, started_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [merchantId, campaign.incidentId, campaign.status, campaign.customersContacted, campaign.paymentsRecovered, campaign.amountRecovered, campaign.recoveryRate, campaign.startedAt, campaign.completedAt]
  );
  return rows[0].id;
}

export async function getMerchantStats(merchantId = 1) {
  const { rows } = await pool.query(
    `SELECT 
       COALESCE(SUM(revenue_at_risk), 0) as total_at_risk,
       COALESCE(SUM(amount_recovered), 0) as total_recovered,
       COUNT(DISTINCT i.id) as total_incidents,
       COUNT(DISTINCT rc.id) as total_campaigns
     FROM incidents i
     LEFT JOIN recovery_campaigns rc ON rc.merchant_id = i.merchant_id
     WHERE i.merchant_id = $1`,
    [merchantId]
  );
  return rows[0];
}

export async function getAuditLog(merchantId = 1, limit = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM audit_log WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [merchantId, limit]
  );
  return rows;
}

export async function saveGatewayConnection(userId, { provider, keyIdEnc, keySecretEnc, merchantName }) {
  const { rows } = await pool.query(
    `INSERT INTO gateway_connections (user_id, provider, key_id_enc, key_secret_enc, merchant_name, connected_at)
     VALUES ($1,$2,$3,$4,$5, NOW())
     ON CONFLICT (user_id) DO UPDATE SET provider=$2, key_id_enc=$3, key_secret_enc=$4, merchant_name=$5, connected_at=NOW()`,
    [userId, provider, keyIdEnc, keySecretEnc, merchantName]
  );
  return rows[0]?.id ?? userId;
}

export async function getGatewayConnection(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM gateway_connections WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function deleteGatewayConnection(userId) {
  await pool.query(`DELETE FROM gateway_connections WHERE user_id = $1`, [userId]);
  return true;
}

export async function touchGatewaySync(userId) {
  await pool.query(`UPDATE gateway_connections SET last_sync_at = NOW() WHERE user_id = $1`, [userId]);
  return true;
}

export { pool };
