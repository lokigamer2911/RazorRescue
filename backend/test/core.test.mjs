// core.test.mjs — unit tests for RazorRescue's deterministic AI core.
// Run with: bun test   (from backend/)
// These tests cover the exact production functions the multi-agent pipeline
// depends on: intent routing, agent planning, zero-spend policy, snapshot
// normalization (PII stripping), fact derivation, grounding, and input
// validation. No network, no LLM — fully deterministic.

import { test, expect, describe } from 'bun:test';

import {
  isModelSpendFree,
  isPaidAllowed,
  classifyIntent,
  planAgents,
  systemPromptFor,
  engineSummary,
  ROSTER,
} from '../src/services/agents.js';

import {
  normalizeSnapshot,
  storeSnapshot,
  getSnapshot,
  severityOf,
  deriveFacts,
  renderDataset,
  snapshotSummary,
} from '../src/services/contextStore.js';

import { sanitize, schemas, validate } from '../src/middleware/security.js';

// ─── ZERO-SPEND POLICY ────────────────────────────────────────────────────────

describe('zero-spend policy', () => {
  test('only :free model ids are spend-free', () => {
    expect(isModelSpendFree('google/gemma-4-26b-a4b-it:free')).toBe(true);
    expect(isModelSpendFree('inclusionai/ling-3.0-flash-fin:free')).toBe(true);
    expect(isModelSpendFree('anthropic/claude-sonnet-4')).toBe(false);
    expect(isModelSpendFree('gpt-4o')).toBe(false);
    expect(isModelSpendFree(null)).toBe(false);
    expect(isModelSpendFree('')).toBe(false);
  });

  test('paid models are refused unless deliberately allowed', () => {
    const prev = process.env.ALLOW_PAID_MODELS;
    delete process.env.ALLOW_PAID_MODELS;
    expect(isPaidAllowed()).toBe(false);
    process.env.ALLOW_PAID_MODELS = 'true';
    expect(isPaidAllowed()).toBe(true);
    if (prev === undefined) delete process.env.ALLOW_PAID_MODELS;
    else process.env.ALLOW_PAID_MODELS = prev;
  });

  test('every roster model and fallback is :free', () => {
    const ids = [];
    for (const a of Object.values(ROSTER)) {
      if (a.model) ids.push(a.model);
      if (a.fallbacks) ids.push(...a.fallbacks);
    }
    for (const id of ids) {
      expect(isModelSpendFree(id), `${id} must be :free`).toBe(true);
    }
  });
});

// ─── INTENT ROUTER ────────────────────────────────────────────────────────────

describe('classifyIntent', () => {
  test('routes investigation questions', () => {
    expect(classifyIntent('why did payments fail at 8pm?')).toBe('investigate');
    expect(classifyIntent('root cause of the decline')).toBe('investigate');
    expect(classifyIntent('investigate the drop yesterday')).toBe('investigate');
  });

  test('routes recovery questions', () => {
    expect(classifyIntent('draft a recovery plan')).toBe('recovery');
    expect(classifyIntent('how do we recover this revenue?')).toBe('recovery');
    expect(classifyIntent('what should we do to get back the money')).toBe('recovery');
  });

  test('routes risk questions', () => {
    expect(classifyIntent('which bank is the biggest risk?')).toBe('risk');
    expect(classifyIntent('severity of the exposure')).toBe('risk');
  });

  test('routes pattern questions', () => {
    expect(classifyIntent('is there a time-of-day pattern?')).toBe('patterns');
    expect(classifyIntent('bank pattern analysis')).toBe('patterns');
  });

  test('routes summary questions', () => {
    expect(classifyIntent('give me a summary')).toBe('summary');
    expect(classifyIntent('overview of what is happening')).toBe('summary');
  });

  test('unknown questions default to investigate', () => {
    expect(classifyIntent('hello there')).toBe('investigate');
    expect(classifyIntent('')).toBe('investigate');
  });
});

