# ⚡ RazorRescue — AI Revenue Recovery Command Center

> "An AI agent that finds where a merchant is losing money, understands why, and automatically takes the safest action to recover it."

## 🏗️ Architecture

```
razorrescue/
├── frontend/          # React + Vite + Tailwind + Framer Motion + Recharts
├── backend/           # Express + OpenRouter (12 AI models) + PostgreSQL
├── .github/workflows/ # CI/CD pipelines
└── render.yaml        # Render deployment config
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm

### Setup

```bash
# Clone
git clone https://github.com/lokigamer2911/RazorRescue.git
cd RazorRescue

# Install dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Start development
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

## 🔐 Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for AI models |
| `DATABASE_URL` | No | Neon.tech PostgreSQL connection string |
| `PORT` | No | Server port (default: 3001) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `NODE_ENV` | No | `development` or `production` |

### Frontend (Vercel env vars)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL (e.g., `https://razorrescue-api.onrender.com`) |
| `VITE_FIREBASE_*` | Yes | Firebase Auth keys (see `frontend/.env.example` + `FIREBASE_SETUP.md`) |

## 🌐 Deployment

### 1. Neon.tech (Database)
1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string

### 2. Render (Backend)
1. New Web Service → connect repo
2. Build: `cd backend && npm install`
3. Start: `cd backend && node src/index.js`
4. Add env vars: `OPENROUTER_API_KEY`, `DATABASE_URL`

### 3. Vercel (Frontend)
1. Import repo → Framework: Vite
2. Root dir: `frontend`
3. Add env var: `VITE_API_URL` → your Render URL

### 4. GitHub Secrets (for CI/CD)
| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `RENDER_DEPLOY_HOOK` | Render auto-deploy webhook URL |

## 🛡️ Security

- ✅ Rate limiting (60 req/min general, 10 req/min for AI)
- ✅ Input validation with schema enforcement
- ✅ CORS whitelist (no `origin: true`)
- ✅ Helmet security headers
- ✅ System prompt injection prevented (hardcoded, never from user)
- ✅ Request timeout on AI calls (30s)
- ✅ Error messages never leak internals
- ✅ .env files never committed
- ✅ CodeQL security scanning
- ✅ Dependency audit in CI
- ✅ Pre-commit secret detection

## 🤖 AI Engine

The backend consults frontier models through OpenRouter (the exact model pool is
configurable in `backend/src/services/openrouter.js`). Every model response is
passed through strict validation, rate limiting, and a fixed system prompt —
the agent can analyse and recommend, never move money.

## 📊 Features

- **Command Center** — Revenue at risk, breakdown, AI detections, animated charts
- **Investigation** — Root cause analysis, bank failure bars, affected customers
- **Recovery** — Campaign progress, autopilot policy (3 modes), safety permissions
- **AI Timeline** — Full activity log with live updates
- **Simulator** — Incident generator (5 types, 4 severity levels), What-If analysis
- **Settings** — Account (email, phone, verification), merchant profile, safety policies
- **AI Copilot** — Side panel with smart revenue queries
- **Auth** — Firebase login ecosystem: email/password, Google, phone OTP, forgot password, email verification (see `FIREBASE_SETUP.md`)

## 📄 License

MIT
