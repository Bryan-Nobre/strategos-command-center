import type {
  EnrichedTerritory,
  OperationalAlert,
  OperationalBrief,
  QuickPill,
  StripItem,
  NextAction,
  KpiContext,
  DailyMetric,
} from "@/services/dashboard-intelligence";
import type {
  DashboardMetrics,
  ManualGoalMetric,
  OperationalDashboard,
  StrategicInsights,
  WeeklyGoal,
} from "@/services/dashboard";

type RpcRecord = Record<string, unknown>;

function asRecord(value: unknown): RpcRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RpcRecord)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapSearch(value: unknown): Record<string, string | boolean> | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const out: Record<string, string | boolean> = {};
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === "string" || typeof val === "boolean") out[key] = val;
  }
  return Object.keys(out).length ? out : undefined;
}

function mapTerritory(row: RpcRecord): EnrichedTerritory {
  const risk = asString(row.risk_level, "atencao");
  const territoryLabel = asString(
    row.territory_label,
    asString(row.neighborhood, "Sem bairro"),
  );
  return {
    neighborhood: territoryLabel,
    territoryKey: asString(row.territory_key, territoryLabel),
    territoryLabel,
    supporters: asNumber(row.supporters),
    strongSupportPct: asNumber(row.strong_support_pct),
    undecidedPct: asNumber(row.undecided_pct),
    oppositionPct: asNumber(row.opposition_pct),
    openDemands: asNumber(row.open_demands),
    score: asNumber(row.score),
    displayScore: asNumber(row.display_score),
    riskLevel:
      risk === "critico" || risk === "promissor" || risk === "atencao" ? risk : "atencao",
  };
}

function mapAlert(row: RpcRecord): OperationalAlert {
  return {
    id: asString(row.id),
    severity: asString(row.severity) === "alta" ? "alta" : "media",
    title: asString(row.title),
    description: asString(row.description),
    suggestion: asString(row.suggestion),
    actionLabel: asString(row.action_label),
    actionTo: asString(row.action_to),
    actionSearch: mapSearch(row.action_search),
  };
}

function mapPill(row: RpcRecord): QuickPill {
  const tone = asString(row.tone, "neutral");
  return {
    id: asString(row.id),
    label: asString(row.label),
    tone: tone === "positive" || tone === "warning" ? tone : "neutral",
  };
}

function mapStrip(row: RpcRecord): StripItem {
  const tone = asString(row.tone, "neutral");
  return {
    id: asString(row.id),
    label: asString(row.label),
    tone: tone === "warning" || tone === "success" ? tone : "neutral",
  };
}

function mapNextAction(row: RpcRecord): NextAction {
  return {
    id: asString(row.id),
    label: asString(row.label),
    href: asString(row.href),
    search: mapSearch(row.search),
  };
}

function mapKpiContext(row: RpcRecord | null): KpiContext {
  return {
    last7: asNumber(row?.last_7),
    deltaPct: asNullableNumber(row?.delta_pct),
    sublabel: asString(row?.sublabel),
  };
}

function mapDailyMetric(row: RpcRecord): DailyMetric {
  return {
    label: asString(row.label),
    value: asNumber(row.value),
  };
}

function mapWeeklyGoal(row: RpcRecord): WeeklyGoal {
  const metric = asString(row.metric) as ManualGoalMetric;
  const status = asString(row.status) as WeeklyGoal["status"];
  return {
    id: asString(row.id),
    name: asString(row.name),
    metric,
    startDate: asString(row.start_date),
    endDate: asString(row.end_date),
    target: asNumber(row.target),
    value: asNumber(row.value),
    status:
      status === "no_ritmo" || status === "risco" || status === "atrasado" ? status : "atrasado",
  };
}

function mapOperationalBrief(row: RpcRecord): OperationalBrief {
  const kpi = asRecord(row.kpi) ?? {};
  return {
    pills: asArray(row.pills)
      .map((item) => mapPill(asRecord(item) ?? {}))
      .slice(0, 4),
    strip: asArray(row.strip)
      .map((item) => mapStrip(asRecord(item) ?? {}))
      .slice(0, 4),
    dailySummary: asArray(row.daily_summary).map((item) =>
      mapDailyMetric(asRecord(item) ?? {}),
    ),
    nextActions: asArray(row.next_actions)
      .map((item) => mapNextAction(asRecord(item) ?? {}))
      .slice(0, 4),
    briefingParts: {
      alerts: asArray(asRecord(row)?.alerts).length,
      criticalTerritories: 0,
    },
    kpi: {
      supporters: mapKpiContext(asRecord(kpi.supporters)),
      strongSupport: mapKpiContext(asRecord(kpi.strong_support)),
      leaderships: mapKpiContext(asRecord(kpi.leaderships)),
      openDemands: mapKpiContext(asRecord(kpi.open_demands)),
    },
    unassignedOpenDemands: asNumber(row.unassigned_open_demands),
  };
}

function mapInsights(raw: RpcRecord): StrategicInsights {
  const alerts = asArray(raw.alerts).map((item) => mapAlert(asRecord(item) ?? {}));
  const criticalTerritories = asArray(raw.critical_territories).map((item) =>
    mapTerritory(asRecord(item) ?? {}),
  );
  const operational = mapOperationalBrief(asRecord(raw.operational) ?? {});

  operational.briefingParts = {
    alerts: alerts.length,
    criticalTerritories: criticalTerritories.length,
  };

  return {
    criticalTerritories,
    promisingTerritories: asArray(raw.promising_territories).map((item) =>
      mapTerritory(asRecord(item) ?? {}),
    ),
    weeklyGoals: asArray(raw.weekly_goals).map((item) => mapWeeklyGoal(asRecord(item) ?? {})),
    alerts,
    operational,
    briefingSentence: asString(
      raw.briefing_sentence,
      "Nenhum alerta crítico no momento — operação estável.",
    ),
  };
}

/** Mapeia payload da RPC operacional (snake_case) para tipos do front. */
export function mapOperationalDashboardPayload(raw: unknown): OperationalDashboard {
  const root = asRecord(raw) ?? {};
  const metrics = asRecord(root.metrics) ?? {};

  return {
    metrics: {
      total_supporters: asNumber(metrics.total_supporters),
      strong_support: asNumber(metrics.strong_support),
      undecided: asNumber(metrics.undecided),
      leaderships: asNumber(metrics.leaderships),
      open_demands: asNumber(metrics.open_demands),
      funnel: (metrics.funnel as Record<string, number> | null) ?? null,
    },
    insights: mapInsights(asRecord(root.insights) ?? {}),
  };
}