describe('planAgents', () => {
  test('each intent selects the right specialists', () => {
    expect(planAgents('recovery')).toEqual(['pattern', 'risk', 'recovery']);
    expect(planAgents('risk')).toEqual(['pattern', 'risk']);
    expect(planAgents('patterns')).toEqual(['pattern']);
    expect(planAgents('summary')).toEqual(['risk']);
    expect(planAgents('investigate')).toEqual(['pattern', 'risk']);
  });
});

describe('systemPromptFor', () => {
  test('every agent prompt enforces the grounding rules', () => {
    for (const id of ['pattern', 'risk', 'recovery', 'chief']) {
      const p = systemPromptFor(id);
      expect(p).toContain('NEVER invent');
      expect(p).toContain('DATA SNAPSHOT');
      expect(p).toContain(id === 'chief' ? 'synthesizer' : 'Your task');
    }
  });
});

// ─── SNAPSHOT NORMALIZATION (PII stripping + bounds) ──────────────────────────

function samplePayload(overrides = {}) {
  return {
    merchant: { name: 'Acme Stores', potentialRevenue: 1000000, totalTransactions: 1000 },
    analysis: {
      total: 500,
      failed: 75,
      revenueAtRisk: 250000,
      byBank: [
        { name: 'HDFC Bank', code: 'HDFC', failed: 40, total: 120, amount: 140000 },
        { name: 'State Bank of India', code: 'SBIN', failed: 25, total: 90, amount: 80000 },
        { name: 'ICICI Bank', code: 'ICIC', failed: 10, total: 290, amount: 30000 },
      ],
      byHour: { 18: { total: 90, failed: 30 }, 19: { total: 85, failed: 25 }, 20: { total: 80, failed: 20 } },
      byMethod: { upi: { count: 300, amount: 900000 }, card: { count: 150, amount: 500000 } },
      topFailed: [
        { amount: 5000, hour: 18, bankCode: 'HDFC', failureReason: 'declined by bank' },
        { amount: 3000, hour: 19, bankCode: 'SBIN', failureReason: 'insufficient funds' },
      ],
    },
    incidents: [
      { type: 'routing', severity: 'high', affectedBanks: ['HDFC'], affectedTransactions: 40, revenueAtRisk: 140000, rootCause: 'bank outage', aiConfidence: 88, expectedRecovery: { low: 80000, high: 100000 } },
    ],
    ...overrides,
  };
}

describe('normalizeSnapshot', () => {
  test('normalizes a valid payload with exact numbers preserved', () => {
    const s = normalizeSnapshot(samplePayload());
    expect(s.analysis.total).toBe(500);
    expect(s.analysis.failed).toBe(75);
    expect(s.analysis.revenueAtRisk).toBe(250000);
    expect(s.analysis.successRate).toBeCloseTo(85, 1);
    expect(s.analysis.byBank).toHaveLength(3);
    expect(s.analysis.byBank[0].code).toBe('HDFC');
    expect(s.incidents).toHaveLength(1);
  });

  test('strips customer PII from the snapshot', () => {
    const s = normalizeSnapshot(samplePayload());
    const raw = JSON.stringify(s);
    expect(raw).not.toMatch(/customer/i);
    expect(s.analysis.topFailed).toHaveLength(2);
    // only amounts / codes / reasons survive — no names, emails, phones, VPAs
    expect(s.analysis.topFailed[0]).toEqual(
      expect.objectContaining({ amount: 5000, hour: 18, bankCode: 'HDFC', failureReason: 'declined by bank' }),
    );
  });

  test('clamps invalid values to sane bounds', () => {
    const s = normalizeSnapshot({
      analysis: {
        total: -5, failed: -3, revenueAtRisk: NaN,
        byBank: [{ code: 'HDFC', failed: -10, total: 0, amount: 'x' }],
        byHour: { 99: { total: 5 }, 18: { total: 10, failed: 2 } },
      },
    });
    expect(s.analysis.total).toBe(0);
    expect(s.analysis.failed).toBe(0);
    expect(s.analysis.revenueAtRisk).toBe(0);
    expect(s.analysis.byBank[0].failed).toBe(0);
    expect(s.analysis.byHour[99]).toBeUndefined();
    expect(s.analysis.byHour[18]).toBeDefined();
  });

  test('caps incidents to the last 10, newest first', () => {
    const incidents = Array.from({ length: 14 }, (_, i) => ({ type: `e${i}`, severity: 'low', aiConfidence: 50 }));
    const s = normalizeSnapshot(samplePayload({ incidents }));
    expect(s.incidents).toHaveLength(10);
    expect(s.incidents[0].type).toBe('e13');
  });
});

