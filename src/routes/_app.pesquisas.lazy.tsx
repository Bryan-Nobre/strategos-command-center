import { createLazyFileRoute, getRouteApi } from "@tanstack/react-router";
import { RoutePendingFallback } from "@/components/common/RoutePendingFallback";
import { useMemo, useCallback } from "react";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { PlanLimitNotice } from "@/components/common/PlanLimitNotice";
import { PesquisasHero } from "@/components/pesquisas/PesquisasHero";
import { PesquisasFiltersBar } from "@/components/pesquisas/PesquisasFiltersBar";
import { PesquisasGrowthSection } from "@/components/pesquisas/PesquisasGrowthSection";
import { PesquisasSurveysSection } from "@/components/pesquisas/PesquisasSurveysSection";
import { PesquisasPageSkeleton } from "@/components/pesquisas/PesquisasPageSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { BarChart3 } from "lucide-react";
import { ReportsKpiStrip } from "@/components/reports/ReportsKpiStrip";
import { ReportsTerritorySection } from "@/components/reports/ReportsTerritorySection";
import { useTenant } from "@/hooks/use-tenant";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { usePollSnapshots, useUpsertPollSnapshot } from "@/hooks/use-dashboard";
import { useReportsSummary } from "@/hooks/use-reports";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { resolveAnalyticsDateRange } from "@/lib/analytics-period";
import {
  serializePesquisasSearch,
  pesquisasFiltersToRpcParams,
  type PesquisasListSearch,
} from "@/lib/list-search/pesquisas";

const pesquisasRoute = getRouteApi("/_app/pesquisas");

export const Route = createLazyFileRoute("/_app/pesquisas")({
  component: PesquisasPage,
  pendingComponent: RoutePendingFallback,
});

const DEFAULT_SEARCH: PesquisasListSearch = { period: "30d" };

function PesquisasPage() {
  const { tenantId } = useTenant();
  const planGate = usePlanGate(tenantId);
  const perms = useCrudPermissions("polls");
  const search = pesquisasRoute.useSearch();
  const { setSearch } = useSyncedListSearch({
    search,
    serialize: serializePesquisasSearch,
  });

  const range = useMemo(() => resolveAnalyticsDateRange(search), [search]);
  const rpcFilters = useMemo(() => pesquisasFiltersToRpcParams(search), [search]);

  const queryParams = useMemo(
    () =>
      tenantId
        ? {
            tenantId,
            from: range.from,
            to: range.to,
            ...rpcFilters,
          }
        : null,
    [tenantId, range.from, range.to, rpcFilters],
  );

  const { data: summary, isLoading: summaryLoading, isError, refetch } = useReportsSummary(queryParams);
  const { data: polls, isLoading: pollsLoading } = usePollSnapshots(tenantId);
  const upsertMutation = useUpsertPollSnapshot(tenantId);

  const pollsLocked = !planGate.canEditPolls || !perms.canUpdate;

  const intencaoPoll = polls?.find((p) => p.snapshot_type === "intencao_voto");
  const aprovacaoPoll = polls?.find((p) => p.snapshot_type === "aprovacao_bairro");

  const intencaoSaved = (intencaoPoll?.data ?? []) as { candidato: string; valor: number }[];
  const aprovacaoSaved = (aprovacaoPoll?.data ?? []) as { bairro: string; aprovacao: number }[];

  const resetFilters = useCallback(() => {
    setSearch(DEFAULT_SEARCH);
  }, [setSearch]);

  const pollsEmpty =
    !pollsLoading && !intencaoPoll && !aprovacaoPoll && !pollsLocked;

  const showSkeleton = summaryLoading && !summary;

  return (
    <ModuleRouteGuard module="polls">
      <div className="reports-analytics pesquisas-page mx-auto w-full max-w-7xl">
        {showSkeleton ? (
          <PesquisasPageSkeleton />
        ) : (
          <>
            <PesquisasHero range={range} pulse={summary?.pulse} />

            <div className="mt-4">
              <PesquisasFiltersBar
                search={search}
                neighborhoods={summary?.filterOptions.neighborhoods}
                onChange={setSearch}
                onReset={resetFilters}
              />
            </div>

            {pollsLocked && (
              <div className="mt-4">
                <PlanLimitNotice message="Edição de pesquisas eleitorais não está disponível no seu plano ou cargo. Dados do CRM e leituras permanecem visíveis." />
              </div>
            )}

            {isError && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Não foi possível carregar os indicadores do período.{" "}
                <button type="button" className="underline" onClick={() => void refetch()}>
                  Tentar novamente
                </button>
              </div>
            )}

            <div className="reports-stack">
              <ReportsKpiStrip
                summary={summary?.summary}
                funnel={summary?.funnel}
                isLoading={summaryLoading}
              />

              <PesquisasGrowthSection
                growthSeries={summary?.growthSeries ?? []}
                newInPeriod={summary?.summary.newSupportersInPeriod}
                isLoading={summaryLoading}
                index={2}
              />

              <ReportsTerritorySection
                territories={summary?.territories ?? { critical: [], promising: [] }}
                neighborhoodFilter={search.bairro}
              />

              <PesquisasSurveysSection
                intencaoSaved={intencaoSaved}
                aprovacaoSaved={aprovacaoSaved}
                intencaoUpdatedAt={intencaoPoll?.recorded_at}
                aprovacaoUpdatedAt={aprovacaoPoll?.recorded_at}
                neighborhoodFilter={search.bairro}
                upsertMutation={upsertMutation}
                pollsLocked={pollsLocked}
                isLoading={pollsLoading}
                index={4}
              />

              {pollsEmpty && (
                <EmptyState
                  icon={BarChart3}
                  title="Nenhuma pesquisa cadastrada"
                  description="Registre intenção de voto e aprovação por bairro para acompanhar a evolução eleitoral."
                />
              )}
            </div>
          </>
        )}
      </div>
    </ModuleRouteGuard>
  );
}
