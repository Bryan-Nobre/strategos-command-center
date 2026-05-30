import type { Session, User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { isStaleAuthSessionError } from "./auth-errors";
import { createClient } from "./client";
import { createServerSupabaseClient } from "./server";
import { clearTenantScopedCache } from "@/lib/query-cache";
import { getQueryClient } from "@/lib/query-client";
import type { Tables, Enums } from "@/types/supabase";

export type Profile = Tables<"profiles">;
export type Tenant = Tables<"tenants">;

export type AuthContext = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tenants: Tenant[];
  activeTenant: Tenant | null;
  /** Papel do usuário na campanha ativa (RLS é a fonte de verdade). */
  membershipRole: Enums<"tenant_role"> | null;
};

const ACTIVE_TENANT_KEY = "strategos_active_tenant_id";

export function getStoredTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_TENANT_KEY);
}

export function setStoredTenantId(tenantId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
}

const EMPTY_AUTH: AuthContext = {
  session: null,
  user: null,
  profile: null,
  tenants: [],
  activeTenant: null,
  membershipRole: null,
};

async function clearStaleAuthSession(supabase: SupabaseClient<Database>) {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Ignora falha ao limpar storage local
  }
}

async function resolveAuthFromClient(
  supabase: SupabaseClient<Database>,
  options?: { useStoredTenant?: boolean },
): Promise<AuthContext> {
  let user: User | null = null;
  let userError: Error | null = null;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    userError = result.error;
  } catch (error) {
    userError = error instanceof Error ? error : new Error(String(error));
  }

  if (userError || !user) {
    if (userError && isStaleAuthSessionError(userError)) {
      await clearStaleAuthSession(supabase);
    }
    return EMPTY_AUTH;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, phone, bio, platform_role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(id, slug, name, plan, status, owner_user_id, created_at, updated_at)")
    .eq("user_id", user.id);

  const tenants = (memberships ?? [])
    .map((m) => m.tenants)
    .filter((t): t is Tenant => t != null);

  const useStored = options?.useStoredTenant ?? typeof window !== "undefined";
  const storedId = useStored ? getStoredTenantId() : null;
  const activeTenant =
    tenants.find((t) => t.id === storedId) ?? tenants[0] ?? null;

  const membershipRole =
    (memberships ?? []).find((m) => m.tenant_id === activeTenant?.id)?.role ?? null;

  if (useStored && activeTenant && activeTenant.id !== storedId) {
    setStoredTenantId(activeTenant.id);
  }

  return {
    session: session ?? null,
    user,
    profile: profile ?? null,
    tenants,
    activeTenant,
    membershipRole,
  };
}

/**
 * Carrega sessão/perfil/tenants para guards de rota (SSR + hidratação).
 * Ignora localStorage para o tenant ativo ficar igual no servidor e no cliente.
 */
export async function loadAuthContextForRoute(request?: Request): Promise<AuthContext> {
  if (request) {
    const supabase = createServerSupabaseClient(request);
    return resolveAuthFromClient(supabase, { useStoredTenant: false });
  }

  if (typeof window === "undefined") {
    return {
      session: null,
      user: null,
      profile: null,
      tenants: [],
      activeTenant: null,
      membershipRole: null,
    };
  }

  return resolveAuthFromClient(createClient(), { useStoredTenant: false });
}

/** Uso em formulários/ações — respeita tenant salvo no localStorage. */
export async function loadAuthContext(request?: Request): Promise<AuthContext> {
  if (request) {
    const supabase = createServerSupabaseClient(request);
    return resolveAuthFromClient(supabase, { useStoredTenant: false });
  }

  if (typeof window === "undefined") {
    return {
      session: null,
      user: null,
      profile: null,
      tenants: [],
      activeTenant: null,
      membershipRole: null,
    };
  }

  return resolveAuthFromClient(createClient());
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  localStorage.removeItem(ACTIVE_TENANT_KEY);
  if (typeof window !== "undefined") {
    clearTenantScopedCache(getQueryClient());
  }
}
