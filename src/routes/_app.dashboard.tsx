import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { useReportsSummary } from "@/hooks/use-reports";
import {
  parseDashboardSearch,
  serializeDashboardSearch,
  type DashboardListSearch,
} from "@/lib/list-search/dashboard";
import {
  formatDatePeriodLabel,
  isTimestampInPeriod,
  resolveDatePeriodRange,
} from "@/lib/date-period";
import { DatePeriodFilter } from "@/components/filters/DatePeriodFilter";
import { Users, Crown, Vote, MessageSquareWarning } from "lucide-react";
import { DashboardUpcomingAgenda } from "@/components/dashboard/DashboardUpcomingAgenda";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardPriorities } from "@/components/dashboard/DashboardPriorities";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import { DashboardTerritoryMap } from "@/components/dashboard/DashboardTerritoryMap";
import { DashboardGoalsOverview } from "@/components/dashboard/DashboardGoalsOverview";
import { DashboardPipelineSlim } from "@/components/dashboard/DashboardPipelineSlim";
import { DashboardAnalyticsSection } from "@/components/dashboard/DashboardAnalyticsSection";
import { DashboardActivityTimeline } from "@/components/dashboard/DashboardActivityTimeline";
import { DashboardWarRoomSkeleton } from "@/components/dashboard/DashboardWarRoomSkeleton";
import { useTenant } from "@/hooks/use-tenant";
import { useTenantPermissions } from "@/hooks/use-tenant-permissions";
import { canAccessDashboardRoute } from "@/lib/dashboard-link-permissions";
import {
  buildDailyPriorities,
  pillsToBadges,
  pickHeroHighlight,
  resolveHeroCtas,
} from "@/lib/dashboard-compose";
import { useOperationalDashboard, useActivities, usePollSnapshots } from "@/hooks/use-dashboard";
import { useAgendaEvents } from "@/hooks/use-agenda";
import { DashboardTerritoryCepBar } from "@/components/dashboard/DashboardTerritoryCepBar";
import { filterEnrichedTerritories } from "@/lib/territory-filter";
import type { TerritoryFilter } from "@/lib/territory-filter";
import { greetingLabel } from "@/services/dashboard-intelligence";

export const Route = createFileRoute("/_app/dashboard")({
  validateSearch: (search: Record<string, unknown>) => parseDashboardSearch(search),
  component: DashboardPage,
});

const DEFAULT_DASHBOARD_SEARCH: DashboardListSearch = { period: "30d" };

