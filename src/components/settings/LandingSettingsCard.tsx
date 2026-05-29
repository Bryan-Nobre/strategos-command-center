import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLandingPage } from "@/services/landing";

export function LandingSettingsCard({
  tenantId,
  slug,
  headline,
  landingBio,
  whatsapp,
  canEdit,
  onHeadlineChange,
  onBioChange,
  onWhatsappChange,
}: {
  tenantId: string;
  slug: string;
  headline: string;
  landingBio: string;
  whatsapp: string;
  canEdit: boolean;
  onHeadlineChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onWhatsappChange: (v: string) => void;
}) {
  const qc = useQueryClient();

  const saveLanding = useMutation({
    mutationFn: () => updateLandingPage(tenantId, { headline, bio: landingBio, whatsapp }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing", tenantId] });
      toast.success("Landing atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="settings-panel shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          Landing pública
        </CardTitle>
        <CardDescription>
          Textos básicos da página{" "}
          <Link
            to="/p/$slug"
            params={{ slug }}
            className="font-medium text-primary hover:underline"
            target="_blank"
          >
            /p/{slug}
          </Link>
          . Editor completo virá em uma próxima etapa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2">
          <Label>Slogan</Label>
          <Input
            value={headline}
            disabled={!canEdit}
            onChange={(e) => onHeadlineChange(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Bio pública</Label>
          <Textarea
            value={landingBio}
            disabled={!canEdit}
            onChange={(e) => onBioChange(e.target.value)}
            rows={4}
          />
        </div>
        <div className="grid gap-2 sm:max-w-sm">
          <Label>WhatsApp</Label>
          <Input
            value={whatsapp}
            disabled={!canEdit}
            onChange={(e) => onWhatsappChange(e.target.value)}
            placeholder="5511999990000"
          />
        </div>
        {canEdit && (
          <div className="flex justify-end border-t border-border/60 pt-4">
            <Button disabled={saveLanding.isPending} onClick={() => saveLanding.mutate()}>
              {saveLanding.isPending ? "Salvando..." : "Salvar landing"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
