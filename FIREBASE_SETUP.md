# Firebase Setup Guide — RazorRescue Auth

RazorRescue uses **Firebase Authentication** for the entire login ecosystem.
Passwords are **never stored in our database** (there is no user table, and no
password ever touches the backend) — Firebase hashes them server-side with
scrypt before storage, and only ever hands our app back an ID token.

This guide walks you through enabling everything in the Firebase Console.

---

## 1. Create the project

1. Go to <https://console.firebase.google.com> → **Add project** (any name, e.g. `razorrescue`).
   Google Analytics is optional — you can skip it.
2. Once created, open the project.

## 2. Register the web app

1. In **Project settings → Your apps**, click the **`</>` (Web)** icon.
2. Give it a nickname (e.g. `razorrescue-web`), click **Register app**.
3. Firebase shows an SDK snippet — copy these five values:

   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`
   - (optional) `storageBucket`, `messagingSenderId`

4. Put them in `frontend/.env` (copy `frontend/.env.example` first):

   ```bash
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=razorrescue.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=razorrescue
   VITE_FIREBASE_APP_ID=1:1234567890:web:abc
   ```

   `frontend/.env` is gitignored — never commit it.

## 3. Enable sign-in providers

**Authentication → Sign-in method**, then enable:

| Provider | What to enable / configure |
|---|---|
| **Email/Password** | Turn on. This powers email login, signup, forgot-password emails and new-account verification emails. |
| **Google** | Turn on, choose a support email, click Save. This powers “Continue with Google”. |
| **Phone** | Turn on. Phone login is verified via SMS OTP with an invisible reCAPTCHA. Note: Firebase phone auth requires a paid Blaze billing plan for production SMS — localhost/dev works on the free Spark plan. |

Under **Authorized domains**, add your deployed domain (e.g. `https://your-app.com`);
`localhost` and your preview domains are added automatically when used.

## 4. Email templates (optional but recommended)

**Authentication → Templates**:
- **Password reset** — edit the sender name/logo. Emails are sent by Firebase
  automatically when a user clicks “Forgot password”.
- **Email verification** — edit the sender name/logo. Sent automatically when a
  new account is created. Keep the default `actionCodeSettings` redirect (or set
  one in `useAuth.jsx`).

## 5. What the code already does (no extra work needed)

- **One account per email** — enforced by Firebase itself: an email can only be
  registered once across all providers. On top of that, `useAuth.jsx` routes
  duplicates:
  - “Continue with Google” on an email that already has a password account →
    the user is told to log in with their password (prefilled).
  - “Continue with Google” with a brand-new email → redirects to the **create
    account** step to finish their profile.
- **New-account verification email** — sent automatically on signup; unverified
  email/password users are blocked from the dashboard until they verify
  (with a resend button).
- **Forgot password** — sends Firebase’s password-reset email.
- **Phone login** — OTP via SMS (auto-detected when the identifier is a phone
  number). Brand-new phone numbers create an account; existing ones log in.
- **Connect phone to an existing account** — Settings → Account → “Link phone”.
- **Secure storage** — Firebase Auth stores credentials; nothing is stored in
  our PostgreSQL database, and passwords are never stored in plaintext.

## 6. Verify it end-to-end

1. `npm run dev` in `frontend/` (or `bun run dev`).
2. Open the landing page → **Sign up** → create an account → check your inbox
   for the verification email → verify → you land in the dashboard.
3. Try **Forgot password** → reset email arrives.
4. Try **Continue with Google** with a brand-new email → you’re taken to the
   create-account step. With an email that already exists → you’re sent to
   login with a clear message.
5. Log in with a phone number → OTP arrives → you’re in. Then link that phone
   to a separate email account in Settings and confirm only one account exists.