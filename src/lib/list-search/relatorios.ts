import { Constants } from "@/types/supabase";
import { omitEmpty, pickEnum, trimParam } from "@/lib/list-search/utils";

const STATUSES = Constants.public.Enums.supporter_status;
const SUPPORT_LEVELS = Constants.public.Enums.support_level;
const SOURCES = ["landing", "import", "manual"] as const;

export type ReportsPeriodPreset = "7d" | "30d" | "90d" | "custom";

export type RelatoriosListSearch = {
  period?: ReportsPeriodPreset;
  from?: string;
  to?: string;
  bairro?: string;
  cidade?: string;
  origem?: string;
  status?: string;
  apoio?: string;
  lideranca?: string;
  responsavel?: string;
  foco?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;

function optionalUuidParam(value: unknown): string | undefined {
  const trimmed = trimParam(value);
  if (!trimmed) return undefined;
  return UUID_RE.test(trimmed) ? trimmed : undefined;
}

export function parseRelatoriosSearch(raw: Record<string, unknown>): RelatoriosListSearch {
  const period = pickEnum(raw.period, ["7d", "30d", "90d", "custom"] as const) ?? "30d";
  const from = trimParam(raw.from);
  const to = trimParam(raw.to);

  return omitEmpty({
    period,
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
    bairro: trimParam(raw.bairro),
    cidade: trimParam(raw.cidade),
    origem: pickEnum(raw.origem, SOURCES),
    status: pickEnum(raw.status, STATUSES),
    apoio: pickEnum(raw.apoio, SUPPORT_LEVELS),
    lideranca: optionalUuidParam(raw.lideranca),
    responsavel: optionalUuidParam(raw.responsavel),
    foco: trimParam(raw.foco),
  }) as RelatoriosListSearch;
}

export function serializeRelatoriosSearch(filters: RelatoriosListSearch): RelatoriosListSearch {
  return omitEmpty({
    period: filters.period ?? "30d",
    from: filters.from,
    to: filters.to,
    bairro: trimParam(filters.bairro),
    cidade: trimParam(filters.cidade),
    origem: pickEnum(filters.origem, SOURCES),
    status: pickEnum(filters.status, STATUSES),
    apoio: pickEnum(filters.apoio, SUPPORT_LEVELS),
    lideranca: trimParam(filters.lideranca),
    responsavel: trimParam(filters.responsavel),
    foco: trimParam(filters.foco),
  }) as RelatoriosListSearch;
}

export function reportsFiltersToRpcParams(search: RelatoriosListSearch) {
  return {
    neighborhood: search.bairro || null,
    city: search.cidade || null,
    source: search.origem || null,
    status: search.status || null,
    supportLevel: search.apoio || null,
    leadershipId: search.lideranca || null,
    assignedTo: search.responsavel || null,
  };
}
