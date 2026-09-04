// firebaseAuth.js — verify Firebase ID tokens without extra dependencies.
// Firebase ID tokens are RS256 JWTs signed by Google's public certificates.
// We fetch the certs (cached for 1 hour), verify signature + issuer + audience
// + expiry using Node's built-in crypto, then expose req.user (uid).

import crypto from 'crypto';

const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certCache = { at: 0, certs: null };

async function getCerts() {
  if (certCache.certs && Date.now() - certCache.at < 60 * 60 * 1000) return certCache.certs;
  const res = await fetch(CERT_URL, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error('Failed to fetch Firebase certs');
  const certs = await res.json();
  certCache = { at: Date.now(), certs };
  return certs;
}

function decodePart(part) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

export async function verifyIdToken(idToken) {
  const parts = String(idToken).split('.');
  if (parts.length !== 3) throw new Error('Malformed token');

  const header = decodePart(parts[0]);
  const payload = decodePart(parts[1]);
  const signature = Buffer.from(parts[2], 'base64url');

  if (header.alg !== 'RS256') throw new Error('Unexpected algorithm');
  if (!payload.exp || payload.exp * 1000 < Date.now()) throw new Error('Token expired');

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID not configured');
  if (payload.aud !== projectId) throw new Error('Wrong audience');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Wrong issuer');

  const certs = await getCerts();
  const pem = certs[header.kid];
  if (!pem) throw new Error('Unknown signing key');

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  if (!verifier.verify(pem, signature)) throw new Error('Invalid signature');

  return {
    uid: payload.user_id || payload.sub,
    email: payload.email || null,
    phone: payload.phone_number || null,
    name: payload.name || null,
  };
}

// Express middleware — protects routes that need a signed-in user.
export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized — sign in required' });
  try {
    const user = await verifyIdToken(token);
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized — invalid session' });
  }
}