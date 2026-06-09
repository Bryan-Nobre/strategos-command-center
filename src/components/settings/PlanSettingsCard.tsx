import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { PlanPricingGrid } from "@/components/settings/PlanPricingGrid";
import { LoadingState } from "@/components/common/LoadingState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys } from "@/lib/query-keys";
import { listPlanCatalog } from "@/services/plan-catalog";
import {
  TENANT_PLAN_LABELS,
  TENANT_STATUS_LABELS,
  type TenantPlan,
  type TenantStatus,
} from "@/types/tenant";

export function PlanSettingsCard({
  plan,
  status,
}: {
  plan: TenantPlan;
  status: TenantStatus;
}) {
  const {
    data: plans,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.planCatalog(),
    queryFn: listPlanCatalog,
    staleTime: 5 * 60_000,
  });

  const planLabel = TENANT_PLAN_LABELS[plan] ?? plan;
  const statusLabel = TENANT_STATUS_LABELS[status] ?? status;

  return (
    <div className="space-y-6">
      <Card className="settings-panel shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Plano atual
          </CardTitle>
          <CardDescription>
            Sua campanha está no plano {planLabel}. Compare abaixo com os demais planos comerciais.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge className="px-4 py-2 text-base">{planLabel}</Badge>
          <Badge variant="outline">Status: {statusLabel}</Badge>
        </CardContent>
      </Card>

      {isLoading && <LoadingState label="Carregando planos…" />}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar planos</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Tente novamente em instantes."}
          </AlertDescription>
        </Alert>
      )}

      {plans && plans.length > 0 && <PlanPricingGrid plans={plans} currentPlan={plan} />}
    </div>
  );
}
