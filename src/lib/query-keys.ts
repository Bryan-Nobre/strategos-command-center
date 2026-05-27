/**
 * Chaves React Query — sempre incluir tenantId para isolamento multi-tenant.
 * Segurança real: RLS no Supabase; keys evitam vazamento de cache entre campanhas.
 */
export const queryKeys = {
  dashboard: (tenantId: string) => ["dashboard", tenantId] as const,
  strategicInsights: (tenantId: string) => ["strategic-insights", tenantId] as const,
  weeklyGoalsConfig: (tenantId: string) => ["weekly-goals-config", tenantId] as const,
  activities: (tenantId: string) => ["activities", tenantId] as const,
  pollSnapshots: (tenantId: string) => ["poll_snapshots", tenantId] as const,
  supporters: (tenantId: string) => ["supporters", tenantId] as const,
  leaderships: (tenantId: string) => ["leaderships", tenantId] as const,
  demands: (tenantId: string) => ["demands", tenantId] as const,
  agenda: (tenantId: string) => ["agenda", tenantId] as const,
  team: (tenantId: string) => ["team", tenantId] as const,
  invitations: (tenantId: string) => ["invitations", tenantId] as const,
  landing: (tenantId: string) => ["landing", tenantId] as const,
  prefs: (tenantId: string) => ["prefs", tenantId] as const,
  publicLanding: (slug: string) => ["public-landing", slug] as const,
  adminTenants: (filters?: { status?: string; plan?: string }) =>
    ["admin-tenants", filters ?? {}] as const,
  adminMetrics: () => ["admin-metrics"] as const,
  adminUsers: () => ["admin-users"] as const,
};

/** Remove cache de dados tenant-scoped (ex.: logout / troca de campanha). */
export function isTenantScopedQueryKey(key: readonly unknown[]): boolean {
  const root = key[0];
  if (typeof root !== "string") return false;
  const tenantRoots = new Set([
    "dashboard",
    "strategic-insights",
    "weekly-goals-config",
    "activities",
    "poll_snapshots",
    "supporters",
    "leaderships",
    "demands",
    "agenda",
    "team",
    "invitations",
    "landing",
    "prefs",
  ]);
  return tenantRoots.has(root);
}
