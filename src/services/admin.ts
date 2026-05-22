import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/supabase";

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

export async function listAllTenants() {
  const supabase = createClient();
  const superAdminIds = await getSuperAdminOwnerIds();

  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name, plan, status, created_at, owner_user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return filterSaasClientTenants(data ?? [], superAdminIds);
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

export async function getPlatformMetrics() {
  const supabase = createClient();
  const superAdminIds = await getSuperAdminOwnerIds();

  const { data: tenantRows, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, status, owner_user_id");
  if (tenantsError) throw tenantsError;

  const clientTenants = filterSaasClientTenants(tenantRows ?? [], superAdminIds);
  const clientTenantIds = clientTenants.map((t) => t.id);

  const totalTenants = clientTenants.length;
  const activeTenants = clientTenants.filter((t) => t.status === "active").length;

  if (clientTenantIds.length === 0) {
    return {
      totalTenants: 0,
      activeTenants: 0,
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
    totalSupporters: supporters.count ?? 0,
    totalDemands: demands.count ?? 0,
  };
}
