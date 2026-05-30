import { createClient } from "@/lib/supabase/client";
import {
  computePlanVigencia,
  emptyPlanCounts,
  type PlatformMetrics,
} from "@/lib/admin-platform-metrics";
import type { Enums } from "@/types/supabase";
import type { TenantPlan } from "@/types/tenant";

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
  /** Início da vigência do plano (CRM interno). */
  admin_plan_period_start: string | null;
  /** Fim da vigência do plano (CRM interno). */
  admin_plan_period_end: string | null;
  /** Comentário interno da plataforma sobre o cliente. */
  admin_comment: string | null;
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

  const [members, supporters, landings, crmRows] = await Promise.all([
    supabase.from("tenant_members").select("tenant_id").in("tenant_id", ids),
    supabase.from("supporters").select("tenant_id").in("tenant_id", ids),
    supabase.from("landing_pages").select("tenant_id, public_code").in("tenant_id", ids),
    supabase
      .from("tenant_admin_crm")
      .select("tenant_id, plan_period_start, plan_period_end, comment")
      .in("tenant_id", ids),
  ]);

  if (members.error) throw members.error;
  if (supporters.error) throw supporters.error;
  if (landings.error) throw landings.error;
  if (crmRows.error) throw crmRows.error;

  const memberCounts = new Map<string, number>();
  const supporterCounts = new Map<string, number>();
  const landingCodes = new Map<string, string>();
  const crmByTenant = new Map<
    string,
    {
      plan_period_start: string | null;
      plan_period_end: string | null;
      comment: string | null;
    }
  >();

  for (const row of members.data ?? []) {
    memberCounts.set(row.tenant_id, (memberCounts.get(row.tenant_id) ?? 0) + 1);
  }
  for (const row of supporters.data ?? []) {
    supporterCounts.set(row.tenant_id, (supporterCounts.get(row.tenant_id) ?? 0) + 1);
  }
  for (const row of landings.data ?? []) {
    landingCodes.set(row.tenant_id, row.public_code);
  }
  for (const row of crmRows.data ?? []) {
    crmByTenant.set(row.tenant_id, {
      plan_period_start: row.plan_period_start,
      plan_period_end: row.plan_period_end,
      comment: row.comment,
    });
  }

  return tenants.map((t) => {
    const crm = crmByTenant.get(t.id);
    return {
      ...t,
      member_count: memberCounts.get(t.id) ?? 0,
      supporter_count: supporterCounts.get(t.id) ?? 0,
      landing_public_code: landingCodes.get(t.id) ?? null,
      admin_plan_period_start: crm?.plan_period_start ?? null,
      admin_plan_period_end: crm?.plan_period_end ?? null,
      admin_comment: crm?.comment ?? null,
    };
  });
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

