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
Specialists run IN PARALLEL (Promise.all) — ZERO-SPEND POLICY:
all models are OpenRouter `:free` endpoints; no paid call ever fires
unless ALLOW_PAID_MODELS=true is deliberately set.
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ Pattern Detector        │ Risk Assessor           │ Recovery Planner        │
│ gemma-4-26b-a4b-it:free │ ling-3.0-flash-fin:free │ gemma-4-31b-it:free     │
│ worst banks by rate,    │ ₹ at risk, per-bank     │ eligible customers,     │
│ peak windows, methods,  │ severity, top-3         │ recoverable range,      │
│ reasons                 │ concentration           │ safe actions            │
└──────────────┬──────────┴────────────┬────────────┴────────────┬────────────┘
               ▼                       ▼                         ▼
        outputs → fed to Chief Analyst (gemma-4-31b-it:free)
               ▼
     Unified final answer + pipeline trace + confidence

If every free endpoint is rate-limited/unavailable, the affected agent
answers from its deterministic engine (instant, zero cost, still grounded).
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

## Why this stack (system design reasoning)

- **In-memory RAG context store instead of a vector database.** The merchant's
  dataset is small (≤ 1,000 synced payments, pushed as aggregates — customer PII
  stripped) and retrieval is exact, not semantic. A vector store would add
  latency and non-determinism with zero accuracy gain for finance-grounded
  answers; the snapshot store guarantees the exact numbers on the dashboard are
  the exact numbers in every AI answer.
- **Multi-agent orchestration instead of one mega-prompt.** Separation of
  concerns (pattern → risk → recovery), parallel specialist execution, and a
  chief analyst that cross-checks specialist outputs before synthesising. Each
  agent has one job and hard grounding rules, which is easier to audit, prompt-
  maintain and test than a single giant prompt.
- **OpenRouter over a single provider.** One integration, many `:free`
  endpoints, per-agent fallback chains, so rate limits degrade to the next free
  model or the deterministic engine — never to a paid call (hard guard
  `isModelSpendFree`).
- **Deterministic engines as the resilience layer.** If every free endpoint is
  rate-limited or unavailable, the same agent computes its answer from the
  snapshot directly (`mode: engine`). Zero cost, instant, and provably grounded:
  every number is recomputable from the raw data.
- **Express + Neon (PostgreSQL) + Firebase Auth.** The backend stays small and
  auditable (helmet, cors, rate-limit, zod, pg only); Neon is a managed Postgres
  for campaign/audit records; Firebase owns identities so no password ever
  touches our database.

## Evaluation & honest metrics

`backend/scripts/evaluate.mjs` runs the exact production pipeline
(`analyseTransactions → deriveFacts`) over labeled test fixtures — 12 injected
outage patterns + 8 clean datasets, 5,000 transactions each, deterministic seed —
and reports (reproduce with `bun scripts/evaluate.mjs`):

| Metric | Result |
|---|---|
| Pattern-detection precision | 84.6% |
| Pattern-detection recall | 91.7% |
| F1 | 0.88 |
| Bank match rate (injected bank surfaced as worst) | 100% |
| Mean peak-window error | 0.82 h |
| False-positive rate on clean data | 25% |
| Grounding mismatches vs raw data | 0 — derived numbers always equal independent recomputation |
| Throughput | 0.7 ms per 5k transactions; 4.7 ms per 100k |

The false positives on clean data are the honest cost of sensitivity: a bank
with a small sample can randomly exceed the ELEVATED threshold. That is exactly
why the agent never auto-acts — every flagged bank is routed to the exception
list below.

### Unit tests

The deterministic core is covered by 34 unit tests (`backend/test/core.test.mjs`, run with `bun test`):

- **Zero-spend policy** — every roster model and fallback is asserted `:free`;
  paid models are refused unless deliberately enabled.
- **Intent routing & agent planning** — each question class maps to the right
  specialist set.
- **Grounding integrity** — `renderDataset` cites only snapshot numbers; the
  deterministic engines never emit figures absent from `deriveFacts`; empty
  snapshots produce honest "no data" answers, never invented metrics.
- **PII stripping** — customer identifiers never survive snapshot
  normalization; values are clamped to sane bounds.
- **Input validation** — XSS/HTML stripping, required fields, length caps,
  number/enum bounds, and gateway provider whitelist.

These run in CI on every push (`bun test`), so a regression in the AI core
fails the build before it can reach production.

## Exception list policy

When the agent is uncertain it does not guess; it lists the exception and sends
it to human review (surfaced in the UI as “Edge Cases — Flagged for Human
Review”):

1. **Insufficient sample** — a flagged bank with fewer than 30 transactions:
   attribution unreliable, hold before targeting recovery.
2. **No peak clarity** — failures spread across the day (peak share < 30%):
   recommend a broad retry policy, not a timed campaign.
3. **Unknown decline codes** — reason strings outside the taxonomy: no
   automated recovery can be attached; escalate to taxonomy/PSP investigation.
4. **Low confidence** — derived confidence below 70%: no automated recovery
   plan is drafted.

All rules are deterministic and derived from the real snapshot — the app never
fabricates an exception to fill space.
