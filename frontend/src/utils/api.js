const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  health: () => request('/health'),
  consult: (prompt, model) => request('/agent/consult', { method: 'POST', body: JSON.stringify({ prompt, model }) }),
  models: () => request('/agent/models'),
  stats: () => request('/stats'),
  audit: () => request('/audit'),
  saveIncident: (incident) => request('/incidents', { method: 'POST', body: JSON.stringify(incident) }),
  saveCampaign: (campaign) => request('/campaigns', { method: 'POST', body: JSON.stringify(campaign) }),
  saveAction: (action) => request('/actions', { method: 'POST', body: JSON.stringify(action) }),
};
