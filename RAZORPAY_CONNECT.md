# Payment Gateway Integration

RazorRescue analyzes a merchant's **real payments** by connecting directly to
their **Razorpay** (or **Stripe**) account. The integration is read-only by
design and is the foundation of every number in the product — there is no sample
data anywhere in the app.

## How it works

1. **Connect** — After login, the merchant enters their Razorpay **Key ID** and
   **Key Secret**. The credentials are validated live against Razorpay's API
   before anything is saved — invalid keys are rejected with a clear error.
2. **Encrypt at rest** — Valid credentials are encrypted with **AES-256-GCM**
   before storage. They are never stored in plain text and never returned to the
   client; the dashboard only ever sees a masked key id.
3. **Sync** — Real payments are pulled (paginated, up to 1,000 latest) and
   normalized: UPI VPA → bank mapping, paise → ₹, failure reasons, method and
   hour attribution.
4. **Analyze** — The same production analysis that powers the dashboard runs on
   the synced payments, and the snapshot is pushed into the AI's per-merchant
   RAG store. Every Copilot answer and every chart is grounded on this data.

## What the integration can and cannot do

| Capability | Status |
|---|---|
| List recent payments (read-only) | ✅ |
| Validate credentials live | ✅ |
| Encrypt credentials at rest (AES-256-GCM) | ✅ |
| Analyze failures (bank, hour, method, reason) | ✅ |
| Ground the AI's RAG store on real snapshots | ✅ |
| Charge, refund, transfer, or modify anything | ❌ never — no such code path exists |

## Security

- Credentials: AES-256-GCM encrypted at rest; key from `GATEWAY_ENC_KEY` or
  derived from the database connection string.
- Every gateway route requires a verified Firebase ID token (RS256).
- The agent's recovery actions are bounded: it drafts plans and waits for
  merchant approval. It cannot move money, change amounts, or issue refunds.
- Disconnect removes the saved credentials from the database entirely.