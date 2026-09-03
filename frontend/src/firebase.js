import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Firebase is configured entirely through environment variables —
 * no keys are hardcoded or committed. Copy `frontend/.env.example`
 * to `frontend/.env` and fill in the values from your Firebase project
 * (see FIREBASE_SETUP.md at the repo root).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    ? { storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET }
    : {}),
  ...(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    ? { messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID }
    : {}),
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

export const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();