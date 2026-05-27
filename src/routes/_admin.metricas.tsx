import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, MessageSquareWarning, Activity, PauseCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { getPlatformMetrics } from "@/services/admin";
import { queryKeys } from "@/lib/query-keys";
import { LoadingState } from "@/components/common/LoadingState";

export const Route = createFileRoute("/_admin/metricas")({
  component: AdminMetricsPage,
});

function AdminMetricsPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminMetrics(),
    queryFn: getPlatformMetrics,
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader title="Métricas da plataforma" description="Visão global do SaaS político (clientes reais, sem super admin)." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Total clientes" value={String(data?.totalTenants ?? 0)} icon={Building2} tone="primary" />
        <MetricCard label="Ativos / Trial" value={String(data?.activeTenants ?? 0)} icon={Activity} tone="success" />
        <MetricCard label="Suspensos" value={String(data?.suspendedTenants ?? 0)} icon={PauseCircle} tone="warning" />
        <MetricCard label="Pendentes" value={String(data?.pendingTenants ?? 0)} icon={Clock} tone="accent" />
        <MetricCard label="Novos (30 dias)" value={String(data?.newTenants30d ?? 0)} icon={Building2} tone="primary" />
        <MetricCard label="Apoiadores (global)" value={String(data?.totalSupporters ?? 0)} icon={Users} tone="accent" />
        <MetricCard label="Demandas (global)" value={String(data?.totalDemands ?? 0)} icon={MessageSquareWarning} tone="warning" />
      </div>
    </div>
  );
}
