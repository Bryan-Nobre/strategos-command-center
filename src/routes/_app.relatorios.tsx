import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { PlanLimitNotice } from "@/components/common/PlanLimitNotice";
import { ReportsHero } from "@/components/reports/ReportsHero";
import { ReportsFiltersBar } from "@/components/reports/ReportsFiltersBar";
import { ReportsKpiStrip } from "@/components/reports/ReportsKpiStrip";
import {
  ReportsExportCenter,
  type ExportKind,
} from "@/components/reports/ReportsExportCenter";
import { ReportsTerritorySection } from "@/components/reports/ReportsTerritorySection";
import { ReportsPipeline } from "@/components/reports/ReportsPipeline";
import { ReportsDemandsSection } from "@/components/reports/ReportsDemandsSection";
import { ReportsElectoralSection } from "@/components/reports/ReportsElectoralSection";
import { ReportsPageSkeleton } from "@/components/reports/ReportsPageSkeleton";
import { useTenant } from "@/hooks/use-tenant";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { useReportsSummary } from "@/hooks/use-reports";
import { usePollSnapshots } from "@/hooks/use-dashboard";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import {
  parseRelatoriosSearch,
  serializeRelatoriosSearch,
  reportsFiltersToRpcParams,
  type RelatoriosListSearch,
} from "@/lib/list-search/relatorios";
import { resolveReportsDateRange } from "@/lib/reports-period";
import { appendExportLog, readExportLog } from "@/lib/reports-export-log";
import { downloadCsv, buildCsvFilename } from "@/lib/csv/download";
import {
  fetchSupportersForExport,
  fetchDemandsForExport,
  fetchLeadershipsForExport,
  fetchAgendaForExport,
  fetchActivitiesForExport,
  supportersToCsv,
  demandsToCsv,
  leadershipsToCsv,
  agendaToCsv,
  activitiesToCsv,
  territoriesToCsv,
  buildExecutiveConsolidatedCsv,
} from "@/services/reports-export";
import { exportExecutivePdf } from "@/lib/reports/pdf-export";

export const Route = createFileRoute("/_app/relatorios")({
  validateSearch: (search: Record<string, unknown>): RelatoriosListSearch =>
    parseRelatoriosSearch(search),
  component: RelatoriosPage,
});

const DEFAULT_SEARCH: RelatoriosListSearch = { period: "30d" };

