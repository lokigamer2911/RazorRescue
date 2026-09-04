# 🔌 Razorpay Account Connection — Merchant Runbook

How a merchant connects their live Razorpay account so RazorRescue analyses **real payments** — never sample data — and how to prepare for the buildathon demo.

---

## 1. What the merchant needs (5 minutes)

1. **Sign in** to RazorRescue (email/password, Google, or phone OTP).
2. You land on **"Connect your payment gateway"** (shown once after login).
3. Choose **Razorpay** (recommended) or Stripe.
4. Paste your **Key ID** and **Key Secret** from the Razorpay Dashboard:
   - Razorpay Dashboard → **Settings → API Keys** → Generate/R reveal keys.
   - Use **Test Mode** keys first (no real charges), **Live Mode** keys when ready.
5. Click **Connect**. The app calls Razorpay's API **immediately** to validate the keys against a real merchant account:
   - Wrong/expired keys → friendly error, nothing saved.
   - Valid keys → credentials are **AES-256-GCM encrypted at rest** (never stored plain), and a **read-only** fetch of your latest payments begins.

## 2. What the app does with the keys

| Capability | Allowed |
|---|---|
| List recent payments (`/v1/payments`, paginated up to 1,000) | ✅ read-only |
| Encrypt keys at rest (AES-256-GCM, key = `GATEWAY_ENC_KEY` or derived from `DATABASE_URL`) | ✅ |
| Analyse failures (UPI VPA → bank, paise → ₹, failure reasons) | ✅ |
| Ground the AI's RAG store on your real transaction snapshot | ✅ |
| Charge, refund, transfer, modify orders | ❌ never — no such code path exists |

**Nothing in the codebase can move money.** The Recovery page only drafts plans that the **merchant must approve**, and the campaign stays at `0 contacted / ₹0 recovered` until a real execution engine reports deliveries.

## 3. The full flow after connecting

```
Connect → validate live → store encrypted → dashboard loads
  → Sync now (pull real payments, paginated)
  → Analyse (production analyseTransactions)
  → Push snapshot to per-user RAG store
  → Ask the Copilot → Router → Specialists → Chief Analyst
    (free OpenRouter models only; falls back to deterministic engine — ₹0 either way)
```

- **"Sync now"** (Command Center or Settings) re-pulls the latest payments and refreshes every number on the dashboard.
- **Disconnect** wipes the saved credentials from the database.

## 4. Environment variables (already set or needed)

| Where | Variable | Value |
|---|---|---|
| Render (backend) | `FIREBASE_PROJECT_ID` | `razorrescue-896a7` ✅ set |
| Render (backend) | `DATABASE_URL` | Neon Postgres ✅ set |
| Render (backend) | `GATEWAY_ENC_KEY` | optional — any long random string; falls back to `DATABASE_URL`-derived key |
| Render (backend) | `OPENROUTER_API_KEY` | ✅ set — only `:free` endpoints are ever called |
| Vercel (frontend) | `VITE_API_URL` | `https://razorrescue.onrender.com` |

## 5. Pre-submission checklist

- [ ] Live site boots on Vercel (`razorrescue.vercel.app`) → landing page renders, animations play.
- [ ] Sign up with a **new email** → verification email arrives → verify → dashboard gate shows "Connect your payment gateway".
- [ ] Google sign-in with a **new account** → redirected to create-account (never silently duplicates an email).
- [ ] Connect flow: paste a **fake key** → friendly error. Paste **real test keys** → success → dashboard shows real numbers.
- [ ] Command Center numbers match the Razorpay Dashboard's own payment list (spot-check 3 numbers).
- [ ] Copilot: ask "Draft a recovery plan" → **GROUNDED** badge + specialist chips + figures identical to the dashboard.
- [ ] Recovery: Launch campaign → status RUNNING at 0/0/₹0/0% ("awaiting execution") — no fake progress bars.
- [ ] AI Timeline shows the audit trail of this session's actions (anomaly → investigation → strategy → approval requested).
- [ ] Settings: Sync now refreshes "Last synced"; Disconnect returns you to the connect screen.
- [ ] Phone OTP login works (reCAPTCHA container present); linking a phone to an existing account works.
- [ ] No demo/simulated analytics anywhere post-login (the only simulated data lives in `frontend/src/utils/simulation.js` as dead code — nothing imports the generator).

## 6. Demo-day tips (judges)

- **Tell the story:** "watch payments → find the leak → explain why → recover with approval."
- Have **two browser profiles ready**: one with a connected gateway (real data), one fresh to demo signup → connect in 60 seconds.
- The zero-spend guarantee is a strong talking point: every AI call is a `:free` OpenRouter model or the built-in engine — the product costs ₹0 to run.
- If the free pool is rate-limited, answers come from the deterministic engine — same numbers, instant, and still grounded (the UI shows exactly which agents ran).