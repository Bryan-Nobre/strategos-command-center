import { format, subDays } from "date-fns";

export type AnalyticsPeriodPreset = "today" | "7d" | "30d" | "custom";

export type AnalyticsDateRange = {
  from: string;
  to: string;
  preset: AnalyticsPeriodPreset;
};

export type AnalyticsPeriodSearch = {
  period?: AnalyticsPeriodPreset;
  from?: string;
  to?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function resolveAnalyticsDateRange(search: AnalyticsPeriodSearch): AnalyticsDateRange {
  const today = new Date();
  const to = format(today, "yyyy-MM-dd");

  if (search.period === "custom" && search.from && search.to && DATE_RE.test(search.from) && DATE_RE.test(search.to)) {
    if (search.from > search.to) {
      return { from: to, to, preset: "today" };
    }
    return { from: search.from, to: search.to, preset: "custom" };
  }

  const preset = search.period ?? "30d";

  if (preset === "today") {
    return { from: to, to, preset: "today" };
  }

  const days = preset === "7d" ? 7 : 30;
  const from = format(subDays(today, days - 1), "yyyy-MM-dd");
  return { from, to, preset };
}

export function formatAnalyticsPeriodLabel(range: AnalyticsDateRange): string {
  if (range.preset === "today") return "Hoje";
  if (range.preset === "7d") return "Últimos 7 dias";
  if (range.preset === "30d") return "Últimos 30 dias";
  return `${range.from} — ${range.to}`;
}
