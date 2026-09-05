# ⚡ RazorRescue — AI Revenue Recovery Command Center

> An AI agent that finds where a merchant is losing money, understands why, and prepares the safest recovery action — approved by you before anything moves.

RazorRescue connects to a merchant's **real Razorpay (or Stripe) account**, watches actual payments, finds where revenue is leaking, explains why with a multi-agent AI pipeline, and drafts safe recovery campaigns that the merchant must approve. **No demo data, no simulated analytics — every number is computed from the merchant's real transactions.**

**Try it live:** [razorrescue.vercel.app](https://razorrescue.vercel.app) · [backend health](https://razorrescue.onrender.com/api/health)

## The problem

Every payment failure is revenue that silently leaks away — failed UPI attempts, bank outages, declined cards, checkout abandonments. Most merchants discover these leaks weeks later in a payout report, if at all. RazorRescue watches the payment stream in real time, pinpoints exactly where and why money is being lost, and quantifies what is recoverable.

## What it does

- **Monitor** — Watches every transaction and scores failure patterns the moment they appear: bank-level routing issues, time-of-day spikes, method-specific declines.
- **Investigate** — Traces each leak to its root cause across bank × time-of-day × payment-method dimensions, with a data-derived confidence score and the affected-customer list.
- **Recover** — Drafts a bounded recovery plan (alternate payment links, safe retries) that the merchant explicitly approves. The agent **cannot** move money, change amounts, or issue refunds — by design.

## Architecture

```
frontend/   React + Vite + Tailwind + Framer Motion + Recharts
backend/    Express + OpenRouter (:free models only) + PostgreSQL
```

- **Multi-agent AI pipeline** — Intent Router → Pattern Detector → Risk Assessor → Recovery Planner → Chief Analyst. Answers are grounded in the merchant's transaction snapshot (RAG), never invented. Runs on OpenRouter `:free` endpoints only — **zero AI cost**. See [`AI_ARCHITECTURE.md`](AI_ARCHITECTURE.md).
- **Secure gateway integration** — Razorpay/Stripe credentials validated live, encrypted at rest (AES-256-GCM), and used read-only. Nothing can charge, refund, or transfer money. See [`RAZORPAY_CONNECT.md`](RAZORPAY_CONNECT.md).
- **Complete auth ecosystem** — email/password, Google, phone OTP, forgot-password emails, new-account verification, and phone-linking to existing accounts. One account per email across all providers; passwords never stored by us. See [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md).
- **Measured, honest metrics** — an offline evaluation harness (`backend/scripts/evaluate.mjs`) scores the detection pipeline's precision / recall / accuracy / throughput on labeled test data; full results in [`AI_ARCHITECTURE.md`](AI_ARCHITECTURE.md).
- **Resiliency log** — the real production incidents we hit and how each was fixed are documented in [`RESILIENCE.md`](RESILIENCE.md).

## Quick start

Requires Node 20+ and [Bun](https://bun.sh) (the frontend lockfile is `bun.lock`).

```bash
# 1. Backend — API + multi-agent AI + PostgreSQL
cd backend
cp .env.example .env   # fill: DATABASE_URL (Neon), OPENROUTER_API_KEY, FIREBASE_PROJECT_ID
npm install && npm start   # serves http://localhost:3001

# 2. Frontend — React/Vite app (separate terminal)
cd frontend
cp .env.example .env   # fill: VITE_FIREBASE_* from Firebase Console → Project settings → Your apps
bun install && bun run dev   # serves http://localhost:5173, proxies /api → :3001
```

**Deployment:** `render.yaml` declares the backend service (with `FIREBASE_PROJECT_ID`, `DATABASE_URL` and `OPENROUTER_API_KEY` as environment slots); `frontend/vercel.json` rewrites `/api/*` to the Render backend, so the frontend needs no API URL at build time.

**Run the evaluation harness** (precision / recall / throughput on labeled test data):

```bash
cd backend && bun scripts/evaluate.mjs
```

**Run the unit test suite** (34 tests over the deterministic AI core — intent routing, grounding, PII stripping, validation):

```bash
cd backend && bun test
```

Both run in CI on every push.

## Features

- **Gateway Connect** — Link your Razorpay/Stripe account with live credential validation; keys encrypted at rest; fresh sync on demand.
- **Command Center** — Revenue at risk, bank-level breakdown, AI detections, animated charts — all derived from real synced data.
- **Investigation** — Root-cause analysis, bank failure bars, affected-customer list, AI confidence.
- **Recovery** — Campaigns launch as honest running records (no simulated progress); autopilot policy (Recommend / Assisted / Autopilot) with strict safety permissions.
- **AI Timeline** — Full audit trail of every AI action.
- **AI Copilot** — Grounded Q&A over your transaction snapshot (Router → Specialists → Chief Analyst).
- **Settings** — Account (email, phone, verification), gateway status (sync/disconnect), safety policies.

## Security by design

- ✅ Gateway credentials **AES-256-GCM encrypted at rest** — never stored plain, never returned to the client
- ✅ **Read-only** payment access — no code path can charge, refund, or transfer money
- ✅ Firebase ID-token verification (RS256) on every gateway route
- ✅ Recovery actions are bounded: no amount changes, no auto refunds, merchant approval required, full audit trail
- ✅ Passwords never stored — Firebase Auth handles hashing and tokens
- ✅ Rate limiting, input validation, CORS whitelist, Helmet headers, request timeouts
- ✅ Error messages never leak internals; `.env` files never committed
- ✅ CI: CodeQL security scanning, dependency audit, pre-commit secret detection

## License

MIT