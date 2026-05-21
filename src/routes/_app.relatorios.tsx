import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/common/ChartCard";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTenant } from "@/hooks/use-tenant";
import { useSupporters } from "@/hooks/use-supporters";
import { usePollSnapshots } from "@/hooks/use-dashboard";
import { LoadingState } from "@/components/common/LoadingState";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { tenantId } = useTenant();
  const { data: supporters, isLoading } = useSupporters(tenantId);
  const { data: polls } = usePollSnapshots(tenantId);
  const crescimento = (polls?.find((p) => p.snapshot_type === "crescimento_apoiadores")?.data ?? []) as { mes: string; apoiadores: number }[];

  function exportCsv() {
    const rows = supporters ?? [];
    const header = "nome,telefone,bairro,cidade,status,apoio\n";
    const body = rows.map((r) =>
      [r.name, r.phone, r.neighborhood, r.city, r.status, r.support_level].map((v) => `"${v ?? ""}"`).join(","),
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apoiadores.csv";
    a.click();
    toast.success("Exportação iniciada");
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios"
        description="Exportação e visualização consolidada."
        actions={<Button size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>}
      />
      <ChartCard title="Crescimento" description="Base de apoiadores">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={crescimento}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="apoiadores" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
