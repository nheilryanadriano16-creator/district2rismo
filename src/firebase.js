import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBChss7Q_z6pxEfCQB6Z4clIsweeJb0Ohw",
  authDomain: "rismo-9c0ce.firebaseapp.com",
  projectId: "rismo-9c0ce",
  storageBucket: "rismo-9c0ce.firebasestorage.app",
  messagingSenderId: "217298539300",
  appId: "1:217298539300:web:7b81ee2d8bfb861a9f59b1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);