import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMemo } from "react";
import { Users, Crown, Vote, MessageSquareWarning } from "lucide-react";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardPriorities } from "@/components/dashboard/DashboardPriorities";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import { DashboardTerritoryMap } from "@/components/dashboard/DashboardTerritoryMap";
import { DashboardGoalsAtRisk } from "@/components/dashboard/DashboardGoalsAtRisk";
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
import { greetingLabel } from "@/services/dashboard-intelligence";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { tenantId } = useTenant();
  const { profile } = useRouteContext({ from: "/_app" });
  const { permissions } = useTenantPermissions(tenantId);
  const { data: operational, isLoading: opLoading, isError: opError } =
    useOperationalDashboard(tenantId);
  const { data: activities, isLoading: activitiesLoading } = useActivities(tenantId);
  const { data: polls, isLoading: pollsLoading } = usePollSnapshots(tenantId);

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
  const funnel = (metrics?.funnel ?? {}) as Record<string, number>;

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

  const critical = insights?.criticalTerritories ?? [];
  const promising = insights?.promisingTerritories ?? [];

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

  const kpiItems = useMemo(
    () => [
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
    ],
    [metrics, insights?.operational.kpi],
  );

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
              {insights && (
                <>
                  <DashboardPriorities items={priorities} sectionIndex={1} />
                  <DashboardKpiStrip items={kpiItems} sectionIndex={2} />
                  <DashboardGoalsAtRisk goals={insights.weeklyGoals} sectionIndex={3} />
                  <DashboardTerritoryMap
                    critical={critical}
                    promising={promising}
                    canViewTerritoryLink={canViewTerritoryLink}
                    sectionIndex={4}
                  />
                  <DashboardPipelineSlim funnel={funnel} sectionIndex={5} />
                </>
              )}

              {!insights && !opError && (
                <DashboardPipelineSlim funnel={funnel} sectionIndex={1} />
              )}

              <DashboardAnalyticsSection
                intencao={intencao}
                aprovacao={aprovacao}
                isLoading={pollsLoading}
                sectionIndex={insights ? 6 : 2}
              />
              <DashboardActivityTimeline
                activities={activities ?? []}
                isLoading={activitiesLoading}
                sectionIndex={insights ? 7 : 3}
              />
            </div>
          </>
        )}
      </div>
    </ModuleRouteGuard>
  );
}
