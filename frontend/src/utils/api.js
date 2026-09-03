const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const url = `${API_BASE}/api${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    // Backend might not be running — return null so frontend degrades gracefully
    console.warn(`[API] ${path} failed:`, err.message);
    return null;
  }
}

export const api = {
  health: () => request('/health'),

  consult: async (prompt, model) => {
    const result = await request('/agent/consult', {
      method: 'POST',
      body: JSON.stringify({ prompt, model: model || 'anthropic/claude-sonnet-4' }),
    });
    return result || { content: fallbackResponse(prompt), model: 'local', demo: true };
  },

  models: () => request('/agent/models'),
  stats: () => request('/stats'),
  audit: () => request('/audit'),

  saveIncident: (incident) => request('/incidents', {
    method: 'POST',
    body: JSON.stringify(incident),
  }),

  saveCampaign: (campaign) => request('/campaigns', {
    method: 'POST',
    body: JSON.stringify(campaign),
  }),

  saveAction: (action) => request('/actions', {
    method: 'POST',
    body: JSON.stringify(action),
  }),
};

function fallbackResponse(prompt) {
  // Demo fallback when the backend is unreachable — clearly labelled, never presented as live data.
  const demo = (body) => `*(demo response — connect your Razorpay account for live data)*\n\n${body}`;
  const q = String(prompt).toLowerCase();
  if (q.includes('why') || q.includes('drop') || q.includes('fail'))
    return demo(`Revenue dropped **12.4%** primarily due to UPI payment failures from 3 banks. ₹62,400 is potentially recoverable. AI recommends sending recovery links with alternate payment methods.`);
  if (q.includes('risk') || q.includes('top'))
    return demo(`**Top Risks:**\n\n🔴 Payment Failures — ₹62K (↑38%)\n🟠 Checkout Abandonment — ₹41K (↑21%)\n🟡 Subscription Failures — ₹27K\n🟣 High-Risk Users — ₹17K\n\n**Total:** ₹1,47,230 at risk.`);
  if (q.includes('recover'))
    return demo(`**Recovery Plan:**\n\n1. Send links to 312 eligible customers\n2. Suggest Net Banking/Card for affected banks\n3. Expected: ₹41.8K – ₹49.2K (67-79% success)\n\n**Risk:** LOW — Customer must approve.`);
  return demo(`Revenue at risk: ₹1,47,230 across 10,000 transactions. AI detected UPI failure spike of 38%. Recommended: send recovery payment links with alternate methods.`);
}
