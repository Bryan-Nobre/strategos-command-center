import { format, parseISO, startOfDay, subDays } from "date-fns";

export type DatePeriodPreset = "all" | "today" | "7d" | "30d" | "90d" | "custom";

export type DatePeriodSearch = {
  period?: DatePeriodPreset;
  from?: string;
  to?: string;
};

export type DatePeriodRange = {
  from: string;
  to: string;
  preset: DatePeriodPreset;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

type ResolveOptions = {
  /** Quando período ausente ou inválido */
  defaultPreset?: DatePeriodPreset;
};

export function resolveDatePeriodRange(
  search: DatePeriodSearch,
  options: ResolveOptions = {},
): DatePeriodRange | null {
  const defaultPreset = options.defaultPreset ?? "30d";
  const effective = search.period ?? defaultPreset;

  if (effective === "all") {
    return null;
  }

  const to = todayIso();

  if (
    search.period === "custom" &&
    search.from &&
    search.to &&
    DATE_RE.test(search.from) &&
    DATE_RE.test(search.to)
  ) {
    if (search.from > search.to) {
      return { from: format(subDays(new Date(), 29), "yyyy-MM-dd"), to, preset: "30d" };
    }
    return { from: search.from, to: search.to, preset: "custom" };
  }

  const preset =
    effective === "today" ||
    effective === "7d" ||
    effective === "30d" ||
    effective === "90d" ||
    effective === "custom"
      ? effective
      : defaultPreset === "all"
        ? "30d"
        : defaultPreset;

  if (preset === "custom") {
    const from = format(subDays(new Date(), 29), "yyyy-MM-dd");
    return { from, to, preset: "30d" };
  }

  if (preset === "today") {
    return { from: to, to, preset: "today" };
  }

  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const from = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  return { from, to, preset };
}

export function formatDatePeriodLabel(range: DatePeriodRange | null): string {
  if (!range) return "Todo o período";
  if (range.preset === "today") return "Hoje";
  if (range.preset === "7d") return "Últimos 7 dias";
  if (range.preset === "30d") return "Últimos 30 dias";
  if (range.preset === "90d") return "Últimos 90 dias";
  return `${format(parseISO(range.from), "dd/MM/yyyy")} — ${format(parseISO(range.to), "dd/MM/yyyy")}`;
}

/** Filtra timestamps ISO pelo intervalo inclusivo (dia civil America/Sao_Paulo via date-fns local). */
export function isTimestampInPeriod(iso: string, range: DatePeriodRange | null): boolean {
  if (!range) return true;
  const day = format(parseISO(iso), "yyyy-MM-dd");
  return day >= range.from && day <= range.to;
}

export function isCreatedInPeriod(createdAt: string, range: DatePeriodRange | null): boolean {
  return isTimestampInPeriod(createdAt, range);
}

export const DATE_PERIOD_PRESET_OPTIONS: { value: DatePeriodPreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "custom", label: "Personalizado" },
];

export const DATE_PERIOD_WITH_ALL_OPTIONS: { value: DatePeriodPreset; label: string }[] = [
  { value: "all", label: "Todo período" },
  ...DATE_PERIOD_PRESET_OPTIONS,
];
