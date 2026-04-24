import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCku-NRvUUndk594f4wYTvXb3r0RhRNoSA",
  authDomain: "formease-app-a3e68.firebaseapp.com",
  projectId: "formease-app-a3e68",
  storageBucket: "formease-app-a3e68.firebasestorage.app",
  messagingSenderId: "650211591596",
  appId: "1:650211591596:web:1d903254152e993d2fa609",
  measurementId: "G-WLMXG9D24C"
};

const app = initializeApp(FIREBASE_CONFIG);

// FORCE LONG POLLING: Critical for Electron/Local environments to avoid gRPC connection drops
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export default app;
