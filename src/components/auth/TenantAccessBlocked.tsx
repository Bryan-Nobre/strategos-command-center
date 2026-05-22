import { CreditCard, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tenant } from "@/lib/supabase/session";
import {
  getTenantAccessMessage,
  PLATFORM_CONTACT_EMAIL,
} from "@/lib/tenant-access";
import { signOut } from "@/lib/supabase/session";

type TenantAccessBlockedProps = {
  tenant: Tenant;
};

export function TenantAccessBlocked({ tenant }: TenantAccessBlockedProps) {
  const { title, description } = getTenantAccessMessage(tenant.status);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
            <CreditCard className="h-7 w-7" />
          </div>
          <Badge variant="secondary" className="mb-2">
            {tenant.status === "suspended" ? "Aguardando pagamento" : tenant.status}
          </Badge>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-medium text-foreground">{tenant.name}</p>
            <p className="text-muted-foreground">Plano: {tenant.plan}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="default" className="flex-1" asChild>
              <a href={`mailto:${PLATFORM_CONTACT_EMAIL}`}>
                <Mail className="mr-2 h-4 w-4" />
                Falar com o administrador
              </a>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => void signOut().then(() => { window.location.href = "/login"; })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Após a confirmação do pagamento, o administrador alterará o status da sua conta para{" "}
            <strong>Ativo</strong> e você poderá usar o sistema normalmente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
