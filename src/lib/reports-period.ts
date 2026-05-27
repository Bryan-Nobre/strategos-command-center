import { format, subDays } from "date-fns";
import type { RelatoriosListSearch, ReportsPeriodPreset } from "@/lib/list-search/relatorios";

export type ReportsDateRange = {
  from: string;
  to: string;
  preset: ReportsPeriodPreset;
};

export function resolveReportsDateRange(search: RelatoriosListSearch): ReportsDateRange {
  const today = new Date();
  const to = format(today, "yyyy-MM-dd");

  if (search.period === "custom" && search.from && search.to) {
    if (search.from > search.to) {
      const to = format(today, "yyyy-MM-dd");
      const from = format(subDays(today, 29), "yyyy-MM-dd");
      return { from, to, preset: "30d" };
    }
    return { from: search.from, to: search.to, preset: "custom" };
  }

  const preset = search.period ?? "30d";
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const from = format(subDays(today, days - 1), "yyyy-MM-dd");
  return { from, to, preset };
}

export function formatPeriodLabel(range: ReportsDateRange): string {
  if (range.preset === "7d") return "Últimos 7 dias";
  if (range.preset === "30d") return "Últimos 30 dias";
  if (range.preset === "90d") return "Últimos 90 dias";
  return `${range.from} — ${range.to}`;
}
