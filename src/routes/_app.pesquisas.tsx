import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/common/ChartCard";
import { useTenant } from "@/hooks/use-tenant";
import { usePollSnapshots } from "@/hooks/use-dashboard";
import { LoadingState } from "@/components/common/LoadingState";

export const Route = createFileRoute("/_app/pesquisas")({
  component: PesquisasPage,
});

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function PesquisasPage() {
  const { tenantId } = useTenant();
  const { data: polls, isLoading } = usePollSnapshots(tenantId);

  const intencao = (polls?.find((p) => p.snapshot_type === "intencao_voto")?.data ?? []) as { candidato: string; valor: number }[];
  const aprovacao = (polls?.find((p) => p.snapshot_type === "aprovacao_bairro")?.data ?? []) as { bairro: string; aprovacao: number }[];

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader title="Pesquisas" description="Intenção de voto e aprovação por região (dados editáveis no banco)." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Intenção de voto" description="Estimulada">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={intencao} dataKey="valor" nameKey="candidato" innerRadius={50} outerRadius={85}>
                  {intencao.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Aprovação por bairro" description="Índice regional">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aprovacao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bairro" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="aprovacao" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
