import type { Enums } from "@/types/supabase";

/** Status do workspace (campanha) no SaaS. Segurança real: RLS/backend. */
export type TenantStatus = Enums<"tenant_status">;

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  pending: "Pendente",
  cancelled: "Cancelado",
};

export type TenantPlan = Enums<"tenant_plan">;

/** Plano comercial (limites, trial de produto). Distinto de tenant_status. */
export const TENANT_PLAN_LABELS: Record<TenantPlan, string> = {
  trial: "Trial",
  basic: "Basic",
  pro: "Pro",
  enterprise: "Enterprise",
};

/**
 * Limites por plano (espelho estático para referência/fallback).
 * Fonte de verdade: `plan_limit_definitions` + RPC `get_tenant_plan_usage` no PostgreSQL.
 * Edição admin: `/admin/plans` (RPC `update_plan_limit_definition`).
 */
export type PlanLimits = {
  maxSupporters: number;
  maxTeamMembers: number;
  maxRegions: number;
  exportsEnabled: boolean;
  pollsEnabled: boolean;
};

export const PLAN_LIMITS: Record<TenantPlan, PlanLimits> = {
  trial: {
    maxSupporters: 500,
    maxTeamMembers: 3,
    maxRegions: 5,
    exportsEnabled: true,
    pollsEnabled: false,
  },
  basic: {
    maxSupporters: 2_000,
    maxTeamMembers: 5,
    maxRegions: 15,
    exportsEnabled: true,
    pollsEnabled: true,
  },
  pro: {
    maxSupporters: 10_000,
    maxTeamMembers: 15,
    maxRegions: 50,
    exportsEnabled: true,
    pollsEnabled: true,
  },
  enterprise: {
    maxSupporters: Number.MAX_SAFE_INTEGER,
    maxTeamMembers: Number.MAX_SAFE_INTEGER,
    maxRegions: Number.MAX_SAFE_INTEGER,
    exportsEnabled: true,
    pollsEnabled: true,
  },
};

export function getPlanLimits(plan: TenantPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}
