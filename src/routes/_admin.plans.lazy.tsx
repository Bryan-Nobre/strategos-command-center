import { createLazyFileRoute } from "@tanstack/react-router";
import { RoutePendingFallback } from "@/components/common/RoutePendingFallback";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminPlansPricingGrid } from "@/components/admin/AdminPlansPricingGrid";
import { PlanLimitEditor } from "@/components/admin/PlanLimitEditor";
import { LoadingState } from "@/components/common/LoadingState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { queryKeys } from "@/lib/query-keys";
import { PLAN_ADMIN_INTRO, PLAN_COMMERCIAL_ORDER, PLAN_ORDER } from "@/lib/plan-field-meta";
import { filterListedPlans } from "@/lib/plan-display";
import {
  listPlanLimitDefinitions,
  updatePlanLimitDefinition,
  type AdminPlanLimitRow,
  type UpdatePlanLimitPayload,
} from "@/services/admin-plans";
import type { TenantPlan } from "@/types/tenant";
import { toast } from "sonner";
import type { Enums } from "@/types/supabase";

export const Route = createLazyFileRoute("/_admin/plans")({
  component: AdminPlansPage,
  pendingComponent: RoutePendingFallback,
});

function rowToPayload(row: AdminPlanLimitRow): UpdatePlanLimitPayload {
  return {
    maxSupporters: row.maxSupporters,
    maxTeamMembers: row.maxTeamMembers,
    maxRegions: row.maxRegions,
    exportsEnabled: row.exportsEnabled,
    pollsEnabled: row.pollsEnabled,
    tagline: row.tagline,
    priceLabel: row.priceLabel,
    isHighlighted: row.isHighlighted,
    highlightStyle: row.highlightStyle,
    isListed: row.isListed,
  };
}

function AdminPlansPage() {
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan>(PLAN_COMMERCIAL_ORDER[0]);

  const { data: plans, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.adminPlans(),
    queryFn: listPlanLimitDefinitions,
  });

  const mutation = useMutation({
    mutationFn: ({
      plan,
      payload,
    }: {
      plan: Enums<"tenant_plan">;
      payload: UpdatePlanLimitPayload;
    }) => updatePlanLimitDefinition(plan, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPlans() });
      qc.invalidateQueries({ queryKey: queryKeys.planCatalog() });
      qc.invalidateQueries({ queryKey: ["plan-usage"] });
      toast.success("Plano atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ordered = useMemo(() => {
    const byPlan = new Map((plans ?? []).map((p) => [p.plan, p]));
    return PLAN_ORDER.map((plan) => byPlan.get(plan)).filter(Boolean) as AdminPlanLimitRow[];
  }, [plans]);

  const listedPlans = useMemo(() => filterListedPlans(ordered), [ordered]);
  const selectedRow = ordered.find((row) => row.plan === selectedPlan) ?? listedPlans[0] ?? ordered[0];

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Erro ao carregar planos</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Planos comerciais" description={PLAN_ADMIN_INTRO} />

      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertTitle>Como isso se relaciona com Clientes</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Em <strong>Clientes</strong> você escolhe qual plano cada campanha usa (Basic, Pro… ou
            Start interno). Nesta tela você define <strong>o que cada plano permite</strong> —
            limites, preços na vitrine e módulos.
          </p>
          <p>
            <strong>Status</strong> (Ativo, Suspenso, Pendente, Cancelado) continua só em Clientes e
            controla se a campanha acessa o CRM, independentemente dos limites aqui.
          </p>
        </AlertDescription>
      </Alert>

      <AdminPlansPricingGrid
        plans={listedPlans}
        allPlans={ordered}
        selectedPlan={selectedRow?.plan as TenantPlan}
        savingPlan={
          mutation.isPending ? (mutation.variables?.plan as TenantPlan) : null
        }
        onSelectPlan={setSelectedPlan}
        onToggleHighlight={(plan, highlighted) => {
          const row = ordered.find((p) => p.plan === plan);
          if (!row) return;
          mutation.mutate({
            plan,
            payload: { ...rowToPayload(row), isHighlighted: highlighted },
          });
        }}
      />

      {selectedRow && (
        <PlanLimitEditor
          row={selectedRow}
          saving={mutation.isPending && mutation.variables?.plan === selectedRow.plan}
          onSave={(payload) => {
            mutation.mutate({ plan: selectedRow.plan, payload });
          }}
        />
      )}
    </div>
  );
}
