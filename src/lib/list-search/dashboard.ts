import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";
import type { DatePeriodPreset } from "@/lib/date-period";

const PERIODS = ["today", "7d", "30d", "90d", "custom"] as const;

export type DashboardListSearch = {
  period?: (typeof PERIODS)[number];
  from?: string;
  to?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDashboardSearch(raw: Record<string, unknown>): DashboardListSearch {
  const period = pickEnum(raw.period, PERIODS) ?? "30d";
  const from = trimParam(raw.from);
  const to = trimParam(raw.to);
  return omitEmpty({
    period,
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
  }) as DashboardListSearch;
}

export function serializeDashboardSearch(filters: DashboardListSearch): DashboardListSearch {
  return omitEmpty({
    period: filters.period ?? "30d",
    from: filters.from,
    to: filters.to,
  }) as DashboardListSearch;
}

export type DashboardPeriodPreset = DatePeriodPreset;
