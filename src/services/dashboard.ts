import { createClient } from "@/lib/supabase/client";
import type { Enums, Json } from "@/types/supabase";
import {
  buildBriefingSentence,
  buildOperationalAlerts,
  buildOperationalBrief,
  enrichTerritories,
  type EnrichedTerritory,
  type OperationalAlert,
  type OperationalBrief,
} from "@/services/dashboard-intelligence";

export type { EnrichedTerritory, OperationalAlert, OperationalBrief };

export type DashboardMetrics = {
  total_supporters: number;
  strong_support: number;
  undecided: number;
  leaderships: number;
  open_demands: number;
  funnel: Record<string, number> | null;
};

export async function getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_tenant_dashboard_metrics", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return data as DashboardMetrics;
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

function calcStatus(value: number, target: number): WeeklyGoal["status"] {
  if (value >= target) return "no_ritmo";
  if (value >= target * 0.7) return "risco";
  return "atrasado";
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
  const { data: existing, error: findError } = await supabase
    .from("poll_snapshots")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("snapshot_type", "custom")
    .eq("title", "manual_goals")
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;

  const sanitizedGoals = goals
    .map((g) => parseManualGoal(g))
    .filter((g): g is ManualGoalConfig => g !== null);

  const payload: Json = { goals: sanitizedGoals as unknown as Json };

  if (existing?.id) {
    await updatePollSnapshot(existing.id, payload);
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("poll_snapshots").insert({
    tenant_id: tenantId,
    snapshot_type: "custom",
    title: "manual_goals",
    data: payload,
    created_by: user?.id ?? null,
  });
  if (error) throw error;
}

function isBetweenDates(isoDateTime: string | null, startDate: string, endDate: string): boolean {
  if (!isoDateTime) return false;
  const day = isoDateTime.slice(0, 10);
  return day >= startDate && day <= endDate;
}

/** Inteligência operacional calculada no cliente; segurança real continua no backend/RLS. */
export async function getStrategicInsights(tenantId: string): Promise<StrategicInsights> {
  const supabase = createClient();
  const configuredGoals = await getManualGoalsConfig(tenantId);

  const [{ data: supporters, error: sErr }, { data: demands, error: dErr }] = await Promise.all([
    supabase
      .from("supporters")
      .select("id, neighborhood, status, support_level, created_at")
      .eq("tenant_id", tenantId),
    supabase
      .from("demands")
      .select("id, neighborhood, status, created_at, updated_at, assigned_to")
      .eq("tenant_id", tenantId),
  ]);
  if (sErr) throw sErr;
  if (dErr) throw dErr;

  const byNeighborhood = new Map<
    string,
    {
      supporters: number;
      strong: number;
      undecided: number;
      opposition: number;
      openDemands: number;
    }
  >();

  for (const s of supporters ?? []) {
    const key = s.neighborhood?.trim() || "Sem bairro";
    const current = byNeighborhood.get(key) ?? {
      supporters: 0,
      strong: 0,
      undecided: 0,
      opposition: 0,
      openDemands: 0,
    };
    current.supporters += 1;
    if (s.support_level === "forte") current.strong += 1;
    if (s.support_level === "indeciso" || s.status === "indeciso") current.undecided += 1;
    if (s.status === "oposicao") current.opposition += 1;
    byNeighborhood.set(key, current);
  }

  for (const d of demands ?? []) {
    if (d.status !== "resolvido") {
      const key = d.neighborhood?.trim() || "Sem bairro";
      const current = byNeighborhood.get(key) ?? {
        supporters: 0,
        strong: 0,
        undecided: 0,
        opposition: 0,
        openDemands: 0,
      };
      current.openDemands += 1;
      byNeighborhood.set(key, current);
    }
  }

  const territoryRows: TerritoryInsight[] = [...byNeighborhood.entries()]
    .map(([neighborhood, stats]) => {
      const base = Math.max(stats.supporters, 1);
      const strongSupportPct = Math.round((stats.strong / base) * 100);
      const undecidedPct = Math.round((stats.undecided / base) * 100);
      const oppositionPct = Math.round((stats.opposition / base) * 100);
      const score = strongSupportPct - undecidedPct - oppositionPct - stats.openDemands * 3;
      return {
        neighborhood,
        supporters: stats.supporters,
        strongSupportPct,
        undecidedPct,
        oppositionPct,
        openDemands: stats.openDemands,
        score,
      };
    })
    .filter((row) => row.supporters > 0);

  const enriched = enrichTerritories(territoryRows);
  const criticalTerritories = [...enriched].sort((a, b) => a.score - b.score).slice(0, 5);
  const promisingTerritories = [...enriched].sort((a, b) => b.score - a.score).slice(0, 5);

  const weeklyGoals: WeeklyGoal[] = configuredGoals.map((goal) => {
    let value = 0;
    if (goal.metric === "new_supporters") {
      value =
        supporters?.filter((s) => isBetweenDates(s.created_at, goal.startDate, goal.endDate))
          .length ?? 0;
    } else if (goal.metric === "resolved_demands") {
      value =
        demands?.filter(
          (d) =>
            d.status === "resolvido" && isBetweenDates(d.updated_at, goal.startDate, goal.endDate),
        ).length ?? 0;
    } else if (goal.metric === "new_strong_supporters") {
      value =
        supporters?.filter(
          (s) =>
            s.support_level === "forte" &&
            isBetweenDates(s.created_at, goal.startDate, goal.endDate),
        ).length ?? 0;
    }
    return {
      id: goal.id,
      name: goal.name,
      metric: goal.metric,
      startDate: goal.startDate,
      endDate: goal.endDate,
      target: goal.target,
      value,
      status: calcStatus(value, Math.max(goal.target, 1)),
    };
  });

  const alerts = buildOperationalAlerts(criticalTerritories);

  const unassignedOpen =
    demands?.filter((d) => d.status !== "resolvido" && !d.assigned_to).length ?? 0;

  if (unassignedOpen >= 3) {
    alerts.unshift({
      id: "unassigned-demands",
      severity: "alta",
      title: `${unassignedOpen} demandas sem responsável`,
      description: "Demandas abertas aguardam definição de encarregado.",
      suggestion: "Distribua responsáveis para destravar o fluxo operacional.",
      actionLabel: "Ver demandas",
      actionTo: "/demandas",
      actionSearch: { semResponsavel: "1" },
    });
  }

  const operational = buildOperationalBrief(
    supporters ?? [],
    demands ?? [],
    alerts,
    criticalTerritories.length,
    criticalTerritories[0],
    promisingTerritories[0],
    weeklyGoals,
    unassignedOpen,
  );

  const briefingSentence = buildBriefingSentence(operational.briefingParts);

  return {
    criticalTerritories,
    promisingTerritories,
    weeklyGoals,
    alerts,
    operational,
    briefingSentence,
  };
}
