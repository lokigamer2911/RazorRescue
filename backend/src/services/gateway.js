// gateway.js — connect the merchant's real payment gateway (Razorpay / Stripe),
// fetch live payment data, normalize it into the app's transaction shape, and
// run the same analysis pipeline the dashboard renders.
//
// SECURITY: gateway API secrets are encrypted at rest (AES-256-GCM) with a key
// derived from GATEWAY_ENC_KEY (env). They are only ever used server-side to
// call the provider API. Nothing secret is returned to the client.

import crypto from 'crypto';
import { analyseTransactions } from './simulation.js';

// ─── Encryption (AES-256-GCM) ────────────────────────────────────────────────
function encKey() {
  const raw = process.env.GATEWAY_ENC_KEY || process.env.DATABASE_URL || 'razorrescue-local-dev-only';
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptSecret(stored) {
  const [ivHex, tagHex, dataHex] = String(stored).split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Malformed secret');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}

// ─── Provider API clients ────────────────────────────────────────────────────
const RAZORPAY_API = 'https://api.razorpay.com/v1';
const STRIPE_API = 'https://api.stripe.com/v1';

async function razorpayFetch(keyId, keySecret, path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${RAZORPAY_API}${path}${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const code = res.status === 401 ? 'invalid_credentials' : 'provider_error';
    throw new GatewayError(code, res.status, detail.slice(0, 200));
  }
  return res.json();
}

async function stripeFetch(secretKey, path, params = {}) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(`${STRIPE_API}${path}${body ? `?${body}` : ''}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const code = res.status === 401 ? 'invalid_credentials' : 'provider_error';
    throw new GatewayError(code, res.status, detail.slice(0, 200));
  }
  return res.json();
}

export class GatewayError extends Error {
  constructor(code, status, detail) {
    super(code);
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

// Validate credentials with a minimal live call. Throws GatewayError on failure.
export async function testConnection(provider, keyId, keySecret) {
  if (provider === 'razorpay') {
    const data = await razorpayFetch(keyId, keySecret, '/payments', { count: 1 });
    return { ok: true, merchantName: `Razorpay account ·${maskKey(keyId)}` };
  }
  if (provider === 'stripe') {
    const data = await stripeFetch(keySecret, '/charges', { limit: 1 });
    let merchantName = `Stripe account ·${maskKey(keySecret)}`;
    try {
      const acct = await stripeFetch(keySecret, '/account');
      if (acct?.business_profile?.name) merchantName = `${acct.business_profile.name} (Stripe)`;
    } catch { /* fall back to masked label */ }
    return { ok: true, merchantName };
  }
  throw new GatewayError('unsupported_provider', 400, 'Provider must be razorpay or stripe');
}

export function maskKey(key) {
  const s = String(key || '');
  if (s.length <= 8) return '••••';
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

// ─── Normalization: provider payment → app transaction ──────────────────────
// VPA handle → bank code mapping (UPI).
const VPA_BANKS = {
  oksbi: ['SBI', 'State Bank of India'], okhdfcbank: ['HDFC', 'HDFC Bank'],
  okicici: ['ICICI', 'ICICI Bank'], okaxis: ['AXIS', 'Axis Bank'],
  okkotak: ['KOT', 'Kotak Mahindra Bank'], okbob: ['BOB', 'Bank of Baroda'],
  okpnb: ['PNB', 'Punjab National Bank'], okunionbank: ['UBI', 'Union Bank of India'],
  okidbi: ['IDBI', 'IDBI Bank'], okcanara: ['CNR', 'Canara Bank'],
  okyesbank: ['YES', 'Yes Bank'], okindusind: ['IND', 'IndusInd Bank'],
  okidfc: ['IDFC', 'IDFC First Bank'], okfederal: ['FED', 'Federal Bank'],
  okrbl: ['RBL', 'RBL Bank'], okaubank: ['AUB', 'AU Small Finance Bank'],
};

function bankFromVpa(vpa) {
  if (!vpa) return null;
  // The bank handle is the part AFTER the @: ram@oksbi → oksbi
  const handle = String(vpa).split('@')[1]?.toLowerCase() || '';
  const bank = VPA_BANKS[handle];
  return bank ? { code: bank[0], name: bank[1] } : { code: 'OTH', name: 'Other UPI' };
}

const METHOD_LABELS = {
  upi: 'UPI', card: 'Credit/Debit Card', netbanking: 'Net Banking',
  wallet: 'Wallet', emi: 'EMI', bank_transfer: 'Bank Transfer',
  card_cc: 'Credit Card', card_dc: 'Debit Card',
};

function istHour(unixSec) {
  // IST = UTC + 5:30
  return new Date((unixSec + 5.5 * 3600) * 1000).getUTCHours();
}

function normalizeRazorpay(p) {
  const status = p.status === 'failed' ? 'failed' : 'success';
  let bank = null;
  if (p.method === 'netbanking' && p.bank) {
    bank = { code: String(p.bank).toUpperCase().slice(0, 6), name: String(p.bank).replace(/_/g, ' ') };
  } else if (p.method === 'upi') {
    bank = bankFromVpa(p.vpa);
  } else if (p.method === 'card') {
    bank = { code: 'CARD', name: p.card?.network ? `Card (${p.card.network})` : 'Card' };
  } else if (p.method === 'wallet') {
    bank = { code: 'WALLET', name: p.wallet ? `Wallet (${p.wallet})` : 'Wallet' };
  } else {
    bank = { code: 'OTH', name: 'Other' };
  }
  const hour = istHour(p.created_at);
  return {
    id: p.id || `rzp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customer: p.id ? `Cust-${String(p.id).slice(-6)}` : 'Cust-••••••',
    amount: Math.round((p.amount || 0) / 100), // paise → ₹
    method: METHOD_LABELS[p.method] || String(p.method || 'Other'),
    bank: bank.name, bankCode: bank.code,
    status,
    failureReason: status === 'failed' ? (p.error_description || 'Payment failed at gateway') : null,
    hour,
    timestamp: `${String(hour).padStart(2, '0')}:${String(Math.floor(((p.created_at || 0) % 3600) / 60)).padStart(2, '0')}`,
  };
}

function normalizeStripe(c) {
  const status = c.status === 'failed' ? 'failed' : 'success';
  const det = c.payment_method_details || {};
  let bank = null;
  if (det.type === 'upi') {
    bank = bankFromVpa(det.upi?.vpa);
  } else if (det.type === 'card') {
    bank = { code: 'CARD', name: `Card (${det.card?.network || 'unknown'})` };
  } else {
    bank = { code: 'OTH', name: 'Other' };
  }
  const hour = istHour(c.created);
  return {
    id: c.id || `stripe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customer: c.id ? `Cust-${String(c.id).slice(-6)}` : 'Cust-••••••',
    amount: Math.round((c.amount || 0) / 100), // cents → ₹
    method: METHOD_LABELS[det.type] || (det.type ? String(det.type).replace(/_/g, ' ') : 'Other'),
    bank: bank.name, bankCode: bank.code,
    status,
    failureReason: status === 'failed' ? (c.failure_message || 'Payment failed at gateway') : null,
    hour,
    timestamp: `${String(hour).padStart(2, '0')}:${String(Math.floor(((c.created || 0) % 3600) / 60)).padStart(2, '0')}`,
  };
}

// Fetch up to `maxPayments` recent payments (paginated, newest first).
export async function fetchPayments(provider, keyId, keySecret, maxPayments = 1000) {
  const out = [];
  if (provider === 'razorpay') {
    let skip = 0;
    while (out.length < maxPayments) {
      const data = await razorpayFetch(keyId, keySecret, '/payments', { count: Math.min(100, maxPayments - out.length), skip });
      const items = data.items || [];
      if (!items.length) break;
      out.push(...items.map(normalizeRazorpay));
      skip += items.length;
      if (items.length < 100) break;
    }
  } else if (provider === 'stripe') {
    let startingAfter = null;
    while (out.length < maxPayments) {
      const params = { limit: Math.min(100, maxPayments - out.length) };
      if (startingAfter) params.starting_after = startingAfter;
      const data = await stripeFetch(keySecret, '/charges', params);
      const items = data.data || [];
      if (!items.length) break;
      out.push(...items.map(normalizeStripe));
      startingAfter = items[items.length - 1].id;
      if (items.length < 100) break;
    }
  } else {
    throw new GatewayError('unsupported_provider', 400, 'Provider must be razorpay or stripe');
  }
  return out;
}

// Full pipeline: fetch → normalize → analyse (same shape the dashboard renders).
export async function syncGatewayData(provider, keyId, keySecret, maxPayments = 1000) {
  const transactions = await fetchPayments(provider, keyId, keySecret, maxPayments);
  const analysis = analyseTransactions(transactions);
  return { transactions, analysis, fetched: transactions.length };
}