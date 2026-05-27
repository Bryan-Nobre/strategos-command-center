import { lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { ReportsGrowthChart } from "@/components/reports/ReportsGrowthChart";
import { narrativeApproval, narrativeIntention } from "@/lib/chart-narratives";
import type { ReportsSummary } from "@/services/reports";

const DashboardCharts = lazy(() =>
  import("@/components/dashboard/DashboardCharts").then((m) => ({ default: m.DashboardCharts })),
);

type IntencaoRow = { candidato: string; valor: number };
type AprovacaoRow = { bairro: string; aprovacao: number };

export function ReportsElectoralSection({
  growthSeries,
  intencao,
  aprovacao,
  pollsLoading,
  pollMeta,
}: {
  growthSeries: ReportsSummary["growthSeries"];
  intencao: IntencaoRow[];
  aprovacao: AprovacaoRow[];
  pollsLoading?: boolean;
  pollMeta?: ReportsSummary["pollMeta"];
}) {
  const narrativeInt = narrativeIntention(intencao);
  const narrativeApr = narrativeApproval(aprovacao);

  const intencaoUpdated = pollMeta?.find((p) => p.type === "intencao_voto")?.updatedAt;
  const aprovacaoUpdated = pollMeta?.find((p) => p.type === "aprovacao_bairro")?.updatedAt;

  return (
    <ReportsSection
      variant="electoral"
      index={6}
      title="Análise eleitoral"
      description="Dados reais do CRM separados de pesquisas declaradas manualmente."
      icon={BarChart3}
      actions={
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
          <Link to="/pesquisas">
            <BarChart3 className="h-3.5 w-3.5" />
            Editar pesquisas
          </Link>
        </Button>
      }
      unstyledBody
    >
      <div className="space-y-4">
        <div className="reports-electoral-card rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="reports-data-badge reports-data-badge--real">Base real do CRM</span>
            <span className="text-xs text-muted-foreground">Novos cadastros por mês no período</span>
          </div>
          <ReportsGrowthChart data={growthSeries} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="reports-electoral-card rounded-lg border border-border/70 bg-background/40 p-4">
            <div className="mb-3 space-y-1">
              <span className="reports-data-badge reports-data-badge--survey">Última pesquisa cadastrada</span>
              <h3 className="text-sm font-semibold">Intenção de voto</h3>
              {intencaoUpdated && (
                <p className="text-[10px] text-muted-foreground">
                  Atualizado: {new Date(intencaoUpdated).toLocaleDateString("pt-BR")}
                </p>
              )}
              {narrativeInt && (
                <p className="text-xs font-medium text-primary/90">{narrativeInt}</p>
              )}
            </div>
            {pollsLoading ? (
              <Skeleton className="h-44 w-full rounded-lg" />
            ) : intencao.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Nenhum snapshot em Pesquisas.
              </p>
            ) : (
              <Suspense fallback={<Skeleton className="h-44 w-full rounded-lg" />}>
                <DashboardCharts type="intencao" data={intencao} />
              </Suspense>
            )}
          </div>

          <div className="reports-electoral-card rounded-lg border border-border/70 bg-background/40 p-4">
            <div className="mb-3 space-y-1">
              <span className="reports-data-badge reports-data-badge--survey">Dados declarados</span>
              <h3 className="text-sm font-semibold">Aprovação por bairro</h3>
              {aprovacaoUpdated && (
                <p className="text-[10px] text-muted-foreground">
                  Atualizado: {new Date(aprovacaoUpdated).toLocaleDateString("pt-BR")}
                </p>
              )}
              {narrativeApr && (
                <p className="text-xs font-medium text-primary/90">{narrativeApr}</p>
              )}
            </div>
            {pollsLoading ? (
              <Skeleton className="h-44 w-full rounded-lg" />
            ) : aprovacao.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Nenhum snapshot em Pesquisas.
              </p>
            ) : (
              <Suspense fallback={<Skeleton className="h-44 w-full rounded-lg" />}>
                <DashboardCharts type="aprovacao" data={aprovacao} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </ReportsSection>
  );
}
