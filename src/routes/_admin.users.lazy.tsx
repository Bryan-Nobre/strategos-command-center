import { createLazyFileRoute } from "@tanstack/react-router";
import { RoutePendingFallback } from "@/components/common/RoutePendingFallback";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { listPlatformUsers } from "@/services/admin";
import { queryKeys } from "@/lib/query-keys";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AdminUserCards } from "@/components/admin/AdminUserCards";

export const Route = createLazyFileRoute("/_admin/users")({
  component: AdminUsersPage,
  pendingComponent: RoutePendingFallback,
});

function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: queryKeys.adminUsers(),
    queryFn: listPlatformUsers,
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Usuários"
        description="Contas de campanha (exclui super administrador da plataforma)."
      />
      {(users ?? []).length === 0 ? (
        <EmptyState title="Nenhum usuário" description="Cadastros aparecerão após signup de campanhas." />
      ) : (
        <>
          <AdminUserCards users={users ?? []} />
          <Card className="admin-users-table shadow-elegant">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Nome</TableHead>
                    <TableHead>Campanhas</TableHead>
                    <TableHead>Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users ?? []).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.tenant_count}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
