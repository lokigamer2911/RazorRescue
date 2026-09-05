import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  updateProfile,
  signOut,
  onAuthStateChanged,
  reload,
} from 'firebase/auth';
import { auth, googleProvider, firebaseConfigured } from '../firebase';

const AuthContext = createContext(null);

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isPhone(value) {
  return /^\+?[0-9]{10,15}$/.test(value.trim().replace(/[\s\-()]/g, ''));
}

/** Normalise a phone number: bare Indian 10-digit → +91..., leading 0 → +91 */
export function normalizePhone(value) {
  let v = value.trim().replace(/[\s\-()]/g, '');
  if (/^[0-9]{10}$/.test(v) && /^[6-9]/.test(v)) return `+91${v}`;
  if (/^0[0-9]{10}$/.test(v)) return `+91${v.slice(1)}`;
  if (/^\+?[0-9]{10,15}$/.test(v)) return v.startsWith('+') ? v : `+${v}`;
  return v;
}

/**
 * Verification emails land back inside the app (?mode=verifyEmail&oobCode=…)
 * instead of a generic Firebase page, so the verify → dashboard loop completes
 * without leaving the product. Requires the current origin in Firebase's
 * authorized domains (localhost is pre-approved; add 127.0.0.1 for previews).
 */
function verificationActionCodeSettings() {
  if (typeof window === 'undefined') return undefined;
  return { url: `${window.location.origin}/`, handleCodeInApp: true };
}

const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/wrong-password': 'Incorrect password. Try again.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with this email. Create one first.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts — wait a minute and try again.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-verification-code': 'That code is incorrect. Check and try again.',
  'auth/invalid-phone-number': 'That phone number is invalid. Include the country code (e.g. +91).',
  'auth/missing-phone-number': 'Enter a phone number to receive the code.',
  'auth/quota-exceeded': 'SMS quota exceeded right now. Try again later.',
  'auth/account-exists-with-different-credential':
    'An account with this email already exists. Sign in with your password instead.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase (see FIREBASE_SETUP.md).',
  'auth/requires-recent-login': 'Please sign in again to make this change.',
  'auth/popup-blocked': 'The popup was blocked — allow popups for this site and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/argument-error': 'Phone sign-in could not start in this browser. Try the deployed site over https, or use email instead.',
  'auth/captcha-check-failed': 'Could not verify you are human — refresh the page and try again.',
  'auth/missing-recaptcha-token': 'Phone sign-in needs Google reCAPTCHA, which is blocked in this browser. Try email, or the deployed site over https.',
  'auth/missing-verification-code': 'Enter the code we sent you.',
};

/** Fall back to friendly copy for ANY unknown Firebase auth error — never leak raw SDK text. */
function isRawFirebaseMessage(message) {
  return /^Firebase: /.test(message || '');
}

export function friendlyAuthError(error) {
  const code = error?.code || '';
  const message = error?.message || '';
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (typeof code === 'string' && code.startsWith('auth/')) return 'Something went wrong. Please try again in a moment.';
  return isRawFirebaseMessage(message) ? 'Something went wrong. Please try again in a moment.' : message || 'Something went wrong. Try again.';
}

/** True when the user record was created in this exact sign-in (brand-new account). */
function isNewUser(user) {
  return !!user && user.metadata.creationTime === user.metadata.lastSignInTime;
}

