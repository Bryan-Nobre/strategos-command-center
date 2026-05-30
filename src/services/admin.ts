import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/supabase";
import { TENANT_STATUS_LABELS } from "@/types/tenant";

/** IDs de usuários da plataforma (não são clientes SaaS). */
async function getSuperAdminOwnerIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("platform_role", "super_admin");
  if (error) throw error;
  return new Set((data ?? []).map((p) => p.id));
}

/** Campanhas de clientes — exclui tenants cujo dono é super_admin. */
function filterSaasClientTenants<T extends { owner_user_id: string | null }>(
  tenants: T[],
  superAdminIds: Set<string>,
): T[] {
  return tenants.filter(
    (t) => t.owner_user_id != null && !superAdminIds.has(t.owner_user_id),
  );
}

export type AdminTenantRow = {
  id: string;
  slug: string;
  name: string;
  plan: Enums<"tenant_plan">;
  status: Enums<"tenant_status">;
  created_at: string;
  owner_user_id: string | null;
  member_count: number;
  supporter_count: number;
  landing_public_code: string | null;
};

export async function listAllTenants(filters?: {
  status?: Enums<"tenant_status">;
  plan?: Enums<"tenant_plan">;
}): Promise<AdminTenantRow[]> {
  const supabase = createClient();
  const superAdminIds = await getSuperAdminOwnerIds();

  let query = supabase
    .from("tenants")
    .select("id, slug, name, plan, status, created_at, owner_user_id")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.plan) query = query.eq("plan", filters.plan);

  const { data, error } = await query;
  if (error) throw error;

  const tenants = filterSaasClientTenants(data ?? [], superAdminIds);
  if (tenants.length === 0) return [];

  const ids = tenants.map((t) => t.id);

  const [members, supporters, landings] = await Promise.all([
    supabase.from("tenant_members").select("tenant_id").in("tenant_id", ids),
    supabase.from("supporters").select("tenant_id").in("tenant_id", ids),
    supabase.from("landing_pages").select("tenant_id, public_code").in("tenant_id", ids),
  ]);

  if (members.error) throw members.error;
  if (supporters.error) throw supporters.error;
  if (landings.error) throw landings.error;

  const memberCounts = new Map<string, number>();
  const supporterCounts = new Map<string, number>();
  const landingCodes = new Map<string, string>();

  for (const row of members.data ?? []) {
    memberCounts.set(row.tenant_id, (memberCounts.get(row.tenant_id) ?? 0) + 1);
  }
  for (const row of supporters.data ?? []) {
    supporterCounts.set(row.tenant_id, (supporterCounts.get(row.tenant_id) ?? 0) + 1);
  }
  for (const row of landings.data ?? []) {
    landingCodes.set(row.tenant_id, row.public_code);
  }

  return tenants.map((t) => ({
    ...t,
    member_count: memberCounts.get(t.id) ?? 0,
    supporter_count: supporterCounts.get(t.id) ?? 0,
    landing_public_code: landingCodes.get(t.id) ?? null,
  }));
}

export async function updateTenant(
  id: string,
  payload: { status?: Enums<"tenant_status">; plan?: Enums<"tenant_plan">; name?: string },
) {
  const supabase = createClient();
  const { data, error } = await supabase.from("tenants").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export type PlatformUserRow = {
  id: string;
  full_name: string | null;
  platform_role: Enums<"platform_role">;
  tenant_count: number;
  created_at: string;
};

export async function listPlatformUsers(): Promise<PlatformUserRow[]> {
  const supabase = createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, platform_role, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const { data: memberships, error: mErr } = await supabase
    .from("tenant_members")
    .select("user_id");
  if (mErr) throw mErr;

  const tenantCountByUser = new Map<string, number>();
  for (const m of memberships ?? []) {
    tenantCountByUser.set(m.user_id, (tenantCountByUser.get(m.user_id) ?? 0) + 1);
  }

  return (profiles ?? [])
    .filter((p) => p.platform_role !== "super_admin")
    .map((p) => ({
      id: p.id,
      full_name: p.full_name,
      platform_role: p.platform_role,
      created_at: p.created_at,
      tenant_count: tenantCountByUser.get(p.id) ?? 0,
    }));
}

export async function getPlatformMetrics() {
  const supabase = createClient();
  const superAdminIds = await getSuperAdminOwnerIds();

  const { data: tenantRows, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, status, owner_user_id, created_at");
  if (tenantsError) throw tenantsError;

  const clientTenants = filterSaasClientTenants(tenantRows ?? [], superAdminIds);
  const clientTenantIds = clientTenants.map((t) => t.id);

  const totalTenants = clientTenants.length;
  const activeTenants = clientTenants.filter((t) => t.status === "active").length;
  const suspendedTenants = clientTenants.filter((t) => t.status === "suspended").length;
  const pendingTenants = clientTenants.filter((t) => t.status === "pending").length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newTenants30d = clientTenants.filter(
    (t) => new Date(t.created_at) >= thirtyDaysAgo,
  ).length;

  if (clientTenantIds.length === 0) {
    return {
      totalTenants: 0,
      activeTenants: 0,
      suspendedTenants: 0,
      pendingTenants: 0,
      newTenants30d: 0,
      totalSupporters: 0,
      totalDemands: 0,
    };
  }

  const [supporters, demands] = await Promise.all([
    supabase
      .from("supporters")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds),
    supabase
      .from("demands")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds),
  ]);

  return {
    totalTenants,
    activeTenants,
    suspendedTenants,
    pendingTenants,
    newTenants30d,
    totalSupporters: supporters.count ?? 0,
    totalDemands: demands.count ?? 0,
  };
}

export { TENANT_STATUS_LABELS };
