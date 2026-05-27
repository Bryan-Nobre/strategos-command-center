import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlanLimitEditor } from "@/components/admin/PlanLimitEditor";
import { LoadingState } from "@/components/common/LoadingState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";
import { PLAN_ADMIN_INTRO, PLAN_ORDER } from "@/lib/plan-field-meta";
import { listPlanLimitDefinitions, updatePlanLimitDefinition } from "@/services/admin-plans";
import { TENANT_PLAN_LABELS } from "@/types/tenant";
import { toast } from "sonner";
import type { Enums } from "@/types/supabase";

export const Route = createFileRoute("/_admin/plans")({
  component: AdminPlansPage,
});

function AdminPlansPage() {
  const qc = useQueryClient();

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
      payload: Parameters<typeof updatePlanLimitDefinition>[1];
    }) => updatePlanLimitDefinition(plan, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPlans() });
      qc.invalidateQueries({ queryKey: ["plan-usage"] });
      toast.success("Limites do plano atualizados");
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const byPlan = new Map((plans ?? []).map((p) => [p.plan, p]));
  const ordered = PLAN_ORDER.map((plan) => byPlan.get(plan)).filter(Boolean);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Planos comerciais"
        description={PLAN_ADMIN_INTRO}
      />

      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertTitle>Como isso se relaciona com Clientes</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Em <strong>Clientes</strong> você escolhe qual plano cada campanha usa (Trial, Basic, Pro…).
            Nesta tela você define <strong>o que cada plano permite</strong> — limites numéricos e módulos.
          </p>
          <p>
            <strong>Status</strong> (Ativo, Suspenso, Pendente, Cancelado) continua só em Clientes e controla
            se a campanha acessa o CRM, independentemente dos limites aqui.
          </p>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue={PLAN_ORDER[0]} className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {PLAN_ORDER.map((plan) => (
            <TabsTrigger key={plan} value={plan} className="min-w-[88px]">
              {TENANT_PLAN_LABELS[plan]}
            </TabsTrigger>
          ))}
        </TabsList>

        {ordered.map((row) =>
          row ? (
            <TabsContent key={row.plan} value={row.plan} className="mt-0">
              <PlanLimitEditor
                row={row}
                saving={mutation.isPending && mutation.variables?.plan === row.plan}
                onSave={(payload) => {
                  mutation.mutate({ plan: row.plan, payload });
                }}
              />
            </TabsContent>
          ) : null,
        )}
      </Tabs>
    </div>
  );
}
