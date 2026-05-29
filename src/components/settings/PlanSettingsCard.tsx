import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PlanSettingsCard({
  plan,
  status,
}: {
  plan: string;
  status: string;
}) {
  return (
    <Card className="settings-panel shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Plano atual
        </CardTitle>
        <CardDescription>
          Upgrade, faturamento e limites comerciais serão tratados em um módulo dedicado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge className="px-4 py-2 text-base capitalize">{plan}</Badge>
        <p className="text-sm text-muted-foreground">Status da campanha: {status}</p>
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-4 text-xs text-muted-foreground">
          Em breve: comparativo de planos, uso de limites e solicitação de upgrade sem sair do CRM.
        </p>
      </CardContent>
    </Card>
  );
}