/* ─── Provider ────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [newGooglePending, setNewGooglePending] = useState(false);
  // Bumped whenever the signed-in user is refreshed, so consumers re-render
  // against the SAME Firebase User instance (spreading a User strips its
  // methods — e.g. getIdToken — and white-screens the app).
  const [, setUserTick] = useState(0);
  const confirmationRef = useRef(null); // pending phone OTP confirmation

  useEffect(() => {
    if (!auth) {
      setInitializing(false);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  /** Force-refresh the current user (e.g. after clicking the verify link). */
  const refreshUser = useCallback(async () => {
    if (!auth?.currentUser) return null;
    await reload(auth.currentUser);
    setUser(auth.currentUser);
    setUserTick((t) => t + 1);
    return auth.currentUser;
  }, []);

  const requireAuth = useCallback(() => {
    if (!auth) throw new Error(friendlyAuthError({ code: 'auth/operation-not-allowed' }));
  }, []);

  const signUp = useCallback(async ({ email, password, name }) => {
    requireAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const u = credential.user;
    if (name?.trim()) await updateProfile(u, { displayName: name.trim() });
    await sendEmailVerification(u, verificationActionCodeSettings());
    return u;
  }, [requireAuth]);

  const login = useCallback(async ({ email, password }) => {
    requireAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }, [requireAuth]);

  const forgotPassword = useCallback(async (email) => {
    requireAuth();
    await sendPasswordResetEmail(auth, email);
  }, [requireAuth]);

  /** Update the signed-in user's display name (e.g. after phone signup). */
  const updateName = useCallback(async (name) => {
    if (!auth?.currentUser) return;
    if (name?.trim()) await updateProfile(auth.currentUser, { displayName: name.trim() });
  }, []);

  const resendVerification = useCallback(async () => {
    requireAuth();
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser, verificationActionCodeSettings());
  }, [requireAuth]);

  /**
   * Continue with Google. Never creates a duplicate account:
   *  - brand-new email → returns { status: 'new' } so the UI redirects to the
   *    create-account step to finish the profile;
   *  - email already used by a password account → returns { status: 'conflict', email };
   *  - existing account → returns { status: 'existing' }.
   */
  const continueWithGoogle = useCallback(async () => {
    try {
      requireAuth();
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      if (isNewUser(u)) {
        setNewGooglePending(true);
        return { status: 'new' };
      }
      return { status: 'existing' };
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') return { status: 'cancelled' };
      if (error.code === 'auth/account-exists-with-different-credential') {
        return { status: 'conflict', email: error.customData?.email || '' };
      }
      throw new Error(friendlyAuthError(error));
    }
  }, []);

  /** Finish creating the Google account: set the display name. */
  const completeGoogleProfile = useCallback(async (name) => {
    if (!auth?.currentUser) return;
    if (name?.trim()) await updateProfile(auth.currentUser, { displayName: name.trim() });
    setNewGooglePending(false);
  }, []);

  /* ── Phone OTP ── */

  const makeVerifier = useCallback((containerId) => {
    if (!auth) return null;
    const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    return verifier;
  }, []);

  /** Send an OTP to a phone number (logs in, or creates a phone account if new). */
  const sendOtp = useCallback(async (phone) => {
    const verifier = makeVerifier('phone-recaptcha');
    if (!verifier) throw new Error(friendlyAuthError({ code: 'auth/operation-not-allowed' }));
    confirmationRef.current = {
      verifier,
      confirmation: await signInWithPhoneNumber(auth, normalizePhone(phone), verifier),
    };
  }, [makeVerifier]);

  /** Verify the OTP for login / signup. Returns the signed-in user. */
  const confirmOtp = useCallback(async (code) => {
    const pending = confirmationRef.current;
    if (!pending) throw new Error('Send the code first.');
    const result = await pending.confirmation.confirm(code.trim());
    return result.user;
  }, []);

  /** Send an OTP to link a phone number to the currently signed-in account. */
  const sendLinkOtp = useCallback(async (phone) => {
    const verifier = makeVerifier('phone-recaptcha');
    if (!verifier) throw new Error(friendlyAuthError({ code: 'auth/operation-not-allowed' }));
    if (!auth?.currentUser) throw new Error('You need to be signed in first.');
    confirmationRef.current = {
      verifier,
      confirmation: await linkWithPhoneNumber(auth.currentUser, normalizePhone(phone), verifier),
    };
  }, [makeVerifier]);

  /** Verify the linking OTP — phone becomes a login method on the account. */
  const confirmLinkOtp = useCallback(async (code) => {
    const pending = confirmationRef.current;
    if (!pending) throw new Error('Send the code first.');
    const result = await pending.confirmation.confirm(code.trim());
    setUser(result.user);
    setUserTick((t) => t + 1);
    return result.user;
  }, []);

  /**
   * Runs when the app opens from an email-verification link
   * (?mode=verifyEmail&oobCode=…): confirms the code with Firebase, cleans the
   * URL, and refreshes the signed-in user so emailVerified flips to true.
   */
  const processVerificationLink = useCallback(async () => {
    if (!auth || typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') !== 'verifyEmail') return false;
    const code = params.get('oobCode');
    if (!code) return false;
    try {
      await applyActionCode(auth, code);
    } catch (error) {
      console.warn('applyActionCode failed:', error?.code || error?.message || error);
      return false;
    }
    window.history.replaceState({}, '', window.location.pathname);
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setUser(auth.currentUser);
      setUserTick((t) => t + 1);
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    confirmationRef.current = null;
    setNewGooglePending(false);
    if (auth) await signOut(auth);
  }, []);

  const value = {
    firebaseConfigured,
    user,
    initializing,
    newGooglePending,
    signUp,
    login,
    forgotPassword,
    resendVerification,
    updateName,
    continueWithGoogle,
    completeGoogleProfile,
    sendOtp,
    confirmOtp,
    sendLinkOtp,
    confirmLinkOtp,
    refreshUser,
    processVerificationLink,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}