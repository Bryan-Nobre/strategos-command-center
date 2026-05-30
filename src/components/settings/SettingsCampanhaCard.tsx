import { landingPublicPath } from "@/lib/landing-routes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsCampanhaCard({
  tenantName,
  plan,
  status,
  publicCode,
}: {
  tenantName: string;
  plan: string;
  status: string;
  publicCode: string;
}) {
  return (
    <Card className="settings-campanha-card shadow-elegant">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Campanha ativa</CardTitle>
        <CardDescription>{tenantName}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="capitalize">
          {plan}
        </Badge>
        <Badge variant="outline">Status: {status}</Badge>
        <Badge variant="outline" className="font-mono text-[10px]">
          {publicCode ? landingPublicPath(publicCode) : "Sem landing"}
        </Badge>
      </CardContent>
    </Card>
  );
}