/** Notas internas do super admin — RLS + RPC no backend. */
export async function updateTenantAdminCrm(
  tenantId: string,
  payload: {
    planPeriodStart: string | null;
    planPeriodEnd: string | null;
    comment: string | null;
  },
) {
  const supabase = createClient();
  const { error } = await supabase.rpc("upsert_tenant_admin_crm", {
    p_tenant_id: tenantId,
    p_plan_period_start: payload.planPeriodStart,
    p_plan_period_end: payload.planPeriodEnd,
    p_comment: payload.comment,
    p_clear_plan_period_start: payload.planPeriodStart === null,
    p_clear_plan_period_end: payload.planPeriodEnd === null,
    p_clear_comment: payload.comment === null,
  });
  if (error) throw error;
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

export type { PlatformMetrics } from "@/lib/admin-platform-metrics";

function emptyPlatformMetrics(): PlatformMetrics {
  return {
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    pendingTenants: 0,
    cancelledTenants: 0,
    newTenants30d: 0,
    activationRatePct: 0,
    byPlan: emptyPlanCounts(),
    totalSupporters: 0,
    supportersLast30d: 0,
    avgSupportersPerTenant: 0,
    totalDemands: 0,
    openDemands: 0,
    resolvedDemands: 0,
    totalMembers: 0,
    totalLeaderships: 0,
    publishedLandings: 0,
    planVigencia: {
      expiringWithin7Days: 0,
      expired: 0,
      withoutPeriod: 0,
      activeWithPeriod: 0,
    },
    expiringSoon: [],
  };
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const supabase = createClient();
  const superAdminIds = await getSuperAdminOwnerIds();

  const { data: tenantRows, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, name, plan, status, owner_user_id, created_at");
  if (tenantsError) throw tenantsError;

  const clientTenants = filterSaasClientTenants(tenantRows ?? [], superAdminIds);
  const clientTenantIds = clientTenants.map((t) => t.id);

  const totalTenants = clientTenants.length;
  const activeTenants = clientTenants.filter((t) => t.status === "active").length;
  const suspendedTenants = clientTenants.filter((t) => t.status === "suspended").length;
  const pendingTenants = clientTenants.filter((t) => t.status === "pending").length;
  const cancelledTenants = clientTenants.filter((t) => t.status === "cancelled").length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

  const newTenants30d = clientTenants.filter(
    (t) => new Date(t.created_at) >= thirtyDaysAgo,
  ).length;

  const byPlan = emptyPlanCounts();
  for (const t of clientTenants) {
    const plan = t.plan as TenantPlan;
    if (plan in byPlan) byPlan[plan] += 1;
  }

  const activationRatePct =
    totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0;

  if (clientTenantIds.length === 0) {
    return emptyPlatformMetrics();
  }

  const [
    supportersTotal,
    supportersRecent,
    demandsTotal,
    demandsOpen,
    demandsResolved,
    members,
    leaderships,
    landingsPublished,
    crmRows,
  ] = await Promise.all([
    supabase
      .from("supporters")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds),
    supabase
      .from("supporters")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds)
      .gte("created_at", thirtyDaysAgoIso),
    supabase
      .from("demands")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds),
    supabase
      .from("demands")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds)
      .neq("status", "resolvido"),
    supabase
      .from("demands")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds)
      .eq("status", "resolvido"),
    supabase
      .from("tenant_members")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds),
    supabase
      .from("leaderships")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds),
    supabase
      .from("landing_pages")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", clientTenantIds)
      .eq("is_published", true),
    supabase
      .from("tenant_admin_crm")
      .select("tenant_id, plan_period_start, plan_period_end")
      .in("tenant_id", clientTenantIds),
  ]);

  const queries = [
    supportersTotal,
    supportersRecent,
    demandsTotal,
    demandsOpen,
    demandsResolved,
    members,
    leaderships,
    landingsPublished,
    crmRows,
  ];
  for (const q of queries) {
    if (q.error) throw q.error;
  }

  const totalSupporters = supportersTotal.count ?? 0;
  const crmByTenant = new Map<
    string,
    { plan_period_start: string | null; plan_period_end: string | null }
  >();
  for (const row of crmRows.data ?? []) {
    crmByTenant.set(row.tenant_id, {
      plan_period_start: row.plan_period_start,
      plan_period_end: row.plan_period_end,
    });
  }

  const { planVigencia, expiringSoon } = computePlanVigencia(
    clientTenants.map((t) => ({ id: t.id, name: t.name, plan: t.plan })),
    crmByTenant,
  );

  return {
    totalTenants,
    activeTenants,
    suspendedTenants,
    pendingTenants,
    cancelledTenants,
    newTenants30d,
    activationRatePct,
    byPlan,
    totalSupporters,
    supportersLast30d: supportersRecent.count ?? 0,
    avgSupportersPerTenant:
      totalTenants > 0 ? Math.round(totalSupporters / totalTenants) : 0,
    totalDemands: demandsTotal.count ?? 0,
    openDemands: demandsOpen.count ?? 0,
    resolvedDemands: demandsResolved.count ?? 0,
    totalMembers: members.count ?? 0,
    totalLeaderships: leaderships.count ?? 0,
    publishedLandings: landingsPublished.count ?? 0,
    planVigencia,
    expiringSoon: expiringSoon.slice(0, 8),
  };
}

export { TENANT_STATUS_LABELS } from "@/types/tenant";
