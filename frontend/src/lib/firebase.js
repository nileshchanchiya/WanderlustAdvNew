import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDb15LhwjMUrFo979kLElJE4V9OLIgNGFw",
  authDomain: "wanderlust-adventure-81e8b.firebaseapp.com",
  projectId: "wanderlust-adventure-81e8b",
  storageBucket: "wanderlust-adventure-81e8b.firebasestorage.app",
  messagingSenderId: "1068322940960",
  appId: "1:1068322940960:web:a2f8209bf0556d5f513445",
  measurementId: "G-7V8GR1GQZ9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
