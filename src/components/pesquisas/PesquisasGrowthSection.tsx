import { TrendingUp } from "lucide-react";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { ReportsGrowthChart } from "@/components/reports/ReportsGrowthChart";
import { narrativeGrowth } from "@/lib/chart-narratives";

export function PesquisasGrowthSection({
  growthSeries,
  newInPeriod,
  isLoading,
  index = 2,
}: {
  growthSeries: { label: string; apoiadores: number }[];
  newInPeriod?: number;
  isLoading?: boolean;
  index?: number;
}) {
  const narrative = narrativeGrowth(growthSeries);

  return (
    <ReportsSection
      variant="summary"
      index={index}
      title="Crescimento de apoiadores"
      description="Entrada diária de apoiadores no período — cada dia do filtro aparece no gráfico (dias sem cadastro = zero)."
      icon={TrendingUp}
      unstyledBody
    >
      <div className="pesquisas-growth-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="pesquisas-source-badge pesquisas-source-badge--crm">
            Base real do CRM
          </span>
          {!isLoading && newInPeriod !== undefined && (
            <span className="text-xs font-semibold tabular-nums text-foreground">
              +{newInPeriod} no período
            </span>
          )}
        </div>
        {narrative && (
          <p className="mb-3 text-xs font-medium leading-relaxed text-primary/90">{narrative}</p>
        )}
        <ReportsGrowthChart data={growthSeries} />
      </div>
    </ReportsSection>
  );
}
