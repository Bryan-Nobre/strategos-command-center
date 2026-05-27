import { lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { narrativeApproval, narrativeIntention } from "@/lib/chart-narratives";

const DashboardCharts = lazy(() =>
  import("./DashboardCharts").then((m) => ({ default: m.DashboardCharts })),
);

type IntencaoRow = { candidato: string; valor: number };
type AprovacaoRow = { bairro: string; aprovacao: number };

export function DashboardAnalyticsSection({
  intencao,
  aprovacao,
  isLoading,
  sectionIndex,
}: {
  intencao: IntencaoRow[];
  aprovacao: AprovacaoRow[];
  isLoading: boolean;
  sectionIndex: number;
}) {
  const narrativeInt = narrativeIntention(intencao);
  const narrativeApr = narrativeApproval(aprovacao);

  return (
    <DashboardSection
      variant="analytics"
      index={sectionIndex}
      title="Insights analíticos"
      description="Leitura rápida da última pesquisa cadastrada. Análises completas em Pesquisas."
      icon={BarChart3}
      actions={
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
          <Link to="/pesquisas">
            <BarChart3 className="h-3.5 w-3.5" />
            Abrir Pesquisas
          </Link>
        </Button>
      }
      unstyledBody
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="dashboard-analytics-card rounded-lg border border-border/70 bg-background/40 p-4">
          <div className="mb-3 space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Intenção de voto</h3>
            <p className="text-xs text-muted-foreground">Pesquisa estimulada (último snapshot)</p>
            {narrativeInt && (
              <p className="text-xs font-medium leading-relaxed text-primary/90">{narrativeInt}</p>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : (
            <Suspense fallback={<Skeleton className="h-52 w-full rounded-lg" />}>
              <DashboardCharts type="intencao" data={intencao} />
            </Suspense>
          )}
        </div>

        <div className="dashboard-analytics-card rounded-lg border border-border/70 bg-background/40 p-4">
          <div className="mb-3 space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Aprovação por bairro</h3>
            <p className="text-xs text-muted-foreground">Índice por região (último snapshot)</p>
            {narrativeApr && (
              <p className="text-xs font-medium leading-relaxed text-primary/90">{narrativeApr}</p>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : (
            <Suspense fallback={<Skeleton className="h-52 w-full rounded-lg" />}>
              <DashboardCharts type="aprovacao" data={aprovacao} />
            </Suspense>
          )}
        </div>
      </div>
    </DashboardSection>
  );
}
