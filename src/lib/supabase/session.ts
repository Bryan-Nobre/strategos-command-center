import type { Session, User } from "@supabase/supabase-js";
import type { Tables } from "@/types/supabase";
import { createClient } from "./client";

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
  localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
}

export async function loadAuthContext(): Promise<AuthContext> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return { session: null, user: null, profile: null, tenants: [], activeTenant: null };
  }

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

  const storedId = getStoredTenantId();
  const activeTenant =
    tenants.find((t) => t.id === storedId) ??
    tenants.find((t) => t.status === "active") ??
    tenants[0] ??
    null;

  if (activeTenant && activeTenant.id !== storedId) {
    setStoredTenantId(activeTenant.id);
  }

  return {
    session,
    user,
    profile: profile ?? null,
    tenants,
    activeTenant,
  };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  localStorage.removeItem(ACTIVE_TENANT_KEY);
}
