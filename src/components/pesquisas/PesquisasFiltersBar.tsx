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
import type { PesquisasListSearch } from "@/lib/list-search/pesquisas";

export function PesquisasFiltersBar({
  search,
  neighborhoods,
  onChange,
  onReset,
}: {
  search: PesquisasListSearch;
  neighborhoods?: string[];
  onChange: (next: PesquisasListSearch) => void;
  onReset: () => void;
}) {
  return (
    <div className="reports-filters">
      <div className="reports-filters-head">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          Período e território
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onReset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Limpar
        </Button>
      </div>

      <DatePeriodFilter
        className="mb-3 border-0 bg-transparent p-0"
        value={{ period: search.period ?? "30d", from: search.from, to: search.to }}
        onChange={(next) =>
          onChange({
            ...search,
            period: next.period as PesquisasListSearch["period"],
            from: next.from,
            to: next.to,
          })
        }
      />

      <div className="reports-filters-grid">
        <TerritoryCepFilter
          className="sm:col-span-2"
          compact
          label="CEP (filtra território e aprovação)"
          hint="O bairro reconhecido pelo CEP filtra mapa e gráfico de aprovação."
          activeFilter={
            search.bairro ? { neighborhood: search.bairro, city: search.cidade ?? null } : null
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

        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground">Bairro (CRM)</label>
          <Select
            value={search.bairro ?? "all"}
            onValueChange={(v) => onChange({ ...search, bairro: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os bairros</SelectItem>
              {(neighborhoods ?? []).map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
