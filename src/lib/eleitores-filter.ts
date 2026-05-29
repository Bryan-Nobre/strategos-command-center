import { subDays, startOfDay } from "date-fns";
import type { EleitoresFilterState } from "@/lib/list-search/eleitores";

export type SupporterListItem = {
  id: string;
  name: string;
  phone: string | null;
  neighborhood: string | null;
  city: string | null;
  electoral_zone: string | null;
  electoral_section: string | null;
  status: string;
  support_level: string;
  notes: string | null;
  tags: string[] | null;
  leadership_id: string | null;
  source: string;
  interest: string | null;
  created_at: string;
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
    const matchesNeighborhood = filters.bairro === "all" || e.neighborhood === filters.bairro;
    const matchesLeadership =
      filters.lideranca === "all" ||
      (filters.lideranca === "none" ? !e.leadership_id : e.leadership_id === filters.lideranca);
    const matchesSupport = filters.apoio === "all" || e.support_level === filters.apoio;
    const matchesTag =
      !filters.tag ||
      (e.tags ?? []).some((t) => t.toLowerCase().includes(filters.tag.toLowerCase()));
    const matchesOrigem = effectiveOrigem === "all" || e.source === effectiveOrigem;
    const matchesPeriodFilter = matchesPeriod(e.created_at, filters.period);

    return (
      matchesQuery &&
      matchesStatus &&
      matchesNeighborhood &&
      matchesLeadership &&
      matchesSupport &&
      matchesTag &&
      matchesOrigem &&
      matchesPeriodFilter
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
