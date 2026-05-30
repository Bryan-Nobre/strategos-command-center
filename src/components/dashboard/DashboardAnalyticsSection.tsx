import { lazy, Suspense, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { narrativeApproval, narrativeIntention } from "@/lib/chart-narratives";
import { filterApprovalByNeighborhood } from "@/lib/territory-filter";

const DashboardCharts = lazy(() =>
  import("./DashboardCharts").then((m) => ({ default: m.DashboardCharts })),
);

type IntencaoRow = { candidato: string; valor: number };
type AprovacaoRow = { bairro: string; aprovacao: number };

export function DashboardAnalyticsSection({
  intencao,
  aprovacao,
  neighborhoodFilter,
  isLoading,
  sectionIndex,
}: {
  intencao: IntencaoRow[];
  aprovacao: AprovacaoRow[];
  neighborhoodFilter?: string | null;
  isLoading: boolean;
  sectionIndex: number;
}) {
  const filteredAprovacao = useMemo(
    () => filterApprovalByNeighborhood(aprovacao, neighborhoodFilter),
    [aprovacao, neighborhoodFilter],
  );

  const narrativeInt = narrativeIntention(intencao);
  const narrativeApr = narrativeApproval(filteredAprovacao);

  return (
    <DashboardSection
      variant="analytics"
      index={sectionIndex}
      title="Cenário eleitoral (pesquisa manual)"
      description="Dados de instituto ou levantamento interno — não refletem automaticamente a base de apoiadores do CRM."
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
            <p className="text-xs text-muted-foreground">
              {neighborhoodFilter
                ? `Filtrado pelo bairro do CEP: ${neighborhoodFilter}.`
                : "Índice por região (snapshot manual · pode divergir do território operacional)"}
            </p>
            {narrativeApr && (
              <p className="text-xs font-medium leading-relaxed text-primary/90">{narrativeApr}</p>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : filteredAprovacao.length === 0 ? (
            <p className="flex h-52 items-center justify-center text-xs text-muted-foreground">
              {neighborhoodFilter
                ? `Nenhum dado de aprovação para "${neighborhoodFilter}" no snapshot.`
                : "Nenhum snapshot de aprovação cadastrado."}
            </p>
          ) : (
            <Suspense fallback={<Skeleton className="h-52 w-full rounded-lg" />}>
              <DashboardCharts type="aprovacao" data={filteredAprovacao} />
            </Suspense>
          )}
        </div>
      </div>
    </DashboardSection>
  );
}
