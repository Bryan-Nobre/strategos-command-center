import { createFileRoute } from "@tanstack/react-router";
import { Users, Crown, Vote, MessageSquareWarning, Download, Calendar } from "lucide-react";
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
import {
  crescimentoApoiadores, intencaoVoto, aprovacaoBairro, atividadesRecentes, liderancasMock,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão geral"
        description="Acompanhe o desempenho da sua campanha e do seu mandato em tempo real."
        actions={
          <>
            <Button variant="outline" size="sm"><Calendar className="mr-2 h-4 w-4" />Últimos 30 dias</Button>
            <Button size="sm"><Download className="mr-2 h-4 w-4" />Exportar</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Apoiadores" value="4.892" delta={12.4} icon={Users} tone="primary" />
        <MetricCard label="Votos estimados" value="38.140" delta={8.7} icon={Vote} tone="accent" />
        <MetricCard label="Lideranças ativas" value="142" delta={5.2} icon={Crown} tone="success" />
        <MetricCard label="Demandas abertas" value="27" delta={-3.1} icon={MessageSquareWarning} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Crescimento de apoiadores" description="Evolução mensal da base" >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crescimentoApoiadores}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="apoiadores" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Intenção de voto" description="Pesquisa estimulada">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={intencaoVoto} dataKey="valor" nameKey="candidato" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {intencaoVoto.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Aprovação por bairro" description="Top 5 regiões">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aprovacaoBairro} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="bairro" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="aprovacao" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-base">Lideranças em destaque</CardTitle>
            <CardDescription>Maior crescimento neste mês</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {liderancasMock.slice(0, 4).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium">{l.nome}</div>
                  <div className="text-xs text-muted-foreground">{l.regiao} · {l.apoiadores} apoiadores</div>
                </div>
                <Badge variant={l.crescimento >= 0 ? "default" : "destructive"} className="font-mono">
                  {l.crescimento >= 0 ? "+" : ""}{l.crescimento}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-base">Atividades recentes</CardTitle>
            <CardDescription>Últimas movimentações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {atividadesRecentes.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <div className="flex-1">
                  <div className="text-sm leading-snug">{a.texto}</div>
                  <div className="text-xs text-muted-foreground">{a.tempo}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
