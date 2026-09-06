import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "./api";
import { clearSession, getStoredUser, getToken, setSession } from "./auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getStoredUser());

  const applySession = useCallback((nextToken, nextUser) => {
    setSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getToken()) {
        await authApi.signout();
      }
    } catch {

    }
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("nova-auth-expired", onExpired);
    return () => window.removeEventListener("nova-auth-expired", onExpired);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      authed: Boolean(token),
      applySession,
      logout,
    }),
    [token, user, applySession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
