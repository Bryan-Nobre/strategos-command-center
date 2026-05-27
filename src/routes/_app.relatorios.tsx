import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/common/ChartCard";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTenant } from "@/hooks/use-tenant";
import { usePlanGate } from "@/hooks/use-plan-gate";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { PlanLimitNotice } from "@/components/common/PlanLimitNotice";
import { useSupporters } from "@/hooks/use-supporters";
import { useDemands } from "@/hooks/use-demands";
import { usePollSnapshots } from "@/hooks/use-dashboard";
import { LoadingState } from "@/components/common/LoadingState";
import { downloadCsv, buildCsvFilename } from "@/lib/csv/download";
import { supportersToCsv } from "@/lib/csv/supporters-csv";
import { buildConsolidatedReportCsv } from "@/lib/csv/reports-csv";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { tenantId, activeTenant } = useTenant();
  const planGate = usePlanGate(tenantId);
  const perms = useCrudPermissions("reports");
  const { data: supporters, isLoading } = useSupporters(tenantId);
  const { data: demands } = useDemands(tenantId);
  const { data: polls } = usePollSnapshots(tenantId);
  const crescimento = (polls?.find((p) => p.snapshot_type === "crescimento_apoiadores")?.data ?? []) as {
    mes: string;
    apoiadores: number;
  }[];

  const slug = activeTenant?.slug ?? "campanha";

  function exportSupporters() {
    if (!planGate.canExport || !perms.canExport) {
      toast.error("Exportação não disponível para seu cargo ou plano.");
      return;
    }
    const rows = supporters ?? [];
    downloadCsv(buildCsvFilename(slug, "apoiadores"), supportersToCsv(rows));
    toast.success(`${rows.length} apoiador(es) exportado(s)`);
  }

  function exportConsolidated() {
    if (!planGate.canExport || !perms.canExport) {
      toast.error("Exportação não disponível para seu cargo ou plano.");
      return;
    }
    const csv = buildConsolidatedReportCsv(supporters ?? [], demands ?? []);
    downloadCsv(buildCsvFilename(slug, "relatorio-consolidado"), csv);
    toast.success("Relatório consolidado gerado");
  }

  if (isLoading) return <LoadingState />;

  return (
    <ModuleRouteGuard module="reports">
    <div className="space-y-8">
      <PageHeader
        title="Relatórios"
        description="Exportação e visualização consolidada."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportSupporters}
              disabled={!planGate.canExport || !perms.canExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Apoiadores CSV
            </Button>
            <Button size="sm" onClick={exportConsolidated} disabled={!planGate.canExport || !perms.canExport}>
              <Download className="mr-2 h-4 w-4" />
              Relatório consolidado
            </Button>
          </div>
        }
      />

      {!planGate.canExport && (
        <PlanLimitNotice message="Exportação de relatórios não está disponível no seu plano atual." />
      )}

      <ChartCard
        title="Crescimento"
        description={crescimento.length ? "Dados de pesquisas salvas" : "Atualize em Pesquisas para ver evolução"}
      >
        <div className="h-64">
          {crescimento.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crescimento}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="apoiadores"
                  stroke="var(--chart-2)"
                  fill="var(--chart-2)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nenhum dado de crescimento cadastrado. Vá em Pesquisas para adicionar.
            </div>
          )}
        </div>
      </ChartCard>
    </div>
    </ModuleRouteGuard>
  );
}
