import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlatformUserRow } from "@/services/admin";

export function AdminUserCards({ users }: { users: PlatformUserRow[] }) {
  return (
    <div className="admin-users-cards grid gap-3">
      {users.map((u) => (
        <Card key={u.id} className="shadow-elegant">
          <CardContent className="space-y-2 p-4">
            <p className="font-medium leading-snug">{u.full_name ?? "—"}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Campanhas</span>
              <Badge variant="secondary" className="tabular-nums">
                {u.tenant_count}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Cadastro {new Date(u.created_at).toLocaleDateString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
