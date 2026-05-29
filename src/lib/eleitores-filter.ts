import { subDays, startOfDay } from "date-fns";
import type { EleitoresFilterState } from "@/lib/list-search/eleitores";
import { matchesEngagementFilter } from "@/lib/supporter-engagement";

export type SupporterListItem = {
  id: string;
  name: string;
  phone: string | null;
  neighborhood: string | null;
  normalized_neighborhood?: string | null;
  normalized_city?: string | null;
  city: string | null;
  email?: string | null;
  is_possible_duplicate?: boolean;
  electoral_zone: string | null;
  electoral_section: string | null;
  status: string;
  support_level: string;
  notes: string | null;
  tags: string[] | null;
  /** Espelho da liderança primária (compatibilidade). */
  leadership_id: string | null;
  source: string;
  interest: string | null;
  created_at: string;
  /** Enriquecido via supporter_political_summary_v (BLOCO 2). */
  political_link_count?: number;
  political_leadership_ids?: string[];
  political_leadership_names?: string[];
  primary_leadership_name?: string | null;
  last_activity_at?: string | null;
  activity_score?: number | null;
  engagement_status?: string | null;
};

function matchesPeriod(createdAt: string, period: EleitoresFilterState["period"]): boolean {
  if (period === "all") return true;
  const created = startOfDay(new Date(createdAt));
  const today = startOfDay(new Date());
  if (period === "today") return created.getTime() === today.getTime();
  const days = period === "7d" ? 7 : 30;
  const from = startOfDay(subDays(today, days - 1));
  return created >= from && created <= today;
}

export function filterSupporters(
  supporters: SupporterListItem[],
  filters: EleitoresFilterState,
  query: string,
): SupporterListItem[] {
  const effectiveOrigem = filters.view === "landing" ? "landing" : filters.origem;

  return supporters.filter((e) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      [e.name, e.phone, e.neighborhood, e.city, e.interest, ...(e.tags ?? [])].some((f) =>
        f?.toLowerCase().includes(q),
      );
    const matchesStatus = filters.status === "all" || e.status === filters.status;
    const matchesNeighborhood =
      filters.bairro === "all" ||
      e.neighborhood === filters.bairro ||
      (e.normalized_neighborhood ?? e.neighborhood) === filters.bairro;
    const matchesLeadership = (() => {
      if (filters.lideranca === "all") return true;
      if (filters.lideranca === "none") {
        const ids = e.political_leadership_ids;
        if (ids && ids.length > 0) return false;
        return !e.leadership_id;
      }
      const ids = e.political_leadership_ids;
      if (ids && ids.length > 0) return ids.includes(filters.lideranca);
      return e.leadership_id === filters.lideranca;
    })();
    const matchesSupport = filters.apoio === "all" || e.support_level === filters.apoio;
    const matchesTag =
      !filters.tag ||
      (e.tags ?? []).some((t) => t.toLowerCase().includes(filters.tag.toLowerCase()));
    const matchesOrigem = effectiveOrigem === "all" || e.source === effectiveOrigem;
    const matchesPeriodFilter = matchesPeriod(e.created_at, filters.period);
    const matchesEngagement = matchesEngagementFilter(e, filters.engagement);

    return (
      matchesQuery &&
      matchesStatus &&
      matchesNeighborhood &&
      matchesLeadership &&
      matchesSupport &&
      matchesTag &&
      matchesOrigem &&
      matchesPeriodFilter &&
      matchesEngagement
    );
  });
}

export function countNewInPeriod(supporters: SupporterListItem[], days: number): number {
  const today = startOfDay(new Date());
  const from = startOfDay(subDays(today, days - 1));
  return supporters.filter((s) => {
    const created = startOfDay(new Date(s.created_at));
    return created >= from && created <= today;
  }).length;
}