function DashboardPage() {
  const { tenantId } = useTenant();
  const urlSearch = Route.useSearch();
  const { setSearch } = useSyncedListSearch({
    search: urlSearch,
    serialize: serializeDashboardSearch,
  });
  const periodRange = useMemo(
    () => resolveDatePeriodRange(urlSearch, { defaultPreset: "30d" }),
    [urlSearch],
  );
  const { profile } = useRouteContext({ from: "/_app" });
  const { permissions, canRead } = useTenantPermissions(tenantId);
  const { data: operational, isLoading: opLoading, isError: opError } =
    useOperationalDashboard(tenantId);
  const reportsParams = useMemo(
    () =>
      tenantId && periodRange
        ? { tenantId, from: periodRange.from, to: periodRange.to }
        : null,
    [tenantId, periodRange],
  );
  const { data: periodReports } = useReportsSummary(reportsParams);

  const { data: activitiesRaw, isLoading: activitiesLoading } = useActivities(tenantId);
  const activities = useMemo(
    () =>
      (activitiesRaw ?? []).filter((a) => isTimestampInPeriod(a.created_at, periodRange)),
    [activitiesRaw, periodRange],
  );
  const { data: polls, isLoading: pollsLoading } = usePollSnapshots(tenantId);
  const canViewAgenda = canRead("agenda");
  const { data: agendaEvents } = useAgendaEvents(canViewAgenda ? tenantId : "");

  const metrics = operational?.metrics;
  const insights = operational?.insights;

  const intencao = (polls?.find((p) => p.snapshot_type === "intencao_voto")?.data ?? []) as {
    candidato: string;
    valor: number;
  }[];
  const aprovacao = (polls?.find((p) => p.snapshot_type === "aprovacao_bairro")?.data ?? []) as {
    bairro: string;
    aprovacao: number;
  }[];
  const funnel = useMemo(() => {
    if (periodReports?.funnel) {
      const f = periodReports.funnel;
      return {
        interessado: f.interessado,
        apoiador: f.apoiador,
        lideranca: f.lideranca,
      } as Record<string, number>;
    }
    return (metrics?.funnel ?? {}) as Record<string, number>;
  }, [periodReports?.funnel, metrics?.funnel]);

  const greeting = greetingLabel(profile?.full_name);
  const briefing =
    insights?.briefingSentence ??
    (opLoading
      ? "Carregando inteligência operacional da campanha…"
      : opError
        ? "Não foi possível carregar o painel operacional. Tente atualizar a página."
        : "Central operacional indisponível no momento.");

  const filteredAlerts = useMemo(
    () =>
      (insights?.alerts ?? []).filter((alert) =>
        canAccessDashboardRoute(permissions, alert.actionTo),
      ),
    [insights?.alerts, permissions],
  );

  const filteredNextActions = useMemo(
    () =>
      (insights?.operational.nextActions ?? []).filter((action) =>
        canAccessDashboardRoute(permissions, action.href),
      ),
    [insights?.operational.nextActions, permissions],
  );

  const priorities = useMemo(
    () => buildDailyPriorities(filteredAlerts, filteredNextActions, 3),
    [filteredAlerts, filteredNextActions],
  );

  const canViewTerritoryLink = canAccessDashboardRoute(permissions, "/eleitores");

  const [territoryFilter, setTerritoryFilter] = useState<TerritoryFilter | null>(null);

  const handleTerritoryResolved = useCallback((filter: TerritoryFilter) => {
    setTerritoryFilter(filter);
  }, []);

  const handleTerritoryClear = useCallback(() => {
    setTerritoryFilter(null);
  }, []);

  const criticalAll = insights?.criticalTerritories ?? [];
  const promisingAll = insights?.promisingTerritories ?? [];

  const critical = useMemo(
    () => filterEnrichedTerritories(criticalAll, territoryFilter?.neighborhood),
    [criticalAll, territoryFilter?.neighborhood],
  );
  const promising = useMemo(
    () => filterEnrichedTerritories(promisingAll, territoryFilter?.neighborhood),
    [promisingAll, territoryFilter?.neighborhood],
  );

  const heroHighlight = useMemo(
    () => pickHeroHighlight(critical, promising, filteredAlerts),
    [critical, promising, filteredAlerts],
  );

  const heroCtas = useMemo(
    () => resolveHeroCtas(critical, promising, filteredAlerts, filteredNextActions, canViewTerritoryLink),
    [critical, promising, filteredAlerts, filteredNextActions, canViewTerritoryLink],
  );

  const heroBadges = useMemo(
    () => pillsToBadges(insights?.operational.pills ?? [], 3),
    [insights?.operational.pills],
  );

  const periodLabel = formatDatePeriodLabel(periodRange);

  const kpiItems = useMemo(() => {
    if (periodReports) {
      const s = periodReports.summary;
      const growth =
        periodReports.pulse.growthPct != null
          ? `${periodReports.pulse.growthPct > 0 ? "+" : ""}${periodReports.pulse.growthPct}% vs período anterior`
          : undefined;
      return [
        {
          label: "Novos apoiadores",
          value: String(s.newSupportersInPeriod),
          icon: Users,
          context: growth,
          tone: "primary" as const,
        },
        {
          label: "Apoio forte (base)",
          value: String(s.strongSupport),
          icon: Vote,
          context: periodLabel,
          tone: "primary" as const,
        },
        {
          label: "Lideranças",
          value: String(s.leaderships),
          icon: Crown,
          context: periodLabel,
          tone: "primary" as const,
        },
        {
          label: "Demandas abertas",
          value: String(s.openDemands),
          icon: MessageSquareWarning,
          context: `${s.resolvedInPeriod} resolvidas no período`,
          tone: "warning" as const,
        },
      ];
    }
    return [
      {
        label: "Apoiadores",
        value: String(metrics?.total_supporters ?? 0),
        icon: Users,
        context: insights?.operational.kpi.supporters,
        tone: "primary" as const,
      },
      {
        label: "Apoio forte",
        value: String(metrics?.strong_support ?? 0),
        icon: Vote,
        context: insights?.operational.kpi.strongSupport,
        tone: "primary" as const,
      },
      {
        label: "Lideranças",
        value: String(metrics?.leaderships ?? 0),
        icon: Crown,
        context: insights?.operational.kpi.leaderships,
        tone: "primary" as const,
      },
      {
        label: "Demandas abertas",
        value: String(metrics?.open_demands ?? 0),
        icon: MessageSquareWarning,
        context: insights?.operational.kpi.openDemands,
        tone: "warning" as const,
      },
    ];
  }, [periodReports, metrics, insights?.operational.kpi, periodLabel]);

  return (
    <ModuleRouteGuard module="dashboard">
      <div className="dashboard-war-room mx-auto w-full max-w-7xl">
        {opLoading && <DashboardWarRoomSkeleton />}

        {!opLoading && (
          <>
            <DashboardHero
              greeting={greeting}
              briefing={briefing}
              alertLine={heroHighlight.alertLine}
              opportunityLine={heroHighlight.opportunityLine}
              badges={heroBadges}
              dailyPulse={insights?.operational.dailySummary ?? []}
              primaryCta={heroCtas.primary}
              secondaryCta={heroCtas.secondary}
            />

            <div className="dashboard-war-room-stack">
              <DatePeriodFilter
                value={{
                  period: urlSearch.period ?? "30d",
                  from: urlSearch.from,
                  to: urlSearch.to,
                }}
                onChange={(next) =>
                  setSearch({
                    ...DEFAULT_DASHBOARD_SEARCH,
                    ...urlSearch,
                    period: next.period as DashboardListSearch["period"],
                    from: next.from,
                    to: next.to,
                  })
                }
              />
              <DashboardTerritoryCepBar
                activeFilter={territoryFilter}
                onResolved={handleTerritoryResolved}
                onClear={handleTerritoryClear}
              />
              {insights && (
                <>
                  <DashboardPriorities items={priorities} sectionIndex={1} />
                  <DashboardKpiStrip items={kpiItems} sectionIndex={2} />
                  <DashboardGoalsOverview goals={insights.weeklyGoals} sectionIndex={3} />
                  <DashboardTerritoryMap
                    critical={critical}
                    promising={promising}
                    canViewTerritoryLink={canViewTerritoryLink}
                    sectionIndex={4}
                    territoryFilterLabel={
                      territoryFilter
                        ? [territoryFilter.neighborhood, territoryFilter.city].filter(Boolean).join(" · ")
                        : null
                    }
                  />
                  <DashboardPipelineSlim funnel={funnel} sectionIndex={5} />
                  {canViewAgenda && agendaEvents && (
                    <DashboardUpcomingAgenda events={agendaEvents} sectionIndex={6} />
                  )}
                </>
              )}

              {!insights && !opError && (
                <DashboardPipelineSlim funnel={funnel} sectionIndex={1} />
              )}

              <DashboardAnalyticsSection
                intencao={intencao}
                aprovacao={aprovacao}
                neighborhoodFilter={territoryFilter?.neighborhood}
                isLoading={pollsLoading}
                sectionIndex={insights ? (canViewAgenda && agendaEvents?.length ? 7 : 6) : 2}
              />
              <DashboardActivityTimeline
                activities={activities ?? []}
                isLoading={activitiesLoading}
                sectionIndex={insights ? (canViewAgenda && agendaEvents?.length ? 8 : 7) : 3}
              />
            </div>
          </>
        )}
      </div>
    </ModuleRouteGuard>
  );
}
