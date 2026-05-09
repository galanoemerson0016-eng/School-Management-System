// TODO: Replace with your actual Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBEw6c8Pwb7EZ53wKpDzUNYMwRVo0Nqc9Q",
  authDomain: "formease-licensing.firebaseapp.com",
  projectId: "formease-licensing",
  storageBucket: "formease-licensing.firebasestorage.app",
  messagingSenderId: "843018405317",
  appId: "1:843018405317:web:97e51e9b9e10ad67a377ac",
  measurementId: "G-7MESFXPTKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
