import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "@/api/auth";
import { setAccessToken, refreshAccessToken, getErrorMessage } from "@/api/client";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const res = await authApi.me();
    setUser(res.data.data);
  };

  // On app load, try to silently exchange the httpOnly refresh cookie for a
  // new access token so a page refresh doesn't force a re-login.
  useEffect(() => {
    (async () => {
      const token = await refreshAccessToken();
      if (token) {
        try {
          await refreshUser();
        } catch {
          setAccessToken(null);
        }
      }
      setLoading(false);
    })();

    const onExpired = () => {
      setAccessToken(null);
      setUser(null);
    };
    window.addEventListener("spms:session-expired", onExpired);
    return () => window.removeEventListener("spms:session-expired", onExpired);
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await authApi.login(identifier, password);
    setAccessToken(res.data.data.accessToken);
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { getErrorMessage };