function RelatoriosPage() {
  const { tenantId, activeTenant } = useTenant();
  const planGate = usePlanGate(tenantId);
  const perms = useCrudPermissions("reports");
  const search = Route.useSearch();
  const { setSearch } = useSyncedListSearch({
    search,
    serialize: serializeRelatoriosSearch,
  });

  const range = useMemo(() => resolveReportsDateRange(search), [search]);
  const rpcFilters = useMemo(() => reportsFiltersToRpcParams(search), [search]);

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

  const { data: summary, isLoading, isError, error, refetch } = useReportsSummary(queryParams);
  const { data: polls, isLoading: pollsLoading } = usePollSnapshots(tenantId);

  const [exportLogVersion, setExportLogVersion] = useState(0);
  const exportLog = useMemo(
    () => (tenantId ? readExportLog(tenantId) : []),
    [tenantId, exportLogVersion],
  );

  const intencao = (polls?.find((p) => p.snapshot_type === "intencao_voto")?.data ?? []) as {
    candidato: string;
    valor: number;
  }[];
  const aprovacao = (polls?.find((p) => p.snapshot_type === "aprovacao_bairro")?.data ?? []) as {
    bairro: string;
    aprovacao: number;
  }[];

  const slug = activeTenant?.slug ?? "campanha";
  const canExport = planGate.canExport && perms.canExport;

  const resetFilters = useCallback(() => {
    setSearch(DEFAULT_SEARCH);
  }, [setSearch]);

  const runExport = useCallback(
    async (kind: ExportKind) => {
      if (!canExport || !queryParams) {
        toast.error("Exportação não disponível para seu cargo ou plano.");
        return;
      }

      try {
        let csv = "";
        let rows = 0;
        let filename = "relatorio";

        switch (kind) {
          case "supporters": {
            const data = await fetchSupportersForExport(tenantId, queryParams);
            csv = supportersToCsv(data);
            rows = data.length;
            filename = "apoiadores";
            break;
          }
          case "demands": {
            const data = await fetchDemandsForExport(tenantId, {
              neighborhood: queryParams.neighborhood,
              assignedTo: queryParams.assignedTo,
            });
            csv = demandsToCsv(data);
            rows = data.length;
            filename = "demandas";
            break;
          }
          case "leaderships": {
            const data = await fetchLeadershipsForExport(tenantId);
            csv = leadershipsToCsv(data);
            rows = data.length;
            filename = "liderancas";
            break;
          }
          case "territories": {
            const terr = [
              ...(summary?.territories.critical ?? []),
              ...(summary?.territories.promising ?? []),
            ];
            const unique = Array.from(
              new Map(terr.map((t) => [t.neighborhood, t])).values(),
            );
            csv = territoriesToCsv(
              unique.map((t) => ({
                neighborhood: t.neighborhood,
                supporters: t.supporters,
                strong_support_pct: t.strongSupportPct,
                undecided_pct: t.undecidedPct,
                open_demands: t.openDemands,
                display_score: (t as { display_score?: number }).display_score ?? t.score,
              })),
            );
            rows = unique.length;
            filename = "territorios";
            break;
          }
          case "agenda": {
            const data = await fetchAgendaForExport(tenantId, range.from, range.to);
            csv = agendaToCsv(data);
            rows = data.length;
            filename = "agenda";
            break;
          }
          case "activities": {
            const data = await fetchActivitiesForExport(tenantId, range.from, range.to);
            csv = activitiesToCsv(data);
            rows = data.length;
            filename = "atividades";
            break;
          }
          case "executive": {
            csv = await buildExecutiveConsolidatedCsv(tenantId, queryParams);
            rows = (summary?.exportCounts.supporters ?? 0) + (summary?.exportCounts.demands ?? 0);
            filename = "relatorio-executivo";
            break;
          }
        }

        downloadCsv(buildCsvFilename(slug, filename), csv);
        appendExportLog(tenantId, {
          type: kind,
          label: filename,
          rows,
        });
        setExportLogVersion((v) => v + 1);
        toast.success(`Exportação concluída (${rows.toLocaleString("pt-BR")} linhas)`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha na exportação");
      }
    },
    [canExport, queryParams, tenantId, slug, summary, range.from, range.to],
  );

  const handleExecutiveExport = useCallback(async () => {
    if (!summary || !activeTenant) {
      await runExport("executive");
      return;
    }
    try {
      await exportExecutivePdf({
        generatedAt: new Date().toISOString(),
        campaignName: activeTenant.name,
        periodLabel: `${range.from} — ${range.to}`,
        summary: summary.summary,
        pulse: summary.pulse,
        criticalTerritories: summary.territories.critical,
        funnel: summary.funnel,
      });
    } catch {
      await runExport("executive");
    }
  }, [summary, activeTenant, range, runExport]);

  if (isLoading && !summary) {
    return (
      <ModuleRouteGuard module="reports">
        <ReportsPageSkeleton />
      </ModuleRouteGuard>
    );
  }

  return (
    <ModuleRouteGuard module="reports">
      <div className="reports-analytics mx-auto w-full max-w-7xl">
        <ReportsHero
          range={range}
          pulse={summary?.pulse}
          onExportExecutive={handleExecutiveExport}
          exportDisabled={!canExport}
          pdfComingSoon
        />

        {!planGate.canExport && (
          <div className="mt-4">
            <PlanLimitNotice message="Exportação de relatórios não está disponível no seu plano atual." />
          </div>
        )}

        {isError && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <p>
              Não foi possível carregar o resumo analítico.
              {error instanceof Error && error.message ? ` (${error.message})` : null}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Se o problema persistir, confirme que a migration{" "}
              <code className="text-[11px]">20260606120000_fix_reports_poll_recorded_at</code> foi aplicada no Supabase.
            </p>
            <button
              type="button"
              className="mt-2 font-medium underline"
              onClick={() => refetch()}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="reports-layout mt-6">
          <ReportsFiltersBar
            search={search}
            filterOptions={summary?.filterOptions}
            onChange={(next) => setSearch(next)}
            onReset={resetFilters}
          />

          <div className="reports-stack">
            <ReportsKpiStrip
              summary={summary?.summary}
              funnel={summary?.funnel}
              isLoading={isLoading}
            />
            <ReportsExportCenter
              range={range}
              counts={summary?.exportCounts}
              tenantId={tenantId}
              disabled={!canExport}
              onExport={runExport}
              lastExports={exportLog}
            />
            <ReportsTerritorySection
              territories={summary?.territories}
              neighborhoodFilter={search.bairro}
            />
            <ReportsPipeline funnel={summary?.funnel} />
            <ReportsDemandsSection demands={summary?.demands} />
            <ReportsElectoralSection
              growthSeries={summary?.growthSeries ?? []}
              intencao={intencao}
              aprovacao={aprovacao}
              neighborhoodFilter={search.bairro}
              pollsLoading={pollsLoading}
              pollMeta={summary?.pollMeta}
            />
          </div>
        </div>
      </div>
    </ModuleRouteGuard>
  );
}
