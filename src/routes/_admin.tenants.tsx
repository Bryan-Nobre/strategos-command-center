import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { listAllTenants, updateTenant } from "@/services/admin";
import { LoadingState } from "@/components/common/LoadingState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Enums } from "@/types/supabase";

export const Route = createFileRoute("/_admin/tenants")({
  path: "/tenants",
  component: AdminTenantsPage,
});

function AdminTenantsPage() {
  const qc = useQueryClient();
  const { data: tenants, isLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: listAllTenants,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, plan }: { id: string; status?: Enums<"tenant_status">; plan?: Enums<"tenant_plan"> }) =>
      updateTenant(id, { status, plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success("Cliente atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader title="Clientes" description="Gerencie contas, planos e status da plataforma." />
      <div className="space-y-3">
        {(tenants ?? []).map((t) => (
          <Card key={t.id} className="shadow-elegant">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">/{t.slug} · {t.plan}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={t.status === "active" ? "default" : "destructive"}>{t.status}</Badge>
                <Select
                  value={t.status}
                  onValueChange={(v) => mutation.mutate({ id: t.id, status: v as Enums<"tenant_status"> })}
                >
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
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
                  <a href={`/p/${t.slug}`} target="_blank" rel="noreferrer">Ver landing</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
