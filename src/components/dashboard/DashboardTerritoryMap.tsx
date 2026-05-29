import { Link } from "@tanstack/react-router";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { EnrichedTerritory } from "@/services/dashboard-intelligence";

const riskLabel = {
  critico: "Risco alto",
  atencao: "Atenção",
  promissor: "Promissor",
} as const;

function TerritoryRow({
  territory,
  variant,
  rank,
  canLink,
}: {
  territory: EnrichedTerritory;
  variant: "critical" | "promising";
  rank: number;
  canLink: boolean;
}) {
  const score = territory.displayScore;
  return (
    <div
      className={cn(
        "dashboard-territory-row rounded-lg border border-border/60 bg-background/50 p-3 transition-theme",
        variant === "critical" && territory.riskLevel === "critico" && "border-destructive/20",
        variant === "promising" && "border-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted/80 text-[10px] font-bold text-muted-foreground">
              {rank}
            </span>
            <p className="truncate text-sm font-semibold text-foreground">{territory.neighborhood}</p>
          </div>
          <p className="mt-1 text-[10px] font-medium text-muted-foreground">{riskLabel[territory.riskLevel]}</p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">{score}</span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted/80">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            variant === "critical" ? "bg-destructive/70" : "bg-primary",
          )}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        <span>Base {territory.supporters}</span>
        <span>Forte {territory.strongSupportPct}%</span>
        {variant === "critical" ? (
          <span>Indecisos {territory.undecidedPct}%</span>
        ) : (
          <span>Oposição {territory.oppositionPct}%</span>
        )}
      </div>
      {canLink && (
        <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-[11px]" asChild>
          <Link
            to="/eleitores"
            search={{ bairro: territory.territoryLabel || territory.neighborhood }}
          >
            Ver território
          </Link>
        </Button>
      )}
    </div>
  );
}

function TerritoryColumn({
  title,
  subtitle,
  items,
  variant,
  canLink,
}: {
  title: string;
  subtitle: string;
  items: EnrichedTerritory[];
  variant: "critical" | "promising";
  canLink: boolean;
}) {
  return (
    <div className="dashboard-territory-column min-w-0 space-y-3">
      <div className="dashboard-territory-column-head">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 px-3 py-4 text-xs text-muted-foreground">
          {variant === "critical" ? "Sem territórios críticos no momento." : "Sem oportunidades destacadas."}
        </p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 3).map((t, i) => (
            <TerritoryRow key={t.neighborhood} territory={t} variant={variant} rank={i + 1} canLink={canLink} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardTerritoryMap({
  critical,
  promising,
  canViewTerritoryLink,
  sectionIndex,
}: {
  critical: EnrichedTerritory[];
  promising: EnrichedTerritory[];
  canViewTerritoryLink: boolean;
  sectionIndex: number;
}) {
  return (
    <DashboardSection
      variant="territory"
      index={sectionIndex}
      title="Mapa estratégico da campanha"
      description="Riscos e oportunidades territoriais no mesmo painel — duas leituras, uma seção."
      icon={Map}
      unstyledBody
      bodyClassName="dashboard-territory-map p-4 md:p-5"
    >
      <div className="dashboard-territory-columns grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <TerritoryColumn
          title="Territórios críticos"
          subtitle="Prioridade imediata de campo"
          items={critical}
          variant="critical"
          canLink={canViewTerritoryLink}
        />
        <TerritoryColumn
          title="Oportunidades"
          subtitle="Regiões para acelerar conversão"
          items={promising}
          variant="promising"
          canLink={canViewTerritoryLink}
        />
      </div>
    </DashboardSection>
  );
}
