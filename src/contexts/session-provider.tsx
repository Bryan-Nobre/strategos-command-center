import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isStaleAuthSessionError } from "@/lib/supabase/auth-errors";

type SessionContextValue = {
  session: Session | null;
  user: User | null;
  isSessionLoading: boolean;
  refreshSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Sincroniza sessão Supabase no browser (refresh, sign-in/out).
 * Segurança real deve ser validada no backend/API.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const supabase = createClient();
    let nextUser: User | null = null;
    let error: Error | null = null;

    try {
      const result = await supabase.auth.getUser();
      nextUser = result.data.user;
      error = result.error;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
    }

    if (error || !nextUser) {
      if (error && isStaleAuthSessionError(error)) {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          /* storage já limpo */
        }
      }
      setUser(null);
      setSession(null);
      return;
    }

    const {
      data: { session: nextSession },
    } = await supabase.auth.getSession();

    setUser(nextUser);
    setSession(nextSession);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      try {
        await refreshSession();
      } finally {
        if (!cancelled) setIsSessionLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsSessionLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const value = useMemo(
    () => ({ session, user, isSessionLoading, refreshSession }),
    [session, user, isSessionLoading, refreshSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessionContext deve ser usado dentro de SessionProvider");
  }
  return ctx;
}
