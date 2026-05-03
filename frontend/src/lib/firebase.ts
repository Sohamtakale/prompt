import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcBbXfH3ifyTkBfDa0k4Dtkh0schIlrgw",
  authDomain: "promptwars-495017.firebaseapp.com",
  projectId: "promptwars-495017",
  storageBucket: "promptwars-495017.firebasestorage.app",
  messagingSenderId: "870341326747",
  appId: "1:870341326747:web:3bd3c2490902a14286d33e",
  measurementId: "G-CXQJMJ9FM1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
