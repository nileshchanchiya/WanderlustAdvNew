import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import api, { formatApiError } from "@/lib/api";

const AuthContext = createContext(null);

/* ── Token helpers ── */
export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function AuthProvider({ children }) {
  // null = checking, false = unauthenticated, object = user
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("access_token", token);
          // Sync with backend to get full profile or create it
          const { data } = await api.get("/auth/me");
          setUser(data);
        } catch (err) {
          console.error("Error syncing user with backend:", err);
          setUser(false);
        }
      } else {
        localStorage.removeItem("access_token");
        setUser(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible' // or 'normal'
      });
    }
  };

  const loginWithPhone = async (phoneNumber, containerId) => {
    try {
      setupRecaptcha(containerId);
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const verifyOtp = async (otp) => {
    try {
      if (!window.confirmationResult) throw new Error("No pending OTP request.");
      await window.confirmationResult.confirm(otp);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("access_token");
      setUser(false);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const updateProfile = async (data) => {
    const { data: updated } = await api.put("/auth/profile", data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, loginWithPhone, verifyOtp, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
