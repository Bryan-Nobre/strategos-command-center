import type { TerritoryInsight } from "@/services/dashboard";

type JsonRecord = Record<string, unknown>;

function asRecord(v: unknown): JsonRecord | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as JsonRecord) : null;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asInt(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

type ReportTerritory = TerritoryInsight & { risk_level: string; display_score: number };

function mapTerritory(row: JsonRecord): ReportTerritory & { territory_key?: string } {
  return {
    neighborhood: String(row.neighborhood ?? row.territory_label ?? ""),
    territory_key: row.territory_key ? String(row.territory_key) : undefined,
    supporters: asInt(row.supporters),
    strongSupportPct: asInt(row.strong_support_pct),
    undecidedPct: asInt(row.undecided_pct),
    oppositionPct: asInt(row.opposition_pct),
    openDemands: asInt(row.open_demands),
    score: asInt(row.score),
    display_score: asInt(row.display_score),
    risk_level: String(row.risk_level ?? "atencao"),
  };
}

export type ReportsSummary = {
  period: {
    from: string;
    to: string;
    days: number;
    prevFrom: string;
    prevTo: string;
  };
  pulse: {
    newSupporters: number;
    growthPct: number | null;
    resolvedDemands: number;
    criticalTerritories: number;
  };
  summary: {
    totalSupporters: number;
    strongSupport: number;
    undecided: number;
    opposition: number;
    leaderships: number;
    openDemands: number;
    resolvedInPeriod: number;
    newSupportersInPeriod: number;
  };
  territories: {
    critical: ReportTerritory[];
    promising: ReportTerritory[];
  };
  funnel: {
    interessado: number;
    apoiador: number;
    apoioForte: number;
    lideranca: number;
    newInPeriod: number;
  };
  demands: {
    byStatus: Record<string, number>;
    unassigned: number;
    avgResolutionDays: number;
    byCategory: { category: string; count: number }[];
  };
  growthSeries: { label: string; apoiadores: number }[];
  distribution: {
    bySupportLevel: Record<string, number>;
    byStatus: Record<string, number>;
  };
  exportCounts: {
    supporters: number;
    demands: number;
    leaderships: number;
    territories: number;
    agenda: number;
    activities: number;
  };
  filterOptions: {
    neighborhoods: string[];
    cities: string[];
    sources: string[];
    leaderships: { id: string; name: string }[];
    assignees: { id: string; name: string }[];
  };
  pollMeta: { type: string; title: string | null; updatedAt: string }[];
};

export function mapReportsSummaryPayload(raw: unknown): ReportsSummary {
  const root = asRecord(raw) ?? {};
  const period = asRecord(root.period) ?? {};
  const pulse = asRecord(root.pulse) ?? {};
  const summary = asRecord(root.summary) ?? {};
  const territories = asRecord(root.territories) ?? {};
  const funnel = asRecord(root.funnel) ?? {};
  const demands = asRecord(root.demands) ?? {};
  const distribution = asRecord(root.distribution) ?? {};
  const exportCounts = asRecord(root.export_counts) ?? {};
  const filterOptions = asRecord(root.filter_options) ?? {};

  const byStatus = asRecord(demands.by_status) ?? {};
  const byStatusMapped: Record<string, number> = {};
  for (const [k, v] of Object.entries(byStatus)) {
    byStatusMapped[k] = asInt(v);
  }

  const bySupport = asRecord(distribution.by_support_level) ?? {};
  const bySupportMapped: Record<string, number> = {};
  for (const [k, v] of Object.entries(bySupport)) {
    bySupportMapped[k] = asInt(v);
  }

  const bySt = asRecord(distribution.by_status) ?? {};
  const byStMapped: Record<string, number> = {};
  for (const [k, v] of Object.entries(bySt)) {
    byStMapped[k] = asInt(v);
  }

  return {
    period: {
      from: String(period.from ?? ""),
      to: String(period.to ?? ""),
      days: asInt(period.days),
      prevFrom: String(period.prev_from ?? ""),
      prevTo: String(period.prev_to ?? ""),
    },
    pulse: {
      newSupporters: asInt(pulse.new_supporters),
      growthPct: pulse.growth_pct === null || pulse.growth_pct === undefined ? null : asInt(pulse.growth_pct),
      resolvedDemands: asInt(pulse.resolved_demands),
      criticalTerritories: asInt(pulse.critical_territories),
    },
    summary: {
      totalSupporters: asInt(summary.total_supporters),
      strongSupport: asInt(summary.strong_support),
      undecided: asInt(summary.undecided),
      opposition: asInt(summary.opposition),
      leaderships: asInt(summary.leaderships),
      openDemands: asInt(summary.open_demands),
      resolvedInPeriod: asInt(summary.resolved_in_period),
      newSupportersInPeriod: asInt(summary.new_supporters_in_period),
    },
    territories: {
      critical: asArray(territories.critical).map((r) => mapTerritory(asRecord(r) ?? {})),
      promising: asArray(territories.promising).map((r) => mapTerritory(asRecord(r) ?? {})),
    },
    funnel: {
      interessado: asInt(funnel.interessado),
      apoiador: asInt(funnel.apoiador),
      apoioForte: asInt(funnel.apoio_forte),
      lideranca: asInt(funnel.lideranca),
      newInPeriod: asInt(funnel.new_in_period),
    },
    demands: {
      byStatus: byStatusMapped,
      unassigned: asInt(demands.unassigned),
      avgResolutionDays: asInt(demands.avg_resolution_days),
      byCategory: asArray(demands.by_category).map((c) => {
        const row = asRecord(c) ?? {};
        return { category: String(row.category ?? ""), count: asInt(row.count) };
      }),
    },
    growthSeries: asArray(root.growth_series).map((g) => {
      const row = asRecord(g) ?? {};
      return { label: String(row.label ?? ""), apoiadores: asInt(row.apoiadores) };
    }),
    distribution: {
      bySupportLevel: bySupportMapped,
      byStatus: byStMapped,
    },
    exportCounts: {
      supporters: asInt(exportCounts.supporters),
      demands: asInt(exportCounts.demands),
      leaderships: asInt(exportCounts.leaderships),
      territories: asInt(exportCounts.territories),
      agenda: asInt(exportCounts.agenda),
      activities: asInt(exportCounts.activities),
    },
    filterOptions: {
      neighborhoods: asArray(filterOptions.neighborhoods).map(String),
      cities: asArray(filterOptions.cities).map(String),
      sources: asArray(filterOptions.sources).map(String),
      leaderships: asArray(filterOptions.leaderships).map((l) => {
        const row = asRecord(l) ?? {};
        return { id: String(row.id ?? ""), name: String(row.name ?? "") };
      }),
      assignees: asArray(filterOptions.assignees).map((a) => {
        const row = asRecord(a) ?? {};
        return { id: String(row.id ?? ""), name: String(row.name ?? "") };
      }),
    },
    pollMeta: asArray(root.poll_meta).map((p) => {
      const row = asRecord(p) ?? {};
      return {
        type: String(row.type ?? ""),
        title: row.title != null ? String(row.title) : null,
        updatedAt: String(row.updated_at ?? ""),
      };
    }),
  };
}
