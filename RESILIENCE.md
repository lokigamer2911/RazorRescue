# RazorRescue — Resiliency Log ("What broke at 2 AM")

Production incidents we actually hit while building RazorRescue, their root
causes, and the fixes that shipped. Every entry is real — nothing here is
invented for show.

## 1. "Unauthorized — invalid session" on every authenticated call (production)

- **Symptom:** login worked on the frontend, but every dashboard / gateway
  request returned `401 Unauthorized — invalid session`.
- **Root cause:** the backend verifies Firebase ID tokens (issuer + audience +
  signature) but needs `FIREBASE_PROJECT_ID` to check the token's audience. The
  variable was missing from the deployed backend environment, so every valid
  token was rejected — even though the user was logged in.
- **Fix:** added `FIREBASE_PROJECT_ID` to the Render environment. Verified by
  minting a real token against the Firebase project and probing the deployed
  backend: `200 {"connected":false}`.
- **Prevention:** `render.yaml` now declares the variable as a required
  environment slot, so a fresh deploy always creates it.

## 2. Production bundle silently calling `localhost:3001`

- **Symptom:** the deployed site loaded fine, but every API call silently
  failed in the browser — each visitor's request went to *their own machine*.
- **Root cause:** a Vite `define` baked `http://localhost:3001` as the API base
  into production builds whenever the env var was unset — a local-dev fallback
  that should never have applied to prod.
- **Fix:** removed the `define`. The frontend now calls same-origin `/api/*`,
  and `vercel.json` rewrites those to the Render backend. Verified by
  rebuilding with no env vars and diffing the bundle: zero `localhost` strings.
- **Prevention:** production builds are now environment-independent.

## 3. OpenRouter free models rate-limited → still answers, still zero cost

- **Symptom:** free `:free` endpoints intermittently rate-limit under load; a
  single-model pipeline would have returned errors and empty answers.
- **Root cause:** shared free-tier endpoints are throttled by the provider.
- **Fix:** multi-model orchestration with per-agent fallback chains (all
  `:free`), plus a deterministic engine that computes the same data-derived
  answer instantly (`mode: engine`) when every free attempt fails. The Copilot
  reports which mode ran, and a hard guard (`isModelSpendFree`) refuses any
  paid model.
- **Prevention:** the grounding checks in `scripts/evaluate.mjs` assert that
  engine-mode answers never contradict the raw data.

## 4. Fake Razorpay keys accepted until they exploded later

- **Symptom:** the connect screen accepted any key-like string and failed later
  with confusing, opaque errors.
- **Root cause:** credentials were stored without live validation.
- **Fix:** credentials are now validated live against Razorpay's API before
  anything is saved; invalid pairs return a clear, friendly error. Stored
  credentials are AES-256-GCM encrypted at rest and never returned to the
  client.

## 5. Render free-tier cold starts ("no-server")

- **Symptom:** after idle periods the backend briefly returns `404` with
  `x-render-routing: no-server` until an instance spins up.
- **Root cause:** free-tier services scale to zero after inactivity.
- **Fix:** `/api/health` for liveness checks; the frontend degrades gracefully
  (shows an empty state instead of crashing) when the backend is unreachable.

## 6. Cross-account access via a guessed uid (pre-submission security audit)

- **Symptom:** a caller could read another merchant's analysis snapshot or run
  an AI query over their payment data just by sending that user's id in the
  request body or URL. The RAG context and AI query routes had no auth and
  keyed their in-memory store on a **client-supplied** `sessionId`; the
  database routes (`/stats`, `/audit`, `/incidents`, `/campaigns`,
  `/actions`) were unauthenticated **and** all defaulted to one shared
  merchant row.
- **Root cause:** convenience over isolation — the storage key was taken from
  the request instead of from the verified session, and the merchant schema
  predated multi-user support (hardcoded `merchantId = 1`).
- **Fix:** every data route now sits behind `requireAuth`, and the storage key
  is derived **only** from the verified Firebase uid (`req.user.uid`) — any
  client-supplied `sessionId` or URL id is ignored, so guessing another user's
  uid cannot reach their data. Merchants are now per-user
  (`getOrCreateMerchantId(uid)`); the shared seed row was removed. Verified:
  unauthenticated calls to `/api/agent/context`, `/api/agent/query`, and
  `/api/stats` all return `401` on the deployed backend.
- **Prevention:** 5 dedicated security tests (`backend/test/security-scope.test.mjs`,
  part of `bun test` in CI) assert that missing/invalid sessions are rejected
  and that every DB function requires an explicit user id — so the isolation
  contract can't silently regress.

## How we keep it honest

- `backend/scripts/evaluate.mjs` — precision / recall / accuracy / throughput
  of the detection pipeline on labeled test data (deterministic seed, exact
  production functions).
- `backend/test/*.test.mjs` — 39 unit tests covering the deterministic AI
  core (intent routing, grounding, PII stripping, validation) **and** the
  per-user security contract (401 on missing/invalid sessions, uid-keyed
  storage, no shared merchant default).
- GitHub Actions CI — backend `npm ci` + dependency audit + syntax checks +
  `bun test`, frontend `bun install --frozen-lockfile` + audit + production
  build, a secret scan that matches real key formats only, and CodeQL
  analysis.