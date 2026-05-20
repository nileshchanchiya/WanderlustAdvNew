import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile as fbUpdateProfile, sendEmailVerification } from "firebase/auth";
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
        // For email/password users, check if email is verified
        const isEmailProvider = firebaseUser.providerData.some(p => p.providerId === "password");
        if (isEmailProvider && !firebaseUser.emailVerified) {
          // User signed up with email but hasn't verified yet
          setUser({ _pendingVerification: true, email: firebaseUser.email });
          return;
        }
        try {
          const token = await firebaseUser.getIdToken(true);
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

  const loginWithPhone = async (phoneNumber, containerId) => {
    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      
      const appVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible'
      });
      
      // Render the verifier before using it
      await appVerifier.render();
      window.recaptchaVerifier = appVerifier;

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

  const signupWithEmail = async (email, password, name) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await fbUpdateProfile(cred.user, { displayName: name });
      }
      await sendEmailVerification(cred.user);
      return { ok: true, pendingVerification: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const resendVerification = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user signed in.");
      await sendEmailVerification(currentUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const checkEmailVerified = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user signed in.");
      await currentUser.reload();
      if (currentUser.emailVerified) {
        const token = await currentUser.getIdToken(true);
        localStorage.setItem("access_token", token);
        const { data } = await api.get("/auth/me");
        setUser(data);
        return { ok: true };
      }
      return { ok: false, error: "Email not yet verified." };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const updateProfile = async (data) => {
    const { data: updated } = await api.put("/auth/profile", data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, loginWithPhone, loginWithEmail, signupWithEmail, verifyOtp, logout, updateProfile, resendVerification, checkEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
