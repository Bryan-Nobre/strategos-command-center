import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { RoutePendingFallback } from "@/components/common/RoutePendingFallback";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminPlatformMetrics } from "@/components/admin/AdminPlatformMetrics";
import { getPlatformMetrics } from "@/services/admin";
import { queryKeys } from "@/lib/query-keys";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createLazyFileRoute("/_admin/metricas")({
  component: AdminMetricsPage,
  pendingComponent: RoutePendingFallback,
});

function AdminMetricsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.adminMetrics(),
    queryFn: getPlatformMetrics,
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingState label="Carregando métricas…" />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Métricas da plataforma"
          description="Panorama comercial e operacional — apenas clientes reais (exclui contas super admin)."
        />
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link to="/tenants">Ver clientes</Link>
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar métricas</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Tente novamente."}
          </AlertDescription>
        </Alert>
      )}

      {data && <AdminPlatformMetrics data={data} />}
    </div>
  );
}
