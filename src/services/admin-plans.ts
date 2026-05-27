import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/supabase";

export type AdminPlanLimitRow = {
  plan: Enums<"tenant_plan">;
  maxSupporters: number | null;
  maxTeamMembers: number | null;
  maxRegions: number | null;
  exportsEnabled: boolean;
  pollsEnabled: boolean;
  tenantCount: number;
};

export type UpdatePlanLimitPayload = {
  maxSupporters: number | null;
  maxTeamMembers: number | null;
  maxRegions: number | null;
  exportsEnabled: boolean;
  pollsEnabled: boolean;
};

type RawAdminPlanRow = {
  plan: Enums<"tenant_plan">;
  max_supporters: number | null;
  max_team_members: number | null;
  max_regions: number | null;
  exports_enabled: boolean;
  polls_enabled: boolean;
  tenant_count: number;
};

function mapRow(raw: RawAdminPlanRow): AdminPlanLimitRow {
  return {
    plan: raw.plan,
    maxSupporters: raw.max_supporters,
    maxTeamMembers: raw.max_team_members,
    maxRegions: raw.max_regions,
    exportsEnabled: raw.exports_enabled,
    pollsEnabled: raw.polls_enabled,
    tenantCount: raw.tenant_count,
  };
}

export async function listPlanLimitDefinitions(): Promise<AdminPlanLimitRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_plan_limit_definitions_admin");
  if (error) throw error;

  const rows = (data ?? []) as RawAdminPlanRow[];
  return rows.map(mapRow);
}

export async function updatePlanLimitDefinition(
  plan: Enums<"tenant_plan">,
  payload: UpdatePlanLimitPayload,
): Promise<AdminPlanLimitRow> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("update_plan_limit_definition", {
    p_plan: plan,
    p_max_supporters: payload.maxSupporters,
    p_max_team_members: payload.maxTeamMembers,
    p_max_regions: payload.maxRegions,
    p_exports_enabled: payload.exportsEnabled,
    p_polls_enabled: payload.pollsEnabled,
  });
  if (error) throw error;

  const raw = data as Omit<RawAdminPlanRow, "tenant_count">;
  return {
    ...mapRow({ ...raw, tenant_count: 0 }),
    tenantCount: 0,
  };
}
