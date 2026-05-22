import type { Session, User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { createClient } from "./client";
import { createServerSupabaseClient } from "./server";
import type { Tables } from "@/types/supabase";

export type Profile = Tables<"profiles">;
export type Tenant = Tables<"tenants">;

export type AuthContext = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tenants: Tenant[];
  activeTenant: Tenant | null;
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

async function resolveAuthFromClient(
  supabase: SupabaseClient<Database>,
  options?: { useStoredTenant?: boolean },
): Promise<AuthContext> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { session: null, user: null, profile: null, tenants: [], activeTenant: null };
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
    .select("tenant_id, tenants(id, slug, name, plan, status, owner_user_id, created_at, updated_at)")
    .eq("user_id", user.id);

  const tenants = (memberships ?? [])
    .map((m) => m.tenants)
    .filter((t): t is Tenant => t != null);

  const useStored = options?.useStoredTenant ?? typeof window !== "undefined";
  const storedId = useStored ? getStoredTenantId() : null;
  const activeTenant =
    tenants.find((t) => t.id === storedId) ?? tenants[0] ?? null;

  if (useStored && activeTenant && activeTenant.id !== storedId) {
    setStoredTenantId(activeTenant.id);
  }

  return {
    session: session ?? null,
    user,
    profile: profile ?? null,
    tenants,
    activeTenant,
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
    return { session: null, user: null, profile: null, tenants: [], activeTenant: null };
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
    return { session: null, user: null, profile: null, tenants: [], activeTenant: null };
  }

  return resolveAuthFromClient(createClient());
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  localStorage.removeItem(ACTIVE_TENANT_KEY);
}
