# RazorRescue AI Architecture — RAG-grounded Multi-Agent Network

RazorRescue is a revenue-recovery agent for Razorpay merchants. Its AI answers are
**grounded in the merchant's actual transaction snapshot** and are produced by a
**multi-agent pipeline**: an intent router, specialist agents, and a chief analyst.
Every number a user sees — in the dashboard or in an AI answer — is computed from
the same underlying dataset, never invented.

## The problem it solves

Naive chat products let an LLM "hallucinate" metrics (e.g. "₹62,400 at risk")
that do not match the data on screen. For a revenue-recovery product used by
business users, that is disqualifying. RazorRescue instead treats AI as an
**orchestrator over deterministic, data-derived facts**.

## Data flow (RAG grounding)

```
Dashboard (useAppState)
   │  one consistent dataset: 10k transactions → analyseTransactions()
   ▼
Snapshot pushed (debounced) ──POST /api/agent/context──► contextStore (in-memory RAG)
   │  { merchant, analysis{byBank, byHour, byMethod, topFailed(no PII)},
   │    incidents }                                        │
   └─ UI renders from deriveInsights(analysis)             ▼
        (same math as the server)                renderDataset(snapshot) → deterministic DATA block
```

- The frontend and the backend share **identical derivation math**
  (`frontend/src/utils/insights.js` ⇄ `backend/src/services/contextStore.js`),
  so the numbers in the UI, in offline fallbacks, and in every AI answer agree
  to the rupee.
- Customer PII is stripped before the snapshot leaves the browser; the backend
  keeps only aggregates plus a tiny reason-code sample.

## The agent pipeline (backend/src/services/orchestrator.js)

```
User question
   │
   ▼
┌──────────────────┐   deterministic, zero-cost   ┌──────────────────┐
│  Intent Router   │ ────────────────────────────► │  classifyIntent  │
│  (classifyIntent)│   investigate|risk|recovery  │                  │
└──────────────────┘   |patterns|summary|general  └──────────────────┘
   │  planAgents(intent)
   ▼
Specialists run IN PARALLEL (Promise.all)
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ Pattern Detector        │ Risk Assessor           │ Recovery Planner        │
│ openai/gpt-4o-mini      │ claude-haiku-3.5        │ claude-sonnet-4         │
│ worst banks by rate,    │ ₹ at risk, per-bank     │ eligible customers,     │
│ peak windows, methods,  │ severity, top-3         │ recoverable range,      │
│ reasons                 │ concentration           │ safe actions            │
└──────────────┬──────────┴────────────┬────────────┴────────────┬────────────┘
               ▼                       ▼                         ▼
        outputs → fed to Chief Analyst (claude-sonnet-4)
               ▼
     Unified final answer + pipeline trace + confidence
```

### Hard rules every agent prompt enforces
1. Never invent, estimate or round numbers that are not in the DATA SNAPSHOT.
2. Every figure must be traceable to DATA.
3. No fabricated banks, timelines or causes — report only what DATA shows.
4. If no data is loaded, answer honestly and suggest connecting data.
5. Financial actions stay LOW risk: no amount changes, no auto refunds,
   merchant approval required, full audit trail.

### Resilience (never a silent fake)
- **Key present** → each agent runs its real LLM with the DATA block.
- **No key / LLM error / timeout** → the same agent runs its **deterministic
  engine**, computing the answer from the snapshot directly.
- The result always reports `mode: live | engine | mixed` and a `pipeline[]`
  trace, surfaced in the Copilot UI ("GROUNDED", agent chips, model names).
- Demo/text fallbacks that previously *fabricated* metrics were removed from
  both the backend and the frontend.

## Number hygiene across the app
- `estimatedRecovery`, `confidence`, `eligible customers`, `expected recovery`
  ranges and the seed/replay timelines are all **derived** from the live
  analysis via `deriveInsights()` — no static ₹ figures anywhere.
- A single dataset is used everywhere: `analysis` is always computed from the
  same `transactions` array.

## API surface
| Endpoint | Purpose |
|---|---|
| `POST /api/agent/context` | Dashboard pushes its analysis snapshot (RAG store). |
| `GET /api/agent/context` | Snapshot summary for the grounding indicator. |
| `POST /api/agent/query` | Multi-agent orchestrated answer + pipeline trace. |
| `POST /api/agent/consult` | Legacy alias routed through the same orchestrator. |
| `GET /api/agent/models` | Agent roster with capabilities. |

## Running it
- Backend: `cd backend && node src/index.js` (needs `OPENROUTER_API_KEY` for
  live LLM agents; without it the deterministic engines answer from data).
- Frontend: `cd frontend && npm run dev` (dashboard auto-pushes snapshots).
