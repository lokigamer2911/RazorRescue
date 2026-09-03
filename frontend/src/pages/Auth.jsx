import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightning, Envelope, DeviceMobile, ArrowLeft, ShieldCheck } from '@phosphor-icons/react';
import Spinner from '../components/Spinner';
import { useAuth, isEmail, isPhone, friendlyAuthError } from '../hooks/useAuth';

const inputCls =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13.5px] text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-400';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
  </svg>
);

export default function AuthPage({ initialMode = 'login', onSuccess, onBack }) {
  const auth = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'forgot'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isPhoneFlow = isPhone(identifier);
  const isEmailFlow = isEmail(identifier);

  /* Signed-in user routing: profile step → verify step → dashboard */
  useEffect(() => {
    if (!auth.user) return;
    if (auth.newGooglePending) return; // complete-profile step shows instead
    const passwordProvider = auth.user.providerData?.some((p) => p.providerId === 'password');
    if (passwordProvider && !auth.user.emailVerified) return; // verify step shows instead
    onSuccess();
  }, [auth.user, auth.newGooglePending, onSuccess]);

  const reset = (m) => {
    setError('');
    setNotice('');
    setOtpStep(false);
    setOtp('');
    setPassword('');
    setConfirm('');
    if (m) setMode(m);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!identifier.trim()) return setError('Enter your email or phone number.');

    /* Phone → OTP flow */
    if (isPhoneFlow) {
      setBusy(true);
      try {
        await auth.sendOtp(identifier);
        setOtpStep(true);
        setOtpSentTo(identifier.trim());
        setNotice(`Code sent to ${identifier.trim()}.`);
      } catch (err) {
        setError(friendlyAuthError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!isEmailFlow) return setError('That doesn’t look like a valid email or phone number.');

    /* Forgot password */
    if (mode === 'forgot') {
      setBusy(true);
      try {
        await auth.forgotPassword(identifier.trim());
        setNotice('Password reset email sent. Check your inbox (and spam).');
      } catch (err) {
        setError(friendlyAuthError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    /* Email signup */
    if (mode === 'signup') {
      if (password.length < 6) return setError('Password must be at least 6 characters.');
      if (password !== confirm) return setError('Passwords do not match.');
      setBusy(true);
      try {
        await auth.signUp({ email: identifier.trim(), password, name });
        setNotice('Account created! A verification email is on its way — verify it to continue.');
      } catch (err) {
        setError(friendlyAuthError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    /* Email login */
    setBusy(true);
    try {
      await auth.login({ email: identifier.trim(), password });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await auth.confirmOtp(otp);
      if (mode === 'signup' && name.trim()) await auth.updateName(name);
      if (u) onSuccess();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await auth.continueWithGoogle();
      if (res.status === 'conflict') {
        setMode('login');
        setIdentifier(res.email || identifier);
        setError('An account with this email already exists. Sign in with your password instead.');
      } else if (res.status === 'cancelled') {
        setError('Google sign-in was cancelled.');
      }
      /* 'new' → auth.newGooglePending becomes true; profile step renders. */
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  /* ── Step: new Google account → finish creating the account ── */
  if (auth.user && auth.newGooglePending) {
    return (
      <Shell onBack={onBack}>
        <Card onBack={onBack} wide>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-5">
            <ShieldCheck weight="fill" className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-[22px] font-bold tracking-tight mb-1">You’re almost in</h2>
          <p className="text-[13px] text-gray-500 mb-6">
            This Google account is new here — finish creating your RazorRescue account.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                await auth.completeGoogleProfile(name);
              } catch (err) {
                setError(friendlyAuthError(err));
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block font-medium">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ananya Sharma" className={inputCls} autoFocus />
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-xl flex items-center gap-3 border border-gray-100">
              <GoogleIcon />
              <div className="text-[12px] text-gray-600">
                Signed in with <span className="font-semibold text-gray-900">{auth.user.email || 'Google'}</span>
              </div>
            </div>
            {error && <ErrorBanner>{error}</ErrorBanner>}
            <button disabled={busy} className="w-full py-3 btn-primary !bg-gray-900 disabled:opacity-60 text-[13.5px]">
              {busy ? <Spinner className="w-4 h-4 mx-auto" /> : 'Create account →'}
            </button>
            <button type="button" onClick={auth.logout} className="w-full text-[12px] text-gray-400 hover:text-gray-600">
              Use a different account
            </button>
          </form>
        </Card>
      </Shell>
    );
  }

  /* ── Step: email verification required ── */
  if (auth.user && !auth.newGooglePending) {
    const needsVerify = auth.user.providerData?.some((p) => p.providerId === 'password') && !auth.user.emailVerified;
    if (needsVerify) {
      return (
        <Shell onBack={onBack}>
          <Card onBack={onBack} wide>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-5">
              <Envelope weight="fill" className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-[22px] font-bold tracking-tight mb-1">Verify your email</h2>
            <p className="text-[13px] text-gray-500 mb-6">
              We sent a verification link to <span className="font-semibold text-gray-900">{auth.user.email}</span>.
              Open it, then continue below. (Check spam too.)
            </p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await auth.resendVerification();
                    setNotice('Verification email sent again.');
                  } catch (err) {
                    setError(friendlyAuthError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
                className="w-full py-3 btn-secondary text-[13px] disabled:opacity-60"
              >
                {busy ? <Spinner className="w-4 h-4 mx-auto" /> : 'Resend verification email'}
              </button>
              <button
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await auth.refreshUser();
                  } catch (err) {
                    setError(friendlyAuthError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
                className="w-full py-3 btn-primary text-[13px] disabled:opacity-60"
              >
                I’ve verified — continue →
              </button>
              {error && <ErrorBanner>{error}</ErrorBanner>}
              {notice && <NoticeBanner>{notice}</NoticeBanner>}
              <button onClick={auth.logout} className="w-full text-[12px] text-gray-400 hover:text-gray-600">
                Sign out
              </button>
            </div>
          </Card>
        </Shell>
      );
    }
  }

  /* ── OTP step ── */
  if (otpStep) {
    return (
      <Shell onBack={onBack}>
        <Card onBack={onBack}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-5">
            <DeviceMobile weight="fill" className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-[22px] font-bold tracking-tight mb-1">Enter the code</h2>
          <p className="text-[13px] text-gray-500 mb-6">
            We texted a 6-digit code to <span className="font-semibold text-gray-900">{otpSentTo}</span>
          </p>
          <form onSubmit={verifyOtp} className="space-y-4">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              inputMode="numeric"
              autoFocus
              className={`${inputCls} !text-center !text-[20px] !tracking-[0.4em] font-mono`}
            />
            {error && <ErrorBanner>{error}</ErrorBanner>}
            {notice && <NoticeBanner>{notice}</NoticeBanner>}
            <button disabled={busy || otp.length < 6} className="w-full py-3 btn-primary text-[13.5px] disabled:opacity-50">
              {busy ? <Spinner className="w-4 h-4 mx-auto" /> : 'Verify & continue →'}
            </button>
            <div className="flex items-center justify-between text-[12px]">
              <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
                Change number
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await auth.sendOtp(otpSentTo);
                    setNotice('Code resent.');
                  } catch (err) {
                    setError(friendlyAuthError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
                className="text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        </Card>
      </Shell>
    );
  }

  /* ── Main form ── */
  return (
    <Shell onBack={onBack}>
      <Card onBack={onBack}>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
          <Lightning weight="fill" className="w-5 h-5 text-white" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            <h2 className="text-[22px] font-bold tracking-tight mb-1">
              {mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back'}
            </h2>
            <p className="text-[13px] text-gray-500 mb-6">
              {mode === 'signup'
                ? 'One account for your whole team. Free to start.'
                : mode === 'forgot'
                  ? 'Enter your email and we’ll send you a reset link.'
                  : 'Log in with your email or phone number.'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Mode tabs */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-6">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => reset(m)}
                className={`py-2 rounded-lg text-[12.5px] font-semibold transition-all ${mode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>
        )}

        {!auth.firebaseConfigured && (
          <div className="px-4 py-3 mb-5 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800 leading-relaxed">
            Firebase isn’t configured yet. Copy <code className="font-mono text-[11px]">frontend/.env.example</code> to{' '}
            <code className="font-mono text-[11px]">frontend/.env</code>, fill in your keys, and follow{' '}
            <span className="font-semibold">FIREBASE_SETUP.md</span> at the repo root.
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && !isPhoneFlow && (
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block font-medium">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ananya Sharma" className={inputCls} />
            </div>
          )}

          <div>
            <label className="text-[11px] text-gray-500 mb-1.5 block font-medium">Email or phone number</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@company.com or +91 98765 43210"
              className={inputCls}
              autoFocus
            />
            <p className="text-[10.5px] text-gray-400 mt-1.5">
              {isPhoneFlow ? 'We’ll text you a one-time code.' : isEmailFlow ? 'We’ll use your email for login & recovery.' : 'Use either — we’ll detect it automatically.'}
            </p>
          </div>

          {mode !== 'forgot' && !isPhoneFlow && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-gray-500 font-medium">Password</label>
                <button type="button" onClick={() => reset('forgot')} className="text-[11px] text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </button>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
            </div>
          )}

          {mode === 'signup' && !isPhoneFlow && (
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block font-medium">Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className={inputCls} />
            </div>
          )}

          {mode === 'forgot' && (
            <button type="button" onClick={() => reset('login')} className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <ArrowLeft weight="fill" className="w-3 h-3" /> Back to log in
            </button>
          )}

          {error && <ErrorBanner>{error}</ErrorBanner>}
          {notice && <NoticeBanner>{notice}</NoticeBanner>}

          <button disabled={busy} className="w-full py-3 btn-primary text-[13.5px] disabled:opacity-60">
            {busy ? (
              <Spinner className="w-4 h-4 mx-auto" />
            ) : mode === 'forgot' ? (
              'Send reset email'
            ) : isPhoneFlow ? (
              'Send code →'
            ) : mode === 'signup' ? (
              'Create account →'
            ) : (
              'Log in →'
            )}
          </button>
        </form>

        {/* Google */}
        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10.5px] text-gray-400 uppercase tracking-wider font-medium">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <button onClick={google} disabled={busy} className="w-full py-3 bg-white border border-gray-200 rounded-xl text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center disabled:opacity-60">
              <GoogleIcon />
              Continue with Google
            </button>
          </>
        )}

        {mode !== 'forgot' && (
          <p className="text-center text-[12px] text-gray-400 mt-6">
            {mode === 'signup' ? 'Already have an account? ' : 'New to RazorRescue? '}
            <button onClick={() => reset(mode === 'signup' ? 'login' : 'signup')} className="text-blue-600 font-semibold hover:text-blue-700">
              {mode === 'signup' ? 'Log in' : 'Create one free'}
            </button>
          </p>
        )}
      </Card>
    </Shell>
  );
}

/* ─── Shell / Card / banners ─── */

function Shell({ onBack, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-violet-50 relative overflow-hidden flex flex-col">
      {/* ambient blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] bg-violet-200/40 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-cyan-100/40 rounded-full blur-3xl" />

      <button onClick={onBack} className="relative z-10 self-start m-6 flex items-center gap-2 text-[12.5px] text-gray-500 hover:text-gray-800 transition-colors font-medium">
        <ArrowLeft weight="fill" className="w-4 h-4" /> Back to home
      </button>
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 pb-16">{children}</div>
      <p className="relative z-10 text-center text-[11px] text-gray-400 pb-6">
        Secured by Firebase Authentication · passwords are hashed, never stored in plaintext
      </p>
    </div>
  );
}

function Card({ children, wide = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full ${wide ? 'max-w-md' : 'max-w-[400px]'} bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-xl shadow-blue-100/50 p-8`}
    >
      {children}
    </motion.div>
  );
}

function ErrorBanner({ children }) {
  return (
    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-700 leading-relaxed">
      {children}
    </div>
  );
}

function NoticeBanner({ children }) {
  return (
    <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-700 leading-relaxed">
      {children}
    </div>
  );
}