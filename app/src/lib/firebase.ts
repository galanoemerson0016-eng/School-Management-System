import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// NOTE: These credentials are intentionally embedded in the client bundle.
// Firebase API keys are NOT secrets — they identify the project but grant no
// privileged access. All access control is enforced exclusively by Firestore
// Security Rules (firestore.rules). Never rely on obscuring this key.
// See: https://firebase.google.com/docs/projects/api-keys
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBEw6c8Pwb7EZ53wKpDzUNYMwRVo0Nqc9Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "formease-licensing.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "formease-licensing",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "formease-licensing.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "843018405317",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:843018405317:web:97e51e9b9e10ad67a377ac",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7MESFXPTKD"
};

const app = initializeApp(FIREBASE_CONFIG);

// FORCE LONG POLLING: Critical for Electron/Local environments to avoid gRPC connection drops
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export default app;
