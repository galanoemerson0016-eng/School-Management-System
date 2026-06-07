import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBEw6c8Pwb7EZ53wKpDzUNYMwRVo0Nqc9Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "formease-licensing.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "formease-licensing",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "formease-licensing.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "843018405317",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:843018405317:web:97e51e9b9e10ad67a377ac",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7MESFXPTKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
