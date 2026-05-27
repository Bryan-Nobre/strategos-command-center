import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { listAllTenants, updateTenant, TENANT_STATUS_LABELS } from "@/services/admin";
import { queryKeys } from "@/lib/query-keys";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Enums } from "@/types/supabase";

export const Route = createFileRoute("/_admin/tenants")({
  path: "/tenants",
  component: AdminTenantsPage,
});

const statusBadgeVariant = (status: Enums<"tenant_status">) => {
  if (status === "active" || status === "trial") return "default" as const;
  if (status === "suspended" || status === "pending") return "secondary" as const;
  return "outline" as const;
};

function AdminTenantsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<Enums<"tenant_status"> | "all">("all");
  const [planFilter, setPlanFilter] = useState<Enums<"tenant_plan"> | "all">("all");
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({
      status: statusFilter === "all" ? undefined : statusFilter,
      plan: planFilter === "all" ? undefined : planFilter,
    }),
    [statusFilter, planFilter],
  );

  const { data: tenants, isLoading } = useQuery({
    queryKey: queryKeys.adminTenants(filters),
    queryFn: () => listAllTenants(filters),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, plan }: { id: string; status?: Enums<"tenant_status">; plan?: Enums<"tenant_plan"> }) =>
      updateTenant(id, { status, plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics() });
      toast.success("Cliente atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (tenants ?? []).filter((t) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return [t.name, t.slug].some((s) => s.toLowerCase().includes(q));
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Novos cadastros entram como Suspensos. Após pagamento, altere para Ativo ou Trial."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar campanha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {(Object.keys(TENANT_STATUS_LABELS) as Enums<"tenant_status">[]).map((s) => (
              <SelectItem key={s} value={s}>{TENANT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as typeof planFilter)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos planos</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Ajuste os filtros ou aguarde novos cadastros."
          />
        )}
        {filtered.map((t) => (
          <Card key={t.id} className="shadow-elegant">
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{t.name}</span>
                  <Badge variant={statusBadgeVariant(t.status)}>
                    {TENANT_STATUS_LABELS[t.status] ?? t.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  /{t.slug} · Plano {t.plan} · {t.member_count} usuários · {t.supporter_count} apoiadores
                </div>
                <div className="text-xs text-muted-foreground">
                  Criado em {new Date(t.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={t.status}
                  onValueChange={(v) => mutation.mutate({ id: t.id, status: v as Enums<"tenant_status"> })}
                >
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={t.plan}
                  onValueChange={(v) => mutation.mutate({ id: t.id, plan: v as Enums<"tenant_plan"> })}
                >
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/p/${t.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />Landing
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
