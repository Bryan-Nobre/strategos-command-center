import type { AuthContext } from "@/lib/supabase/session";
import { isTenantOperational } from "@/lib/tenant-access";

export type PostAuthDestination =
  | { to: "/tenants" }
  | { to: "/signup" }
  | { to: "/dashboard" };

/**
 * Destino pós-login/signup (UX). Segurança real deve ser validada no backend/API.
 */
export function resolvePostAuthDestination(auth: AuthContext): PostAuthDestination {
  if (auth.profile?.platform_role === "super_admin") {
    return { to: "/tenants" };
  }

  if (!auth.activeTenant || auth.tenants.length === 0) {
    return { to: "/signup" };
  }

  return { to: "/dashboard" };
}

export function shouldShowSuspendedNotice(auth: AuthContext): boolean {
  if (auth.profile?.platform_role === "super_admin") return false;
  if (!auth.activeTenant) return false;
  return !isTenantOperational(auth.activeTenant);
}
