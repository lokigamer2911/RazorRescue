import rateLimit from 'express-rate-limit';

// Rate limiter: 60 requests per minute per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Stricter limiter for AI consultation: 10 per minute
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Please wait before trying again.' },
});

// Input sanitization — strip dangerous characters, enforce max lengths
export function sanitize(body, schema) {
  const errors = [];
  const cleaned = {};

  for (const [key, rules] of Object.entries(schema)) {
    const val = body?.[key];

    if (rules.required && (val === undefined || val === null || val === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    if (val === undefined || val === null) {
      cleaned[key] = rules.default ?? null;
      continue;
    }

    if (rules.type === 'string') {
      const str = String(val).trim();
      if (rules.maxLength && str.length > rules.maxLength) {
        errors.push(`${key} exceeds max length of ${rules.maxLength}`);
        continue;
      }
      cleaned[key] = rules.sanitize === false ? str : str.replace(/[<>'"]/g, '');
    } else if (rules.type === 'number') {
      const num = Number(val);
      if (isNaN(num)) { errors.push(`${key} must be a number`); continue; }
      if (rules.min !== undefined && num < rules.min) { errors.push(`${key} must be >= ${rules.min}`); continue; }
      if (rules.max !== undefined && num > rules.max) { errors.push(`${key} must be <= ${rules.max}`); continue; }
      cleaned[key] = num;
    } else if (rules.type === 'enum') {
      if (!rules.values.includes(val)) { errors.push(`${key} must be one of: ${rules.values.join(', ')}`); continue; }
      cleaned[key] = val;
    } else {
      cleaned[key] = val;
    }
  }

  return { cleaned, errors };
}

// Validation schemas for each endpoint
export const schemas = {
  consult: {
    prompt: { type: 'string', required: true, maxLength: 4000 },
    model: { type: 'string', maxLength: 100, default: 'anthropic/claude-sonnet-4' },
    sessionId: { type: 'string', maxLength: 64, default: 'default' },
  },
  query: {
    prompt: { type: 'string', required: true, maxLength: 4000 },
    sessionId: { type: 'string', maxLength: 64, default: 'default' },
  },
  context: {
    sessionId: { type: 'string', maxLength: 64, default: 'default' },
    analysis: { type: 'object', required: true },
    merchant: { type: 'object' },
    incidents: { type: 'object' },
  },
  generateTransactions: {
    count: { type: 'number', min: 100, max: 100000, default: 10000 },
  },
  analyse: {
    transactions: { type: 'object', required: true },
  },
  generateIncident: {
    type: { type: 'enum', values: ['upi-failure', 'checkout-abandon', 'subscription-fail', 'bank-outage', 'combined'], required: true },
    severity: { type: 'enum', values: ['low', 'medium', 'high', 'critical'], required: true },
    transactionCount: { type: 'number', min: 100, max: 100000, default: 10000 },
  },
  saveIncident: {
    type: { type: 'string', required: true, maxLength: 100 },
    severity: { type: 'string', required: true, maxLength: 20 },
    affectedTransactions: { type: 'number', min: 0 },
    revenueAtRisk: { type: 'number', min: 0 },
    aiConfidence: { type: 'number', min: 0, max: 100 },
  },
  saveCampaign: {
    status: { type: 'enum', values: ['ready', 'running', 'complete'], required: true },
    customersContacted: { type: 'number', min: 0 },
    paymentsRecovered: { type: 'number', min: 0 },
    amountRecovered: { type: 'number', min: 0 },
    recoveryRate: { type: 'number', min: 0, max: 100 },
  },
  saveAction: {
    type: { type: 'string', required: true, maxLength: 100 },
    title: { type: 'string', required: true, maxLength: 500 },
    riskLevel: { type: 'string', maxLength: 20 },
    status: { type: 'enum', values: ['pending', 'completed', 'failed'], default: 'pending' },
  },
};

// Middleware factory: validate request body against a schema
export function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next();
    const { cleaned, errors } = sanitize(req.body, schema);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.body = cleaned;
    next();
  };
}
