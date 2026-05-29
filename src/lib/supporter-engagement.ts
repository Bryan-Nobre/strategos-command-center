/** Temperatura política operacional (derivada no backend). */

export type SupporterEngagementStatus = "hot" | "warm" | "cold" | "inactive";

export const ENGAGEMENT_STATUS_LABELS: Record<SupporterEngagementStatus, string> = {
  hot: "Quente",
  warm: "Morno",
  cold: "Frio",
  inactive: "Inativo",
};

export type EleitoresEngagementFilter =
  | "all"
  | "active_7d"
  | "hot"
  | "warm"
  | "cold"
  | "inactive";

export const ELEITORES_ENGAGEMENT_FILTER_LABELS: Record<EleitoresEngagementFilter, string> = {
  all: "Todas temperaturas",
  active_7d: "Ativos (7 dias)",
  hot: "Quentes",
  warm: "Mornos",
  cold: "Frios",
  inactive: "Sem atividade recente",
};

export function isEngagementStatus(value: string): value is SupporterEngagementStatus {
  return value === "hot" || value === "warm" || value === "cold" || value === "inactive";
}

export function matchesEngagementFilter(
  row: {
    engagement_status?: string | null;
    last_activity_at?: string | null;
  },
  filter: EleitoresEngagementFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "active_7d") {
    if (!row.last_activity_at) return false;
    return new Date(row.last_activity_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }
  if (filter === "inactive") {
    return row.engagement_status === "inactive" || !row.last_activity_at;
  }
  return row.engagement_status === filter;
}
