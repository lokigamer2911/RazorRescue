const API_BASE = import.meta.env.VITE_API_URL || '';

let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const url = `${API_BASE}/api${path}`;
  try {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const err = new Error(body?.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return res.json();
  } catch (err) {
    if (err.status) throw err; // real API error — let callers handle it
    // Backend unreachable — return null so callers degrade gracefully.
    console.warn(`[API] ${path} failed:`, err.message);
    return null;
  }
}

export const api = {
  health: () => request('/health'),

  // Push the dashboard's live analysis snapshot → becomes the RAG grounding data.
  pushContext: (snapshot, sessionId) => request('/agent/context', {
    method: 'POST',
    body: JSON.stringify({ ...snapshot, sessionId }),
  }),

  contextStatus: (sessionId) => request(`/agent/context?sessionId=${encodeURIComponent(sessionId || 'default')}`),

  // Multi-agent orchestration: Router → specialists → Chief Analyst.
  query: async (prompt, sessionId) => {
    const result = await request('/agent/query', {
      method: 'POST',
      body: JSON.stringify({ prompt, sessionId }),
    });
    return result; // null when the backend is unreachable
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

  // ─── Payment gateway (real business payments) ───────────────────────────
  gatewayConnect: (payload) => request('/gateway/connect', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  gatewayStatus: () => request('/gateway/status'),

  gatewaySync: () => request('/gateway/sync', { method: 'POST' }),

  gatewayDisconnect: () => request('/gateway/disconnect', { method: 'POST' }),
};