# ⚡ RazorRescue — AI Revenue Recovery Command Center

> "An AI agent that finds where a merchant is losing money, understands why, and prepares the safest recovery action — approved by you before anything moves."

RazorRescue connects to a merchant's **real Razorpay (or Stripe) account**, watches actual payments, finds where revenue is leaking, explains why with a multi-agent AI pipeline, and drafts safe recovery campaigns that the merchant must approve. **No demo data, no simulated analytics.**

📄 **Setup guides:** [`RAZORPAY_CONNECT.md`](RAZORPAY_CONNECT.md) (gateway runbook + pre-submission checklist) · [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) (auth) · [`AI_ARCHITECTURE.md`](AI_ARCHITECTURE.md) (agent pipeline)

## 🏗️ Architecture

```
razorrescue/
├── frontend/          # React + Vite + Tailwind + Framer Motion + Recharts
├── backend/           # Express + OpenRouter (:free models only) + PostgreSQL
├── .github/workflows/ # CI/CD pipelines
└── render.yaml        # Render deployment config
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/lokigamer2911/RazorRescue.git
cd RazorRescue

cd frontend && npm install && cd ..
cd backend && npm install && cd ..

cp .env.example .env          # backend env
cp frontend/.env.example frontend/.env   # Firebase keys (see FIREBASE_SETUP.md)

npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

## 🔐 Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter key — only `:free` endpoints are ever called (₹0) |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project id — verifies ID tokens on gateway routes |
| `DATABASE_URL` | No | Neon.tech PostgreSQL connection string |
| `GATEWAY_ENC_KEY` | No | Key for AES-256-GCM encryption of gateway credentials (derived from `DATABASE_URL` if unset) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS whitelist |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | `development` or `production` |

### Frontend (Vercel env vars)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL (e.g., `https://razorrescue.onrender.com`) |
| `VITE_FIREBASE_*` | Yes | Firebase Auth keys (see `frontend/.env.example` + `FIREBASE_SETUP.md`) |

## 🌐 Deployment

Live: **Frontend** → [razorrescue.vercel.app](https://razorrescue.vercel.app) · **Backend** → [razorrescue.onrender.com](https://razorrescue.onrender.com)

### 1. Neon.tech (Database)
1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string → `DATABASE_URL`

### 2. Render (Backend)
1. New Web Service → connect repo
2. Build: `cd backend && npm install`
3. Start: `cd backend && node src/index.js`
4. Env vars: `OPENROUTER_API_KEY`, `FIREBASE_PROJECT_ID`, `DATABASE_URL`

### 3. Vercel (Frontend)
1. Import repo → Framework: Vite
2. Root dir: `frontend`
3. Env var: `VITE_API_URL` → your Render URL

### 4. GitHub Secrets (for CI/CD)
| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `RENDER_DEPLOY_HOOK` | Render auto-deploy webhook URL |

## 🛡️ Security

- ✅ Gateway credentials **AES-256-GCM encrypted at rest** — never stored plain, never returned to the client
- ✅ **Read-only** payment access — no code path can charge, refund, or transfer money
- ✅ Firebase ID-token verification (RS256) on every gateway route
- ✅ Rate limiting (60 req/min general, 10 req/min for AI)
- ✅ Input validation with schema enforcement
- ✅ CORS whitelist (no `origin: true`)
- ✅ Helmet security headers
- ✅ System prompt injection prevented (hardcoded, never from user)
- ✅ Request timeout on AI calls (30s)
- ✅ Error messages never leak internals
- ✅ .env files never committed
- ✅ CodeQL security scanning, dependency audit, pre-commit secret detection

## 🤖 AI Engine (₹0 — zero spend)

A multi-agent pipeline (**Router → Pattern Detector → Risk Assessor → Recovery Planner → Chief Analyst**) runs on **OpenRouter `:free` endpoints only** — a hard code-level guard refuses any paid model unless `ALLOW_PAID_MODELS=true` is explicitly set. On rate-limit or failure it falls back to a deterministic engine that answers from the same real transaction data. Either way: instant, grounded, **zero cost**. Details: [`AI_ARCHITECTURE.md`](AI_ARCHITECTURE.md).

## 📊 Features

- **Gateway Connect** — Link your Razorpay/Stripe account (read-only, encrypted keys, live credential validation). Every analysis runs on your actual payments — never sample data. See [`RAZORPAY_CONNECT.md`](RAZORPAY_CONNECT.md)
- **Command Center** — Revenue at risk, bank breakdown, AI detections, animated charts — all derived from real synced data
- **Investigation** — Root cause analysis (bank × time × method), affected-customer list, AI confidence
- **Recovery** — Campaigns launch as honest running records (no simulated progress); autopilot policy (3 modes) + safety permissions
- **AI Timeline** — Full audit trail of every AI action
- **AI Copilot** — Grounded Q&A over your transaction snapshot (Router → Specialists → Chief Analyst)
- **Settings** — Account (email, phone, verification), gateway status (sync/disconnect), safety policies
- **Auth** — Firebase login ecosystem: email/password, Google, phone OTP, forgot password, email verification (see `FIREBASE_SETUP.md`)

## 📄 License

MIT