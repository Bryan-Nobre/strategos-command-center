import { createClient } from "@/lib/supabase/client";
import { mapOperationalDashboardPayload } from "@/lib/dashboard-mapper";
import type { Enums, Json } from "@/types/supabase";
import type { EnrichedTerritory, OperationalAlert, OperationalBrief } from "@/services/dashboard-intelligence";

export type { EnrichedTerritory, OperationalAlert, OperationalBrief };

export type DashboardMetrics = {
  total_supporters: number;
  strong_support: number;
  undecided: number;
  leaderships: number;
  open_demands: number;
  funnel: Record<string, number> | null;
};

export type TerritoryInsight = {
  neighborhood: string;
  supporters: number;
  strongSupportPct: number;
  undecidedPct: number;
  oppositionPct: number;
  openDemands: number;
  score: number;
};

export type WeeklyGoal = {
  id: string;
  name: string;
  metric: ManualGoalMetric;
  startDate: string;
  endDate: string;
  target: number;
  value: number;
  status: "no_ritmo" | "risco" | "atrasado";
};

export type ManualGoalMetric = "new_supporters" | "resolved_demands" | "new_strong_supporters";

export type ManualGoalConfig = {
  id: string;
  name: string;
  metric: ManualGoalMetric;
  startDate: string;
  endDate: string;
  target: number;
};

export type StrategicInsights = {
  criticalTerritories: EnrichedTerritory[];
  promisingTerritories: EnrichedTerritory[];
  weeklyGoals: WeeklyGoal[];
  alerts: OperationalAlert[];
  operational: OperationalBrief;
  briefingSentence: string;
};

export type OperationalDashboard = {
  metrics: DashboardMetrics;
  insights: StrategicInsights;
};

/** Dashboard operacional — agregação e regras no servidor (RLS + RPC). */
export async function getOperationalDashboard(tenantId: string): Promise<OperationalDashboard> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_tenant_operational_dashboard", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return mapOperationalDashboardPayload(data);
}

export async function listActivities(tenantId: string, limit = 10) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("id, message, created_at, entity_type")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function listPollSnapshots(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("poll_snapshots")
    .select("id, snapshot_type, title, data, recorded_at")
    .eq("tenant_id", tenantId);
  if (error) throw error;
  return data;
}

export async function updatePollSnapshot(id: string, data: Json) {
  const supabase = createClient();
  const { error } = await supabase.from("poll_snapshots").update({ data }).eq("id", id);
  if (error) throw error;
}

export async function upsertPollSnapshot(
  tenantId: string,
  snapshotType: Enums<"poll_snapshot_type">,
  data: Json,
  title?: string,
) {
  const supabase = createClient();
  const { data: existing, error: findError } = await supabase
    .from("poll_snapshots")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("snapshot_type", snapshotType)
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    await updatePollSnapshot(existing.id, data);
    return existing.id;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: row, error } = await supabase
    .from("poll_snapshots")
    .insert({
      tenant_id: tenantId,
      snapshot_type: snapshotType,
      data,
      title: title ?? null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return row.id;
}

const DEFAULT_MANUAL_GOALS: ManualGoalConfig[] = [];

function safeGoalNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseManualGoal(input: unknown): ManualGoalConfig | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const id = typeof row.id === "string" && row.id ? row.id : crypto.randomUUID();
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const metric = row.metric;
  const startDate = row.startDate;
  const endDate = row.endDate;
  if (!name) return null;
  if (
    metric !== "new_supporters" &&
    metric !== "resolved_demands" &&
    metric !== "new_strong_supporters"
  ) {
    return null;
  }
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return null;
  return {
    id,
    name,
    metric,
    startDate,
    endDate,
    target: Math.max(0, safeGoalNumber(row.target, 0)),
  };
}

export async function getManualGoalsConfig(tenantId: string): Promise<ManualGoalConfig[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("poll_snapshots")
    .select("data")
    .eq("tenant_id", tenantId)
    .eq("snapshot_type", "custom")
    .eq("title", "manual_goals")
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  const payload = (data?.data ?? {}) as Record<string, unknown>;
  if (!Array.isArray(payload.goals)) return DEFAULT_MANUAL_GOALS;
  return payload.goals.map(parseManualGoal).filter((g): g is ManualGoalConfig => g !== null);
}

export async function saveManualGoalsConfig(
  tenantId: string,
  goals: ManualGoalConfig[],
): Promise<void> {
  const supabase = createClient();
  const sanitizedGoals = goals
    .map((g) => parseManualGoal(g))
    .filter((g): g is ManualGoalConfig => g !== null);

  const { error } = await supabase.rpc("upsert_manual_goals_config", {
    p_tenant_id: tenantId,
    p_goals: sanitizedGoals as unknown as Json,
  });
  if (error) throw error;
}
