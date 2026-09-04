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
    // Backend might not be running — return null so callers degrade gracefully.
    console.warn(`[API] ${path} failed:`, err.message);
    return null;
  }
}

export const api = {
  health: () => request('/health'),

  // Push the dashboard's live analysis snapshot → becomes the RAG grounding data.
  pushContext: (snapshot) => request('/agent/context', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  }),

  contextStatus: () => request('/agent/context'),

  // Multi-agent orchestration: Router → specialists → Chief Analyst.
  query: async (prompt) => {
    const result = await request('/agent/query', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
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
};
