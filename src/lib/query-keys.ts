/**
 * Chaves React Query — sempre incluir tenantId para isolamento multi-tenant.
 * Segurança real: RLS no Supabase; keys evitam vazamento de cache entre campanhas.
 */
export const queryKeys = {
  operationalDashboard: (tenantId: string) => ["operational-dashboard", tenantId] as const,
  /** @deprecated Use operationalDashboard */
  dashboard: (tenantId: string) => ["operational-dashboard", tenantId] as const,
  /** @deprecated Use operationalDashboard */
  strategicInsights: (tenantId: string) => ["operational-dashboard", tenantId] as const,
  weeklyGoalsConfig: (tenantId: string) => ["weekly-goals-config", tenantId] as const,
  activities: (tenantId: string) => ["activities", tenantId] as const,
  pollSnapshots: (tenantId: string) => ["poll_snapshots", tenantId] as const,
  reportsSummary: (
    tenantId: string,
    filters: Record<string, string | null | undefined>,
  ) => ["reports-summary", tenantId, filters] as const,
  supporters: (tenantId: string) => ["supporters", tenantId] as const,
  leaderships: (tenantId: string) => ["leaderships", tenantId] as const,
  leadershipChapas: (tenantId: string, leadershipId: string) =>
    ["leadership-chapas", tenantId, leadershipId] as const,
  demands: (tenantId: string) => ["demands", tenantId] as const,
  agenda: (tenantId: string) => ["agenda", tenantId] as const,
  team: (tenantId: string) => ["team", tenantId] as const,
  invitations: (tenantId: string) => ["invitations", tenantId] as const,
  landing: (tenantId: string) => ["landing", tenantId] as const,
  supporterLeadershipLinks: (tenantId: string, supporterId?: string) =>
    ["supporter-leadership-links", tenantId, supporterId ?? "all"] as const,
  supporterPoliticalSummaries: (tenantId: string) =>
    ["supporter-political-summaries", tenantId] as const,
  supporterPoliticalDetail: (tenantId: string, supporterId: string) =>
    ["supporter-political-detail", tenantId, supporterId] as const,
  leadershipOperationalDetail: (
    tenantId: string,
    leadershipId: string,
    params: Record<string, string | number>,
  ) => ["leadership-operational-detail", tenantId, leadershipId, params] as const,
  prefs: (tenantId: string) => ["prefs", tenantId] as const,
  planUsage: (tenantId: string) => ["plan-usage", tenantId] as const,
  planCatalog: () => ["plan-catalog"] as const,
  tenantPermissions: (tenantId: string) => ["tenant-permissions", tenantId] as const,
  tenantRoles: (tenantId: string) => ["tenant-roles", tenantId] as const,
  globalSearch: (tenantId: string, query: string) => ["global-search", tenantId, query] as const,
  notifications: (tenantId: string) => ["notifications", tenantId] as const,
  notificationCount: (tenantId: string) => ["notification-count", tenantId] as const,
  publicLanding: (slug: string) => ["public-landing", slug] as const,
  adminTenants: (filters?: { status?: string; plan?: string }) =>
    ["admin-tenants", filters ?? {}] as const,
  adminMetrics: () => ["admin-metrics"] as const,
  adminUsers: () => ["admin-users"] as const,
  adminPlans: () => ["admin-plans"] as const,
};

/** Remove cache de dados tenant-scoped (ex.: logout / troca de campanha). */
export function isTenantScopedQueryKey(key: readonly unknown[]): boolean {
  const root = key[0];
  if (typeof root !== "string") return false;
  const tenantRoots = new Set([
    "operational-dashboard",
    "dashboard",
    "strategic-insights",
    "weekly-goals-config",
    "activities",
    "poll_snapshots",
    "reports-summary",
    "supporters",
    "leaderships",
    "demands",
    "agenda",
    "team",
    "invitations",
    "landing",
    "prefs",
    "plan-usage",
    "tenant-permissions",
    "tenant-roles",
    "global-search",
    "notifications",
    "notification-count",
    "supporter-political-summaries",
    "supporter-political-detail",
    "leadership-operational-detail",
  ]);
  return tenantRoots.has(root);
}
