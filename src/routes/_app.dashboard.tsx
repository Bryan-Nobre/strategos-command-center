import { createFileRoute } from "@tanstack/react-router";
import { Users, Crown, Vote, MessageSquareWarning, AlertTriangle, Target } from "lucide-react";
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
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import {
  useDashboardMetrics,
  useActivities,
  usePollSnapshots,
  useStrategicInsights,
} from "@/hooks/use-dashboard";
import { LoadingState } from "@/components/common/LoadingState";
import { FUNNEL_STAGES, SUPPORTER_STATUS_LABELS } from "@/types/domain";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const { data: metrics, isLoading: mLoading } = useDashboardMetrics(tenantId);
  const { data: activities } = useActivities(tenantId);
  const { data: polls } = usePollSnapshots(tenantId);
  const { data: insights } = useStrategicInsights(tenantId);

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

  if (mLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão geral"
        description="Acompanhe o desempenho da sua campanha em tempo real."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Apoiadores"
          value={String(metrics?.total_supporters ?? 0)}
          icon={Users}
          tone="primary"
        />
        <MetricCard
          label="Apoio forte"
          value={String(metrics?.strong_support ?? 0)}
          icon={Vote}
          tone="accent"
        />
        <MetricCard
          label="Lideranças"
          value={String(metrics?.leaderships ?? 0)}
          icon={Crown}
          tone="success"
        />
        <MetricCard
          label="Demandas abertas"
          value={String(metrics?.open_demands ?? 0)}
          icon={MessageSquareWarning}
          tone="warning"
        />
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Funil político</CardTitle>
          <CardDescription>Distribuição por estágio de relacionamento</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {FUNNEL_STAGES.map((stage) => (
            <Badge key={stage.key} variant="secondary" className="px-4 py-2 text-sm">
              {stage.label}: {funnel[stage.key] ?? 0}
            </Badge>
          ))}
          {Object.entries(funnel)
            .filter(([k]) => !FUNNEL_STAGES.some((s) => s.key === k))
            .map(([k, v]) => (
              <Badge key={k} variant="outline" className="px-4 py-2 text-sm">
                {SUPPORTER_STATUS_LABELS[k] ?? k}: {v}
              </Badge>
            ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-base">Territórios críticos</CardTitle>
            <CardDescription>Prioridade imediata de campo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(insights?.criticalTerritories ?? []).map((t) => (
              <div key={t.neighborhood} className="rounded-md border border-border p-3">
                <p className="font-medium">{t.neighborhood}</p>
                <p className="text-xs text-muted-foreground">
                  Base {t.supporters} · Forte {t.strongSupportPct}% · Indecisos {t.undecidedPct}% ·
                  Demandas abertas {t.openDemands}
                </p>
              </div>
            ))}
            {!insights?.criticalTerritories?.length && (
              <p className="text-sm text-muted-foreground">Sem territórios críticos no momento.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-base">Territórios promissores</CardTitle>
            <CardDescription>Regiões para acelerar conversão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(insights?.promisingTerritories ?? []).map((t) => (
              <div key={t.neighborhood} className="rounded-md border border-border p-3">
                <p className="font-medium">{t.neighborhood}</p>
                <p className="text-xs text-muted-foreground">
                  Base {t.supporters} · Forte {t.strongSupportPct}% · Oposição {t.oppositionPct}%
                </p>
              </div>
            ))}
            {!insights?.promisingTerritories?.length && (
              <p className="text-sm text-muted-foreground">Ainda sem dados suficientes.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-base">Alertas operacionais</CardTitle>
            <CardDescription>Regras automáticas de risco</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(insights?.alerts ?? []).map((a) => (
              <div key={a.id} className="flex gap-2 rounded-md border border-border p-3">
                <AlertTriangle
                  className={
                    a.severity === "alta"
                      ? "mt-0.5 h-4 w-4 text-destructive"
                      : "mt-0.5 h-4 w-4 text-warning-foreground"
                  }
                />
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </div>
            ))}
            {!insights?.alerts?.length && (
              <p className="text-sm text-muted-foreground">Nenhum alerta crítico por enquanto.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Metas personalizadas
          </CardTitle>
          <CardDescription>Planejado vs realizado no período de cada meta</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(insights?.weeklyGoals ?? []).map((goal) => (
            <div key={goal.id} className="rounded-md border border-border p-3">
              <p className="text-sm font-medium">{goal.name}</p>
              <p className="text-xs text-muted-foreground">
                {goal.startDate} até {goal.endDate}
              </p>
              <p className="mt-1 text-lg font-semibold">
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
          {!insights?.weeklyGoals?.length && (
            <p className="text-sm text-muted-foreground">
              Sem metas cadastradas. Configure em Configurações &gt; Metas.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Crescimento de apoiadores" description="Evolução mensal">
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
        <ChartCard title="Intenção de voto" description="Pesquisa estimulada">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Aprovação por bairro" description="Índice por região">
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
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Atividades recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(activities ?? []).map((a) => (
              <div key={a.id} className="flex justify-between gap-2 text-sm">
                <span>{a.message}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            ))}
            {!activities?.length && (
              <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