describe('storeSnapshot / getSnapshot', () => {
  test('round-trips a snapshot and returns a compact summary', () => {
    const summary = storeSnapshot('sess-1', samplePayload());
    expect(summary.total).toBe(500);
    expect(summary.failed).toBe(75);
    expect(summary.successRate).toBe(85);
    const s = getSnapshot('sess-1');
    expect(s.analysis.revenueAtRisk).toBe(250000);
    expect(getSnapshot('missing')).toBeNull();
  });

  test('drops the heaviest slice when a snapshot exceeds the byte cap', () => {
    const big = samplePayload();
    big.analysis.topFailed = Array.from({ length: 5000 }, (_, i) => ({ amount: i, hour: 18, bankCode: 'HDFC', failureReason: 'declined' }));
    const summary = storeSnapshot('sess-big', big);
    const s = getSnapshot('sess-big');
    expect(JSON.stringify(s).length).toBeLessThanOrEqual(summary.snapshotBytes + 2);
  });
});

// ─── SEVERITY + FACT DERIVATION ───────────────────────────────────────────────

describe('severityOf', () => {
  test('bands match the documented thresholds', () => {
    expect(severityOf(16)).toBe('CRITICAL');
    expect(severityOf(11)).toBe('HIGH');
    expect(severityOf(7)).toBe('ELEVATED');
    expect(severityOf(3)).toBe('NORMAL');
    expect(severityOf(15.5)).toBe('CRITICAL');
  });
});

describe('deriveFacts', () => {
  test('derives the documented facts from a real snapshot', () => {
    const facts = deriveFacts(normalizeSnapshot(samplePayload()));
    expect(facts.total).toBe(500);
    expect(facts.failed).toBe(75);
    expect(facts.worstBank.code).toBe('HDFC');
    expect(facts.topBanks).toHaveLength(3);
    expect(facts.concentration).toBeGreaterThan(90); // 75 of 75 failures in top3
    expect(facts.peakWindow.start).toBe(18);
    expect(facts.peakWindow.failed).toBe(75);
    expect(facts.topMethods[0].name).toBe('upi');
    expect(facts.eligible).toBe(Math.round(75 * 0.8));
    expect(facts.recoverLow).toBe(Math.round(250000 * 0.6));
    expect(facts.recoverHigh).toBe(Math.round(250000 * 0.8));
    expect(facts.confidence).toBeGreaterThanOrEqual(62);
    expect(facts.confidence).toBeLessThanOrEqual(96);
  });

  test('returns zeros for an empty snapshot (never NaN)', () => {
    const facts = deriveFacts(null);
    for (const key of ['total', 'failed', 'successRate', 'revenueAtRisk', 'concentration', 'peakFailed', 'peakShare', 'confidence', 'eligible', 'recoverLow', 'recoverHigh', 'recoverMid']) {
      expect(facts[key], key).toBe(0);
    }
    expect(facts.worstBank).toBeNull();
    expect(facts.topBanks).toEqual([]);
  });
});

describe('renderDataset grounding', () => {
  test('renders a deterministic DATA block that cites only snapshot numbers', () => {
    const block = renderDataset(normalizeSnapshot(samplePayload()));
    expect(block).toContain('=== DATA SNAPSHOT');
    expect(block).toContain('Failed: 75');
    expect(block).toContain('Revenue at risk: ₹2,50,000');
    expect(block).toContain('DERIVED FACTS');
    expect(block).toContain('Diagnosis confidence');
    expect(block).not.toContain('undefined');
    expect(block).not.toContain('NaN');
  });

  test('honestly reports when no snapshot exists', () => {
    expect(renderDataset(null)).toContain('No merchant data snapshot available');
  });
});

