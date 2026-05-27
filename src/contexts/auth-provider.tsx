import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthContext } from "@/lib/supabase/session";
import { loadAuthContext } from "@/lib/supabase/session";
import { resolveAuthStatus, type AuthStatus } from "@/lib/auth/auth-status";
import { useSessionContext } from "@/contexts/session-provider";
import { LoadingState } from "@/components/common/LoadingState";

type AuthContextValue = {
  auth: AuthContext;
  status: AuthStatus;
  isInitializing: boolean;
  refreshAuth: () => Promise<AuthContext>;
};

const emptyAuth: AuthContext = {
  session: null,
  user: null,
  profile: null,
  tenants: [],
  activeTenant: null,
  membershipRole: null,
};

const AuthReactContext = createContext<AuthContextValue | null>(null);

/**
 * Perfil, tenants e status de onboarding (UX).
 * Segurança real deve ser validada no backend/API.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSessionLoading, user } = useSessionContext();
  const [auth, setAuth] = useState<AuthContext>(emptyAuth);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    const next = await loadAuthContext();
    setAuth(next);
    return next;
  }, []);

  useEffect(() => {
    if (isSessionLoading) return;

    if (!user) {
      setAuth(emptyAuth);
      setIsProfileLoading(false);
      return;
    }

    let cancelled = false;
    setIsProfileLoading(true);

    refreshAuth()
      .catch(() => {
        if (!cancelled) setAuth(emptyAuth);
      })
      .finally(() => {
        if (!cancelled) setIsProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSessionLoading, user?.id, refreshAuth]);

  const isInitializing = isSessionLoading || isProfileLoading;
  const status = resolveAuthStatus(auth, isInitializing);

  const value = useMemo(
    () => ({ auth, status, isInitializing, refreshAuth }),
    [auth, status, isInitializing, refreshAuth],
  );

  return <AuthReactContext.Provider value={value}>{children}</AuthReactContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthReactContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}

export function AuthLoadingGate({
  children,
  label = "Verificando sessão...",
}: {
  children: ReactNode;
  label?: string;
}) {
  const { isInitializing } = useAuth();
  if (isInitializing) {
    return <LoadingState label={label} />;
  }
  return children;
}
