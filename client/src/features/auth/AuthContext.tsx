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
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { api } from "../../lib/api";
import type { MeResponse } from "../../lib/types";

export interface BootstrapPayload {
  intent: "worker" | "pharmacy";
  fullName?: string;
  phone?: string;
  workerRole?: string;
  organizationName?: string;
  chainId?: string;
}

interface AuthContextValue {
  session: Session | null;
  me: MeResponse | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  bootstrap: (payload: BootstrapPayload) => Promise<MeResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshMe: () => Promise<MeResponse | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [initializing, setInitializing] = useState(true);
  const loadedForUser = useRef<string | null>(null);

  const fetchMe = useCallback(async (): Promise<MeResponse | null> => {
    try {
      const data = await api<MeResponse>("/auth/me");
      setMe(data);
      return data;
    } catch {
      setMe(null);
      return null;
    }
  }, []);

  // Track the Supabase session; (re)load /auth/me when the user changes.
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        loadedForUser.current = data.session.user.id;
        await fetchMe();
      }
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      const userId = nextSession?.user.id ?? null;
      if (userId && userId !== loadedForUser.current) {
        loadedForUser.current = userId;
        await fetchMe();
      } else if (!userId) {
        loadedForUser.current = null;
        setMe(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // No session returned => the project requires email confirmation.
    return { needsEmailConfirmation: !data.session };
  }, []);

  const bootstrap = useCallback(async (payload: BootstrapPayload) => {
    const data = await api<MeResponse>("/auth/bootstrap", { method: "POST", body: payload });
    setMe(data);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMe(null);
    loadedForUser.current = null;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      me,
      initializing,
      signIn,
      signUp,
      bootstrap,
      signOut,
      resetPassword,
      updatePassword,
      refreshMe: fetchMe,
    }),
    [session, me, initializing, signIn, signUp, bootstrap, signOut, resetPassword, updatePassword, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
