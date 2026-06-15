import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDO2YRWYqZMJpPmlfHyBjv9ZrRixnRpRFI",
  authDomain: "mi-pos-9f6e9.firebaseapp.com",
  projectId: "mi-pos-9f6e9",
  storageBucket: "mi-pos-9f6e9.firebasestorage.app",
  messagingSenderId: "123196608846",
  appId: "1:123196608846:web:11dcc8def63ffacf640e1f",
  measurementId: "G-EZ7GRKZ2MN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
