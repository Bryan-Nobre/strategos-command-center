import type { AuthContext } from "@/lib/supabase/session";
import { isTenantOperational } from "@/lib/tenant-access";

/** Estados globais de autenticação/onboarding (UX — segurança real no backend/RLS). */
export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "onboarding"
  | "suspended";

export function resolveAuthStatus(
  auth: AuthContext | null,
  isInitializing: boolean,
): AuthStatus {
  if (isInitializing || auth === null) {
    return "loading";
  }

  if (!auth.session || !auth.user) {
    return "unauthenticated";
  }

  if (auth.profile?.platform_role === "super_admin") {
    return "authenticated";
  }

  if (auth.tenants.length === 0) {
    return "onboarding";
  }

  if (!auth.activeTenant) {
    return "onboarding";
  }

  if (!isTenantOperational(auth.activeTenant)) {
    return "suspended";
  }

  return "authenticated";
}
