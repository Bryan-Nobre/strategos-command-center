import {
  formatDatePeriodLabel,
  resolveDatePeriodRange,
  type DatePeriodRange,
  type DatePeriodSearch,
} from "@/lib/date-period";

export type AnalyticsPeriodPreset = "today" | "7d" | "30d" | "90d" | "custom";
export type AnalyticsDateRange = DatePeriodRange;
export type AnalyticsPeriodSearch = DatePeriodSearch;

export function resolveAnalyticsDateRange(search: AnalyticsPeriodSearch): AnalyticsDateRange {
  const range = resolveDatePeriodRange(search, { defaultPreset: "30d" });
  if (!range) {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    return { from: to, to, preset: "30d" };
  }
  return range;
}

export function formatAnalyticsPeriodLabel(range: AnalyticsDateRange): string {
  return formatDatePeriodLabel(range);
}
