import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { Users, Crown, Vote, MessageSquareWarning, Target } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts";
import { MetricCard } from "@/components/common/MetricCard";
import { ChartCard } from "@/components/common/ChartCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperationalHeader } from "@/components/dashboard/OperationalHeader";
import { OperationalStrip } from "@/components/dashboard/OperationalStrip";
import { ActionableAlerts } from "@/components/dashboard/ActionableAlerts";
import { DailySummaryCard } from "@/components/dashboard/DailySummaryCard";
import { NextActionsCard } from "@/components/dashboard/NextActionsCard";
import { TerritoryIntelCard } from "@/components/dashboard/TerritoryIntelCard";
import { PoliticalPipeline } from "@/components/dashboard/PoliticalPipeline";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useTenant } from "@/hooks/use-tenant";
import {
  useDashboardMetrics,
  useActivities,
  usePollSnapshots,
  useStrategicInsights,
} from "@/hooks/use-dashboard";
import { LoadingState } from "@/components/common/LoadingState";
import { greetingLabel } from "@/services/dashboard-intelligence";
import { narrativeApproval, narrativeGrowth, narrativeIntention } from "@/lib/chart-narratives";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function DashboardPage() {
  const { tenantId } = useTenant();
  const { profile } = useRouteContext({ from: "/_app" });
  const { data: metrics, isLoading: mLoading } = useDashboardMetrics(tenantId);
  const { data: activities } = useActivities(tenantId);
  const { data: polls } = usePollSnapshots(tenantId);
  const { data: insights, isLoading: insightsLoading } = useStrategicInsights(tenantId);

  const crescimento = (polls?.find((p) => p.snapshot_type === "crescimento_apoiadores")?.data ??
    []) as { mes: string; apoiadores: number }[];
  const intencao = (polls?.find((p) => p.snapshot_type === "intencao_voto")?.data ?? []) as {
    candidato: string;
    valor: number;
  }[];
  const aprovacao = (polls?.find((p) => p.snapshot_type === "aprovacao_bairro")?.data ?? []) as {
    bairro: string;
    aprovacao: number;
  }[];
  const funnel = (metrics?.funnel ?? {}) as Record<string, number>;

  if (mLoading) return <LoadingState label="Carregando central operacional..." />;

  const greeting = greetingLabel(profile?.full_name);
  const briefing = insights?.briefingSentence ?? "Carregando inteligência operacional...";
  const pills = insights?.operational.pills ?? [];
  const strip = insights?.operational.strip ?? [];
  const kpi = insights?.operational.kpi;

  return (
    <div className="dashboard-section">
      <OperationalHeader greeting={greeting} briefing={briefing} pills={pills} />

      {!insightsLoading && insights && (
        <>
          {strip.length > 0 && <OperationalStrip items={strip} />}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Alertas operacionais
            </h2>
            <ActionableAlerts alerts={insights.alerts} />
          </section>

          <DailySummaryCard metrics={insights.operational.dailySummary} />

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Indicadores principais
            </h2>
            <div className="dashboard-metrics-grid">
              <MetricCard
                label="Apoiadores"
                value={String(metrics?.total_supporters ?? 0)}
                icon={Users}
                tone="primary"
                featured
                context={kpi?.supporters}
              />
              <MetricCard
                label="Apoio forte"
                value={String(metrics?.strong_support ?? 0)}
                icon={Vote}
                tone="accent"
                context={kpi?.strongSupport}
              />
              <MetricCard
                label="Lideranças"
                value={String(metrics?.leaderships ?? 0)}
                icon={Crown}
                tone="success"
                featured
                context={kpi?.leaderships}
              />
              <MetricCard
                label="Demandas abertas"
                value={String(metrics?.open_demands ?? 0)}
                icon={MessageSquareWarning}
                tone="warning"
                context={kpi?.openDemands}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NextActionsCard actions={insights.operational.nextActions} />
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Inteligência territorial
            </h2>
            <div className="dashboard-insights-grid">
              <TerritoryIntelCard
                title="Territórios críticos"
                description="Prioridade imediata de campo"
                territories={insights.criticalTerritories}
                variant="critical"
              />
              <TerritoryIntelCard
                title="Territórios promissores"
                description="Regiões para acelerar conversão"
                territories={insights.promisingTerritories}
                variant="promising"
              />
            </div>
          </section>
        </>
      )}

      <PoliticalPipeline funnel={funnel} />

      {insights && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Metas personalizadas
            </CardTitle>
            <CardDescription>Planejado vs realizado no período de cada meta</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pb-6 md:grid-cols-3">
            {insights.weeklyGoals.map((goal) => (
              <div key={goal.id} className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <p className="text-sm font-medium">{goal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {goal.startDate} até {goal.endDate}
                </p>
                <p className="mt-2 text-lg font-semibold text-heading dark:text-foreground">
                  {goal.value} / {goal.target}
                </p>
                <Badge
                  variant={
                    goal.status === "no_ritmo"
                      ? "secondary"
                      : goal.status === "risco"
                        ? "outline"
                        : "destructive"
                  }
                  className="mt-2"
                >
                  {goal.status === "no_ritmo"
                    ? "No ritmo"
                    : goal.status === "risco"
                      ? "Em risco"
                      : "Atrasado"}
                </Badge>
              </div>
            ))}
            {!insights.weeklyGoals.length && (
              <p className="text-sm text-muted-foreground md:col-span-3">
                Sem metas cadastradas. Configure em Configurações → Metas.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Análise e pesquisas
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <ChartCard
            title="Crescimento de apoiadores"
            description="Evolução mensal (dados de Pesquisas)"
            narrative={narrativeGrowth(crescimento) ?? "Atualize os dados em Pesquisas."}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={crescimento}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="apoiadores"
                    stroke="var(--chart-2)"
                    fill="var(--chart-2)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard
            title="Intenção de voto"
            description="Pesquisa estimulada"
            narrative={narrativeIntention(intencao) ?? "Cadastre a pesquisa em Pesquisas."}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intencao}
                    dataKey="valor"
                    nameKey="candidato"
                    innerRadius={55}
                    outerRadius={90}
                  >
                    {intencao.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 xl:col-span-2">
          <ChartCard
            title="Aprovação por bairro"
            description="Índice por região"
            narrative={
              narrativeApproval(aprovacao) ?? "Preencha aprovação por bairro em Pesquisas."
            }
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aprovacao}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bairro" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="aprovacao" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
        <ActivityFeed activities={activities ?? []} />
      </div>
    </div>
  );
}