describe('engineSummary (deterministic engines)', () => {
  const facts = deriveFacts(normalizeSnapshot(samplePayload()));

  test('pattern engine reports worst bank and peak window from facts', () => {
    const out = engineSummary('pattern', facts);
    expect(out).toContain('HDFC');
    expect(out).toContain('18:00');
    expect(out).toContain('75');
  });

  test('risk engine reports revenue at risk, severity and confidence', () => {
    const out = engineSummary('risk', facts);
    expect(out).toContain('₹2,50,000');
    expect(out).toContain('CRITICAL');
    expect(out).toContain('Diagnosis confidence');
  });

  test('recovery engine reports eligible customers and bounded range', () => {
    const out = engineSummary('recovery', facts);
    expect(out).toContain('60');
    expect(out).toContain('₹1,50,000');
    expect(out).toContain('₹2,00,000');
    expect(out).toContain('no auto refunds');
  });

  test('engines refuse to answer with no data loaded', () => {
    const out = engineSummary('risk', deriveFacts(null));
    expect(out).toContain('No merchant data loaded');
  });
});

// ─── INPUT VALIDATION ─────────────────────────────────────────────────────────

describe('sanitize', () => {
  test('strips HTML/angle-bracket injection from strings', () => {
    const { cleaned } = sanitize({ prompt: '<script>alert(1)</script>hello' }, schemas.query);
    expect(cleaned.prompt).toBe('scriptalert(1)/scripthello');
    expect(cleaned.prompt).not.toContain('<');
  });

  test('enforces required fields and max lengths', () => {
    const { errors } = sanitize({}, schemas.query);
    expect(errors).toContain('prompt is required');
    const { errors: tooLong } = sanitize({ prompt: 'x'.repeat(5000) }, schemas.query);
    expect(tooLong[0]).toContain('exceeds max length');
  });

  test('applies defaults when optional fields are absent', () => {
    const { cleaned } = sanitize({ prompt: 'hi' }, schemas.query);
    expect(cleaned.sessionId).toBe('default');
  });

  test('validates numbers and enums', () => {
    const { errors: badNum } = sanitize({ affectedTransactions: -4 }, schemas.saveIncident);
    expect(badNum.some((e) => e.includes('>='))).toBe(true);
    const { cleaned, errors: badEnum } = sanitize({ status: 'exploded' }, schemas.saveCampaign);
    expect(badEnum.some((e) => e.includes('must be one of'))).toBe(true);
    expect(cleaned.status).toBeUndefined();
  });

  test('gateway schema accepts valid razorpay/stripe providers only', () => {
    const { cleaned, errors } = sanitize({ provider: 'razorpay', keyId: 'rzp_test_abc', keySecret: 'secret123' }, schemas.gatewayConnect);
    expect(errors).toHaveLength(0);
    expect(cleaned.provider).toBe('razorpay');
    const { errors: badProvider } = sanitize({ provider: 'paypal', keyId: 'x', keySecret: 'y' }, schemas.gatewayConnect);
    expect(badProvider).toHaveLength(1);
  });
});

describe('validate middleware', () => {
  test('rejects invalid bodies with 400 and error details', () => {
    const mw = validate('query');
    const req = { body: {} };
    const seen = {};
    const res = { status: (code) => { seen.code = code; return res; }, json: (payload) => { seen.payload = payload; return res; } };
    mw(req, res, () => {});
    expect(seen.code).toBe(400);
    expect(seen.payload.details).toContain('prompt is required');
  });

  test('passes clean bodies through with cleaned values', () => {
    const mw = validate('query');
    const req = { body: { prompt: '  draft a plan  ' } };
    let nextCalled = false;
    mw(req, { status: () => ({ json: () => {} }) }, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(req.body.prompt).toBe('draft a plan');
  });
});

// ─── SNAPSHOT SUMMARY ─────────────────────────────────────────────────────────

describe('snapshotSummary', () => {
  test('returns a compact public summary or null', () => {
    expect(snapshotSummary(null)).toBeNull();
    const s = snapshotSummary(normalizeSnapshot(samplePayload()));
    expect(s.total).toBe(500);
    expect(s.failed).toBe(75);
    expect(s.revenueAtRisk).toBe(250000);
    expect(s.incidents).toBe(1);
  });
});