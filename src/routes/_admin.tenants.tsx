import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminTenantCard } from "@/components/admin/AdminTenantCard";
import {
  listAllTenants,
  updateTenant,
  updateTenantAdminCrm,
  TENANT_STATUS_LABELS,
} from "@/services/admin";
import { TENANT_PLAN_LABELS } from "@/types/tenant";
import { queryKeys } from "@/lib/query-keys";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Enums } from "@/types/supabase";
import {
  adminTenantsApiFilters,
  parseAdminTenantsSearch,
  serializeAdminTenantsSearch,
  type AdminTenantsListSearch,
} from "@/lib/list-search/admin-tenants";
import { countActiveFilters } from "@/lib/list-search/utils";
import { useSyncedListSearch } from "@/hooks/use-synced-list-search";
import { ListUrlActions } from "@/components/common/ListUrlActions";

export const Route = createFileRoute("/_admin/tenants")({
  validateSearch: (search: Record<string, unknown>): AdminTenantsListSearch =>
    parseAdminTenantsSearch(search),
  component: AdminTenantsPage,
});

function AdminTenantsPage() {
  const qc = useQueryClient();
  const urlSearch = Route.useSearch();
  const { localText: search, setLocalText: setSearch, setSearch: replaceSearch } =
    useSyncedListSearch({
      search: urlSearch,
      serialize: serializeAdminTenantsSearch,
    });

  const apiFilters = adminTenantsApiFilters(urlSearch);

  const { data: tenants, isLoading } = useQuery({
    queryKey: queryKeys.adminTenants(apiFilters),
    queryFn: () => listAllTenants(apiFilters),
  });

  const tenantMutation = useMutation({
    mutationFn: ({
      id,
      status,
      plan,
    }: {
      id: string;
      status?: Enums<"tenant_status">;
      plan?: Enums<"tenant_plan">;
    }) => updateTenant(id, { status, plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics() });
      toast.success("Cliente atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const crmMutation = useMutation({
    mutationFn: ({
      tenantId,
      planPeriodStart,
      planPeriodEnd,
      comment,
    }: {
      tenantId: string;
      planPeriodStart: string | null;
      planPeriodEnd: string | null;
      comment: string | null;
    }) => updateTenantAdminCrm(tenantId, { planPeriodStart, planPeriodEnd, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success("Notas salvas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = (urlSearch.busca ?? "").toLowerCase();
    if (!q) return tenants ?? [];
    return (tenants ?? []).filter((t) =>
      [t.name, t.slug, t.admin_comment ?? ""].some((s) => s.toLowerCase().includes(q)),
    );
  }, [tenants, urlSearch.busca]);

  const statusFilter = urlSearch.status ?? "all";
  const planFilter = urlSearch.plano ?? "all";

  const activeFilterCount = countActiveFilters([
    statusFilter !== "all",
    planFilter !== "all",
    !!search.trim(),
  ]);

  const savingCrmId =
    crmMutation.isPending && crmMutation.variables ? crmMutation.variables.tenantId : null;

  function patchFilters(patch: Partial<AdminTenantsListSearch>) {
    replaceSearch(
      serializeAdminTenantsSearch({
        busca: urlSearch.busca,
        status: urlSearch.status,
        plano: urlSearch.plano,
        ...patch,
      }),
    );
  }

  function clearFilters() {
    setSearch("");
    replaceSearch({});
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Gestão de campanhas: status, plano, vigência do contrato (início/fim) com dias restantes e comentários internos."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar campanha ou comentário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            patchFilters({ status: v === "all" ? undefined : (v as Enums<"tenant_status">) })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {(Object.keys(TENANT_STATUS_LABELS) as Enums<"tenant_status">[]).map((s) => (
              <SelectItem key={s} value={s}>
                {TENANT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={planFilter}
          onValueChange={(v) =>
            patchFilters({ plano: v === "all" ? undefined : (v as Enums<"tenant_plan">) })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos planos</SelectItem>
            {(Object.keys(TENANT_PLAN_LABELS) as Enums<"tenant_plan">[]).map((p) => (
              <SelectItem key={p} value={p}>
                {TENANT_PLAN_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeFilterCount > 0 && <ListUrlActions onClear={clearFilters} />}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Ajuste os filtros ou aguarde novos cadastros."
          />
        )}
        {filtered.map((t) => (
          <AdminTenantCard
            key={t.id}
            tenant={t}
            isSaving={savingCrmId === t.id}
            onStatusPlanChange={(payload) => tenantMutation.mutate({ id: t.id, ...payload })}
            onCrmSave={(payload) =>
              crmMutation.mutate({
                tenantId: t.id,
                planPeriodStart: payload.planPeriodStart,
                planPeriodEnd: payload.planPeriodEnd,
                comment: payload.comment,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
