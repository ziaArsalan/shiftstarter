import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, setAccessToken, setUnauthorizedHandler } from "../../lib/api";
import type { AuthUser, Role } from "../../lib/types";

interface RegisterPayload {
  email: string;
  password: string;
  role: Exclude<Role, "ADMIN">;
  firstName?: string;
  lastName?: string;
  businessName?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const bootstrapped = useRef(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: AuthUser; accessToken: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipRefresh: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await api<{ user: AuthUser; accessToken: string }>("/auth/register", {
      method: "POST",
      body: payload,
      skipRefresh: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST", body: {}, skipRefresh: true });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const data = await api<{ user: AuthUser }>("/auth/me");
    setUser(data.user);
  }, []);

  // On an expired/invalid session mid-flight, drop back to logged-out.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Bootstrap: try to restore the session via the refresh cookie.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    (async () => {
      try {
        const data = await api<{ user: AuthUser }>("/auth/me");
        setUser(data.user);
      } catch {
        clearSession();
      } finally {
        setInitializing(false);
      }
    })();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, role: user?.role ?? null, initializing, login, register, logout, refreshUser }),
    [user, initializing, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
