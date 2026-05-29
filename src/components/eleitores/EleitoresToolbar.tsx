import {
  Filter,
  LayoutGrid,
  LayoutList,
  Globe,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EleitoresFilterState } from "@/lib/list-search/eleitores";
import { cn } from "@/lib/utils";

type OriginChip = { key: string; label: string; origem: string };

const ORIGIN_CHIPS: OriginChip[] = [
  { key: "all", label: "Todos", origem: "all" },
  { key: "landing", label: "Landing", origem: "landing" },
  { key: "manual", label: "Manual", origem: "manual" },
  { key: "import", label: "Importados", origem: "import" },
];

const PERIOD_CHIPS = [
  { key: "all", label: "Todo período", period: "all" as const },
  { key: "today", label: "Hoje", period: "today" as const },
  { key: "7d", label: "7 dias", period: "7d" as const },
  { key: "30d", label: "30 dias", period: "30d" as const },
];

export function EleitoresToolbar({
  query,
  onQueryChange,
  filters,
  onPatchFilter,
  activeFilterCount,
  onOpenFilters,
  selectedCount,
  onBulkDelete,
  canDelete,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  filters: EleitoresFilterState;
  onPatchFilter: (patch: Partial<EleitoresFilterState>) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
  canDelete: boolean;
}) {
  const effectiveOrigem = filters.view === "landing" ? "landing" : filters.origem;

  return (
    <div className="space-y-3 border-b border-border p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nome, telefone, bairro, interesse..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <ToggleGroup
          type="single"
          value={filters.view}
          onValueChange={(v) => {
            if (!v) return;
            const view = v as EleitoresFilterState["view"];
            onPatchFilter({
              view,
              ...(view === "landing" ? { origem: "landing" } : {}),
            });
          }}
          className="shrink-0 justify-start"
        >
          <ToggleGroupItem value="table" aria-label="Tabela" className="gap-1.5 px-3">
            <LayoutList className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Tabela</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Cards" className="gap-1.5 px-3">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Cards</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="landing" aria-label="Landing" className="gap-1.5 px-3">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Landing</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <Button variant="outline" size="sm" onClick={onOpenFilters} className="shrink-0">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Origem
        </span>
        {ORIGIN_CHIPS.map((chip) => (
          <Button
            key={chip.key}
            type="button"
            size="sm"
            variant={effectiveOrigem === chip.origem ? "default" : "outline"}
            className={cn("h-7 rounded-full px-3 text-xs", filters.view === "landing" && chip.origem !== "landing" && "opacity-50")}
            disabled={filters.view === "landing" && chip.origem !== "landing"}
            onClick={() => onPatchFilter({ origem: chip.origem, view: chip.origem === "landing" ? "landing" : filters.view === "landing" ? "table" : filters.view })}
          >
            {chip.label}
          </Button>
        ))}

        <span className="mx-1 hidden h-4 w-px bg-border sm:inline" aria-hidden />

        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Cadastro
        </span>
        {PERIOD_CHIPS.map((chip) => (
          <Button
            key={chip.key}
            type="button"
            size="sm"
            variant={filters.period === chip.period ? "secondary" : "ghost"}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => onPatchFilter({ period: chip.period })}
          >
            {chip.label}
          </Button>
        ))}

        {selectedCount > 0 && canDelete && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="ml-auto h-7 gap-1.5"
            onClick={onBulkDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir ({selectedCount})
          </Button>
        )}
      </div>
    </div>
  );
}
