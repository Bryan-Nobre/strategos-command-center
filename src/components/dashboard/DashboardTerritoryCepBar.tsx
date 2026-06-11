import { MapPin } from "lucide-react";
import { TerritoryCepFilter } from "@/components/territory/TerritoryCepFilter";
import type { TerritoryFilter } from "@/lib/territory-filter";
import { territoryFilterLabel } from "@/lib/territory-filter";

export function DashboardTerritoryCepBar({
  activeFilter,
  onResolved,
  onClear,
}: {
  activeFilter: TerritoryFilter | null;
  onResolved: (filter: TerritoryFilter) => void;
  onClear: () => void;
}) {
  const label = territoryFilterLabel(activeFilter);

  return (
    <div className="dashboard-territory-cep mb-8 rounded-xl border border-border/70 bg-card/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        Filtro territorial por CEP
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {label
          ? `Mapa estratégico e aprovação por bairro focados em ${label}.`
          : "Informe um CEP para focar o mapa e a aprovação no bairro reconhecido (ex.: Ceilândia)."}
      </p>
      <TerritoryCepFilter
        activeFilter={activeFilter}
        onResolved={onResolved}
        onClear={onClear}
        compact
        hint=""
      />
    </div>
  );
}
