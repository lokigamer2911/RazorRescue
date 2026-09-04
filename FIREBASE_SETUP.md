# RazorRescue Authentication

RazorRescue's entire login ecosystem is powered by **Firebase Authentication**.
Passwords are **never stored in our database** — there is no user table and no
password ever touches our backend. Firebase hashes credentials server-side and
hands the app a signed ID token, which the backend verifies (RS256) on every
protected route.

## What the auth ecosystem covers

- **Email / password** — signup, login, forgot-password emails, and new-account
  verification emails (Firebase sends both automatically).
- **Google** — one-tap "Continue with Google" sign-in.
- **Phone OTP** — login with a phone number via SMS verification.
- **One account per email** — enforced by Firebase across every provider, so the
  same email can never create a second account through a different sign-in path.
  On top of that, the app routes edge cases cleanly:
  - Google sign-in on an email that already has a password account → the user is
    directed to log in with their password (email prefilled).
  - Google sign-in with a brand-new email → the user is taken to the **create
    account** step to finish their profile.
- **Verification gating** — unverified email/password accounts are blocked from
  the dashboard until verified (with a resend button).
- **Phone linking** — an existing account can link a phone number in Settings and
  then log in with an OTP instead of a password.

## Security posture

- No user table, no password storage — Firebase handles hashing and tokens.
- Every gateway/API route verifies the Firebase ID token (issuer, audience,
  signature, expiry) before responding.
- Nothing sensitive ever returns to the client beyond the standard Firebase
  session; payment-gateway credentials are encrypted separately (see
  [`RAZORPAY_CONNECT.md`](RAZORPAY_CONNECT.md)).