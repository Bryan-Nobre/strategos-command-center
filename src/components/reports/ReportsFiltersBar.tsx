import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TerritoryCepFilter } from "@/components/territory/TerritoryCepFilter";
import { DatePeriodFilter } from "@/components/filters/DatePeriodFilter";
import { SUPPORT_LEVEL_LABELS, SUPPORTER_STATUS_LABELS } from "@/types/domain";
import type { RelatoriosListSearch } from "@/lib/list-search/relatorios";
import type { ReportsSummary } from "@/services/reports";

const SOURCE_LABELS: Record<string, string> = {
  landing: "Landing",
  import: "Importação",
  manual: "Manual",
};

export function ReportsFiltersBar({
  search,
  filterOptions,
  onChange,
  onReset,
}: {
  search: RelatoriosListSearch;
  filterOptions?: ReportsSummary["filterOptions"];
  onChange: (next: RelatoriosListSearch) => void;
  onReset: () => void;
}) {
  return (
    <div className="reports-filters">
      <div className="reports-filters-head">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          Filtros globais
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onReset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Limpar
        </Button>
      </div>

      <DatePeriodFilter
        className="mb-3 border-0 bg-transparent p-0"
        value={{
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
        }}
        onChange={(next) =>
          onChange({
            ...search,
            period:
              next.period === "today"
                ? "30d"
                : (next.period as RelatoriosListSearch["period"]) ?? "30d",
            from: next.from,
            to: next.to,
          })
        }
        presets={[
          { value: "7d", label: "7 dias" },
          { value: "30d", label: "30 dias" },
          { value: "90d", label: "90 dias" },
          { value: "custom", label: "Personalizado" },
        ]}
      />

      <div className="reports-filters-grid">
        <TerritoryCepFilter
          className="sm:col-span-2"
          compact
          label="CEP (filtra mapa e aprovação)"
          hint="Ex.: CEP de Ceilândia filtra território e aprovação por bairro."
          activeFilter={
            search.bairro
              ? { neighborhood: search.bairro, city: search.cidade ?? null }
              : null
          }
          onResolved={(filter) =>
            onChange({
              ...search,
              bairro: filter.neighborhood,
              cidade: filter.city ?? undefined,
            })
          }
          onClear={() => onChange({ ...search, bairro: undefined, cidade: undefined })}
        />

        <FilterSelect
          label="Bairro"
          value={search.bairro ?? "all"}
          onValueChange={(v) => onChange({ ...search, bairro: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: "Todos" },
            ...(filterOptions?.neighborhoods ?? []).map((n) => ({ value: n, label: n })),
          ]}
        />

        <FilterSelect
          label="Cidade"
          value={search.cidade ?? "all"}
          onValueChange={(v) => onChange({ ...search, cidade: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: "Todas" },
            ...(filterOptions?.cities ?? []).map((c) => ({ value: c, label: c })),
          ]}
        />

        <FilterSelect
          label="Origem"
          value={search.origem ?? "all"}
          onValueChange={(v) => onChange({ ...search, origem: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: "Todas" },
            ...(filterOptions?.sources ?? []).map((s) => ({
              value: s,
              label: SOURCE_LABELS[s] ?? s,
            })),
          ]}
        />

        <FilterSelect
          label="Status político"
          value={search.status ?? "all"}
          onValueChange={(v) => onChange({ ...search, status: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: "Todos" },
            ...Object.entries(SUPPORTER_STATUS_LABELS).map(([k, label]) => ({ value: k, label })),
          ]}
        />

        <FilterSelect
          label="Apoio"
          value={search.apoio ?? "all"}
          onValueChange={(v) => onChange({ ...search, apoio: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: "Todos" },
            ...Object.entries(SUPPORT_LEVEL_LABELS).map(([k, label]) => ({ value: k, label })),
          ]}
        />

        <FilterSelect
          label="Liderança"
          value={search.lideranca ?? "all"}
          onValueChange={(v) => onChange({ ...search, lideranca: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: "Todas" },
            ...(filterOptions?.leaderships ?? []).map((l) => ({ value: l.id, label: l.name })),
          ]}
        />

        <FilterSelect
          label="Responsável"
          value={search.responsavel ?? "all"}
          onValueChange={(v) => onChange({ ...search, responsavel: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: "Todos" },
            ...(filterOptions?.assignees ?? []).map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 bg-background/80 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
