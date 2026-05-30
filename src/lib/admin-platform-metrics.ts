import { summarizePlanPeriod } from "@/lib/admin-plan-period";
import type { Enums } from "@/types/supabase";
import { TENANT_PLAN_LABELS, type TenantPlan } from "@/types/tenant";

export const PLAN_ORDER: TenantPlan[] = ["start", "basic", "pro", "enterprise"];

export type PlanVigenciaMetrics = {
  expiringWithin7Days: number;
  expired: number;
  withoutPeriod: number;
  activeWithPeriod: number;
};

export type ExpiringTenantMetric = {
  tenantId: string;
  name: string;
  plan: Enums<"tenant_plan">;
  endDate: string;
  daysRemaining: number;
};

export type PlatformMetrics = {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  pendingTenants: number;
  cancelledTenants: number;
  newTenants30d: number;
  activationRatePct: number;
  byPlan: Record<TenantPlan, number>;
  totalSupporters: number;
  supportersLast30d: number;
  avgSupportersPerTenant: number;
  totalDemands: number;
  openDemands: number;
  resolvedDemands: number;
  totalMembers: number;
  totalLeaderships: number;
  publishedLandings: number;
  planVigencia: PlanVigenciaMetrics;
  expiringSoon: ExpiringTenantMetric[];
};

export function emptyPlanCounts(): Record<TenantPlan, number> {
  return { start: 0, basic: 0, pro: 0, enterprise: 0 };
}

export function computePlanVigencia(
  tenants: Array<{ id: string; name: string; plan: Enums<"tenant_plan"> }>,
  crmByTenant: Map<
    string,
    { plan_period_start: string | null; plan_period_end: string | null }
  >,
): { planVigencia: PlanVigenciaMetrics; expiringSoon: ExpiringTenantMetric[] } {
  const planVigencia: PlanVigenciaMetrics = {
    expiringWithin7Days: 0,
    expired: 0,
    withoutPeriod: 0,
    activeWithPeriod: 0,
  };
  const expiringSoon: ExpiringTenantMetric[] = [];

  for (const t of tenants) {
    const crm = crmByTenant.get(t.id);
    const start = crm?.plan_period_start ?? null;
    const end = crm?.plan_period_end ?? null;
    const summary = summarizePlanPeriod(start, end);

    if (summary.status === "unset" || summary.status === "missing_end" || summary.status === "missing_start") {
      planVigencia.withoutPeriod += 1;
      continue;
    }

    if (summary.status === "expired") {
      planVigencia.expired += 1;
      continue;
    }

    planVigencia.activeWithPeriod += 1;

    if (
      summary.daysRemaining !== null &&
      summary.daysRemaining >= 0 &&
      summary.daysRemaining <= 7
    ) {
      planVigencia.expiringWithin7Days += 1;
      if (end) {
        expiringSoon.push({
          tenantId: t.id,
          name: t.name,
          plan: t.plan,
          endDate: end,
          daysRemaining: summary.daysRemaining,
        });
      }
    }
  }

  expiringSoon.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return { planVigencia, expiringSoon };
}

export function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function planLabel(plan: Enums<"tenant_plan">): string {
  return TENANT_PLAN_LABELS[plan as TenantPlan] ?? plan;
}
