import {
  formatDatePeriodLabel,
  resolveDatePeriodRange,
  type DatePeriodRange,
} from "@/lib/date-period";
import type { RelatoriosListSearch, ReportsPeriodPreset } from "@/lib/list-search/relatorios";

export type ReportsDateRange = DatePeriodRange & { preset: ReportsPeriodPreset };

export function resolveReportsDateRange(search: RelatoriosListSearch): ReportsDateRange {
  const mapped = resolveDatePeriodRange(
    {
      period:
        search.period === "7d"
          ? "7d"
          : search.period === "90d"
            ? "90d"
            : search.period === "custom"
              ? "custom"
              : "30d",
      from: search.from,
      to: search.to,
    },
    { defaultPreset: "30d" },
  )!;
  return mapped as ReportsDateRange;
}

export function formatPeriodLabel(range: ReportsDateRange): string {
  if (range.preset === "7d") return "Últimos 7 dias";
  if (range.preset === "30d") return "Últimos 30 dias";
  if (range.preset === "90d") return "Últimos 90 dias";
  return formatDatePeriodLabel(range);
}
