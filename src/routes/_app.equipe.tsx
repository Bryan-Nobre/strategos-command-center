import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UsersRound } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTeamMembers } from "@/hooks/use-team";
import { useTenant } from "@/hooks/use-tenant";
import { queryKeys } from "@/lib/query-keys";
import { createInvitation, listInvitations } from "@/services/team";
import type { Enums } from "@/types/supabase";

export const Route = createFileRoute("/_app/equipe")({
  component: EquipePage,
});

function EquipePage() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();

  const { data: team, isLoading: teamLoading } = useTeamMembers(tenantId);

  const { data: invitations } = useQuery({
    queryKey: queryKeys.invitations(tenantId),
    queryFn: () => listInvitations(tenantId),
    enabled: !!tenantId,
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Enums<"tenant_role">>("viewer");

  const inviteMutation = useMutation({
    mutationFn: () => createInvitation(tenantId, inviteEmail, inviteRole),
    onSuccess: (data) => {
      toast.success(`Convite criado. Link: /invite/${data.token}`);
      qc.invalidateQueries({ queryKey: queryKeys.invitations(tenantId) });
      setInviteEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (teamLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="Equipe" description="Gerencie membros e convites da campanha." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Membros ativos</CardTitle>
            <CardDescription>Usuários com acesso à campanha</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{team?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Convites pendentes</CardTitle>
            <CardDescription>Aguardando aceite</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{invitations?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Membros e convites
          </CardTitle>
          <CardDescription>
            Convide coordenadores, assessores e operadores. A autorização real é validada no
            backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 rounded-lg border bg-muted/30 p-4 md:grid-cols-12">
            <Input
              placeholder="e-mail"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="md:col-span-5"
            />
            <Select
              value={inviteRole}
              onValueChange={(v) => setInviteRole(v as Enums<"tenant_role">)}
            >
              <SelectTrigger className="md:col-span-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coordinator">Coordenador</SelectItem>
                <SelectItem value="advisor">Assessor</SelectItem>
                <SelectItem value="operator">Operador</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="md:col-span-3"
              size="sm"
              onClick={() => inviteMutation.mutate()}
              disabled={inviteMutation.isPending || !inviteEmail.trim()}
            >
              Convidar
            </Button>
          </div>
          <Separator />
          {(team ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">{m.profiles.full_name ?? "Membro"}</div>
                <div className="text-xs text-muted-foreground">{m.role}</div>
              </div>
              <Badge>{m.role}</Badge>
            </div>
          ))}
          {(invitations ?? []).map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
            >
              <span>{inv.email} (pendente)</span>
              <Link
                to="/invite/$token"
                params={{ token: inv.token }}
                className="text-primary text-xs"
              >
                Link convite
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
