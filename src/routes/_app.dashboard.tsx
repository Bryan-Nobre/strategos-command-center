import { createFileRoute } from "@tanstack/react-router";
import { Users, Crown, Vote, MessageSquareWarning, Calendar } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis, Pie, PieChart, Cell, Legend,
} from "recharts";
import { MetricCard } from "@/components/common/MetricCard";
import { ChartCard } from "@/components/common/ChartCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { useDashboardMetrics, useActivities, usePollSnapshots } from "@/hooks/use-dashboard";
import { LoadingState } from "@/components/common/LoadingState";
import { FUNNEL_STAGES, SUPPORTER_STATUS_LABELS } from "@/types/domain";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function DashboardPage() {
  const { tenantId } = useTenant();
  const { data: metrics, isLoading: mLoading } = useDashboardMetrics(tenantId);
  const { data: activities } = useActivities(tenantId);
  const { data: polls } = usePollSnapshots(tenantId);

  const crescimento = (polls?.find((p) => p.snapshot_type === "crescimento_apoiadores")?.data ?? []) as { mes: string; apoiadores: number }[];
  const intencao = (polls?.find((p) => p.snapshot_type === "intencao_voto")?.data ?? []) as { candidato: string; valor: number }[];
  const aprovacao = (polls?.find((p) => p.snapshot_type === "aprovacao_bairro")?.data ?? []) as { bairro: string; aprovacao: number }[];
  const funnel = (metrics?.funnel ?? {}) as Record<string, number>;

  if (mLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão geral"
        description="Acompanhe o desempenho da sua campanha em tempo real."
        actions={<Button variant="outline" size="sm"><Calendar className="mr-2 h-4 w-4" />Últimos 30 dias</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Apoiadores" value={String(metrics?.total_supporters ?? 0)} icon={Users} tone="primary" />
        <MetricCard label="Apoio forte" value={String(metrics?.strong_support ?? 0)} icon={Vote} tone="accent" />
        <MetricCard label="Lideranças" value={String(metrics?.leaderships ?? 0)} icon={Crown} tone="success" />
        <MetricCard label="Demandas abertas" value={String(metrics?.open_demands ?? 0)} icon={MessageSquareWarning} tone="warning" />
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
        <ChartCard title="Crescimento de apoiadores" description="Evolução mensal">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crescimento}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="apoiadores" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Intenção de voto" description="Pesquisa estimulada">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={intencao} dataKey="valor" nameKey="candidato" innerRadius={55} outerRadius={90}>
                  {intencao.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Aprovação por bairro" description="Índice por região" className="lg:col-span-2">
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
        <Card className="shadow-elegant">
          <CardHeader><CardTitle>Atividades recentes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(activities ?? []).map((a) => (
              <div key={a.id} className="flex justify-between gap-2 text-sm">
                <span>{a.message}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            ))}
            {!(activities?.length) && <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
