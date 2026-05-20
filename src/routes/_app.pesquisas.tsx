import { createFileRoute } from "@tanstack/react-router";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Line, LineChart, Legend, RadialBarChart, RadialBar,
} from "recharts";
import { Plus, ThumbsUp, ThumbsDown, MinusCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/common/ChartCard";
import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { intencaoVoto, aprovacaoBairro } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/pesquisas")({
  component: PesquisasPage,
});

const historico = [
  { mes: "Jan", aprovacao: 42, rejeicao: 31 },
  { mes: "Fev", aprovacao: 45, rejeicao: 30 },
  { mes: "Mar", aprovacao: 51, rejeicao: 27 },
  { mes: "Abr", aprovacao: 56, rejeicao: 24 },
  { mes: "Mai", aprovacao: 62, rejeicao: 21 },
  { mes: "Jun", aprovacao: 65, rejeicao: 19 },
];

const radial = [{ name: "Aprovação", value: 65, fill: "var(--chart-2)" }];

function PesquisasPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Pesquisas"
        description="Análise de intenção de voto, aprovação e indicadores políticos."
        actions={<Button size="sm"><Plus className="mr-2 h-4 w-4" />Nova pesquisa</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Aprovação geral" value="65%" delta={4.8} icon={ThumbsUp} tone="success" />
        <MetricCard label="Rejeição" value="19%" delta={-2.1} icon={ThumbsDown} tone="warning" />
        <MetricCard label="Indecisos" value="16%" delta={-1.4} icon={MinusCircle} tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Intenção de voto" description="Pesquisa estimulada — junho" >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intencaoVoto}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="candidato" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="valor" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Aprovação geral" description="Indicador consolidado">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" background={{ fill: "var(--muted)" }} cornerRadius={20} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold">65%</text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Histórico de aprovação" description="Evolução semestral">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="aprovacao" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="rejeicao" stroke="var(--chart-5)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Aprovação por bairro" description="Comparativo regional">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aprovacaoBairro}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bairro" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="aprovacao" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
