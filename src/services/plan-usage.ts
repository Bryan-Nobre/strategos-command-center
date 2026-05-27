import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/supabase";

export type PlanLimitsSnapshot = {
  maxSupporters: number | null;
  maxTeamMembers: number | null;
  maxRegions: number | null;
  exportsEnabled: boolean;
  pollsEnabled: boolean;
};

export type PlanUsageSnapshot = {
  supporters: number;
  teamSlots: number;
  regions: number;
};

export type PlanRemainingSnapshot = {
  supporters: number | null;
  teamSlots: number | null;
};

export type TenantPlanUsage = {
  plan: Enums<"tenant_plan">;
  limits: PlanLimitsSnapshot;
  usage: PlanUsageSnapshot;
  remaining: PlanRemainingSnapshot;
};

type RpcPlanUsage = {
  plan: Enums<"tenant_plan">;
  limits: {
    max_supporters: number | null;
    max_team_members: number | null;
    max_regions: number | null;
    exports_enabled: boolean;
    polls_enabled: boolean;
  };
  usage: {
    supporters: number;
    team_slots: number;
    regions: number;
  };
  remaining: {
    supporters: number | null;
    team_slots: number | null;
  };
};

function mapRpcUsage(raw: RpcPlanUsage): TenantPlanUsage {
  return {
    plan: raw.plan,
    limits: {
      maxSupporters: raw.limits.max_supporters,
      maxTeamMembers: raw.limits.max_team_members,
      maxRegions: raw.limits.max_regions,
      exportsEnabled: raw.limits.exports_enabled,
      pollsEnabled: raw.limits.polls_enabled,
    },
    usage: {
      supporters: raw.usage.supporters,
      teamSlots: raw.usage.team_slots,
      regions: raw.usage.regions,
    },
    remaining: {
      supporters: raw.remaining.supporters,
      teamSlots: raw.remaining.team_slots,
    },
  };
}

/** Uso e limites do plano — fonte: PostgreSQL. */
export async function getTenantPlanUsage(tenantId: string): Promise<TenantPlanUsage> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_tenant_plan_usage", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return mapRpcUsage(data as RpcPlanUsage);
}
