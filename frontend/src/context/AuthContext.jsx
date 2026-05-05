import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "@/lib/api";

const AuthContext = createContext(null);

/* ── Token helpers ── */
function saveTokens(access, refresh) {
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function AuthProvider({ children }) {
  // null = checking, false = unauthenticated, object = user
  const [user, setUser] = useState(null);

  const checkSession = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      // Save tokens from response body (works even when cookies are blocked)
      saveTokens(data.access_token, data.refresh_token);
      setUser(data);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: formatApiError(err) };
    }
  };

  const register = async (email, password, name) => {
    try {
      const { data } = await api.post("/auth/register", { email, password, name });
      saveTokens(data.access_token, data.refresh_token);
      setUser(data);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: formatApiError(err) };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(false);
  };

  const updateProfile = async (data) => {
    const { data: updated } = await api.put("/auth/profile", data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, checkSession, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
