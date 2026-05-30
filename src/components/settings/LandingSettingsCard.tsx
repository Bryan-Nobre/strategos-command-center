import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Copy, ExternalLink, Loader2, Palette, Trash2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LANDING_THEME_COLOR_FIELDS,
  serializeLandingTheme,
  validateLandingThemeColors,
  type LandingHeroStyle,
  type LandingPhotoStyle,
  type LandingTheme,
} from "@/lib/landing-theme";
import { POLITICAL_DECOR_ICONS } from "@/lib/political-decor-icons";
import { landingPublicPath } from "@/lib/landing-routes";
import { removeLandingHeroPhoto, uploadLandingHeroPhoto } from "@/services/landing-photo";
import { updateLandingPage } from "@/services/landing";

type Props = {
  tenantId: string;
  tenantName: string;
  publicCode: string;
  displayName: string;
  headline: string;
  landingBio: string;
  whatsapp: string;
  photoUrl: string;
  theme: LandingTheme;
  canEdit: boolean;
  onDisplayNameChange: (v: string) => void;
  onHeadlineChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onWhatsappChange: (v: string) => void;
  onPhotoUrlChange: (v: string) => void;
  onThemeChange: (theme: LandingTheme) => void;
};

export function LandingSettingsCard({
  tenantId,
  tenantName,
  publicCode,
  displayName,
  headline,
  landingBio,
  whatsapp,
  photoUrl,
  theme,
  canEdit,
  onDisplayNameChange,
  onHeadlineChange,
  onBioChange,
  onWhatsappChange,
  onPhotoUrlChange,
  onThemeChange,
}: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const saveLanding = useMutation({
    mutationFn: () => {
      const colorError = validateLandingThemeColors(theme);
      if (colorError) throw new Error(colorError);
      return updateLandingPage(tenantId, {
        display_name: displayName.trim() || null,
        headline: headline.trim() || null,
        bio: landingBio.trim() || null,
        whatsapp: whatsapp.trim() || null,
        photo_url: photoUrl.trim() || null,
        theme: serializeLandingTheme(theme) as never,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing", tenantId] });
      qc.invalidateQueries({ queryKey: ["public-landing", publicCode] });
      toast.success("Landing atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadLandingHeroPhoto(tenantId, file),
    onSuccess: (url) => {
      onPhotoUrlChange(url);
      toast.success("Imagem enviada. Salve para publicar na landing.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePhoto = useMutation({
    mutationFn: () => removeLandingHeroPhoto(tenantId),
    onSuccess: () => {
      onPhotoUrlChange("");
      toast.success("Imagem removida do storage. Salve para atualizar a landing.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const previewTitle = displayName.trim() || tenantName;

  return (
    <Card className="settings-panel shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          Landing pública
        </CardTitle>
        <CardDescription>
          Personalize textos, cores e a foto da página{" "}
          <Link
            to="/landpage/$code"
            params={{ code: publicCode }}
            className="font-medium text-primary hover:underline"
            target="_blank"
          >
            {landingPublicPath(publicCode)}
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {publicCode && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Código público da campanha</p>
              <p className="font-mono text-sm">{publicCode}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canEdit}
              onClick={() => {
                void navigator.clipboard.writeText(landingPublicPath(publicCode)).then(() => {
                  toast.success("Link copiado");
                });
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar link
            </Button>
          </div>
        )}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4 text-primary" />
            Identidade visual
          </div>

          <div className="settings-landing-preview rounded-xl border border-border/70 p-4">
            <div className="space-y-2">
              <div
                className="rounded-lg border border-border/60 p-3"
                style={
                  theme.background_color
                    ? { background: theme.background_color }
                    : { background: "hsl(var(--background))" }
                }
              >
                <div
                  className="rounded-md border border-border/50 p-3"
                  style={
                    theme.hero_background_color
                      ? { background: theme.hero_background_color }
                      : { background: "hsl(var(--card))" }
                  }
                >
                  <div className="flex items-center gap-3">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        className="h-10 w-10 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                        {previewTitle.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{previewTitle}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {headline.trim() || "Slogan da campanha"}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="mt-2 rounded-md px-3 py-2 text-[10px] text-muted-foreground"
                  style={
                    theme.middle_background_color
                      ? { background: theme.middle_background_color }
                      : undefined
                  }
                >
                  Meio · propostas e cadastro
                </div>
                <div
                  className="mt-2 rounded-md px-3 py-2 text-[10px] text-muted-foreground"
                  style={
                    theme.footer_background_color
                      ? { background: theme.footer_background_color }
                      : undefined
                  }
                >
                  Final · demandas e rodapé
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Prévia das três faixas de cor da landing.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nome na landing</Label>
              <Input
                value={displayName}
                disabled={!canEdit}
                placeholder={tenantName}
                onChange={(e) => onDisplayNameChange(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Substitui o nome da campanha no título público. Vazio usa «{tenantName}».
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {LANDING_THEME_COLOR_FIELDS.map(({ key, label, fallback }) => (
              <div key={key} className="grid gap-2">
                <Label>{label}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme[key] ?? fallback}
                    disabled={!canEdit}
                    className="h-10 w-14 cursor-pointer px-1 py-1"
                    onChange={(e) => onThemeChange({ ...theme, [key]: e.target.value })}
                  />
                  <Input
                    value={theme[key] ?? ""}
                    disabled={!canEdit}
                    placeholder={fallback}
                    onChange={(e) =>
                      onThemeChange({ ...theme, [key]: e.target.value || null })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Estilo do hero</Label>
              <Select
                value={theme.hero_style}
                disabled={!canEdit}
                onValueChange={(v) =>
                  onThemeChange({ ...theme, hero_style: v as LandingHeroStyle })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="minimal">Minimalista</SelectItem>
                  <SelectItem value="stamped">Estampado (marca d&apos;água)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Formato da foto</Label>
              <Select
                value={theme.photo_style}
                disabled={!canEdit}
                onValueChange={(v) =>
                  onThemeChange({ ...theme, photo_style: v as LandingPhotoStyle })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">Cantos arredondados</SelectItem>
                  <SelectItem value="circle">Circular</SelectItem>
                  <SelectItem value="stamped">Estampada (borda forte)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Elementos gráficos</p>
              <p className="text-xs text-muted-foreground">
                Gradientes e detalhes decorativos no hero.
              </p>
            </div>
            <Switch
              checked={theme.show_graphic_elements}
              disabled={!canEdit}
              onCheckedChange={(checked) =>
                onThemeChange({ ...theme, show_graphic_elements: checked })
              }
            />
          </div>

          <div className="rounded-lg border border-border/70 px-3 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Ícones políticos</p>
                <p className="text-xs text-muted-foreground">
                  Mesmos ícones do login: voto, bandeira, megafone, liderança e território.
                </p>
              </div>
              <Switch
                checked={theme.show_political_icons}
                disabled={!canEdit}
                onCheckedChange={(checked) =>
                  onThemeChange({ ...theme, show_political_icons: checked })
                }
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {POLITICAL_DECOR_ICONS.map(({ id, Icon, label }) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground"
                  title={label}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    strokeWidth={1.5}
                    style={
                      theme.political_icons_color
                        ? { color: theme.political_icons_color }
                        : undefined
                    }
                  />
                  {label}
                </span>
              ))}
            </div>
            {theme.show_political_icons && (
              <div className="mt-4 grid gap-2 sm:max-w-sm">
                <Label>Cor dos ícones</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.political_icons_color ?? "#10944a"}
                    disabled={!canEdit}
                    className="h-10 w-14 cursor-pointer px-1 py-1"
                    onChange={(e) =>
                      onThemeChange({ ...theme, political_icons_color: e.target.value })
                    }
                  />
                  <Input
                    value={theme.political_icons_color ?? ""}
                    disabled={!canEdit}
                    placeholder="#10944a (padrão da campanha)"
                    onChange={(e) =>
                      onThemeChange({
                        ...theme,
                        political_icons_color: e.target.value || null,
                      })
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Vazio usa a cor primária do tema. Ajuste a opacidade pelo contraste com o fundo.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4 border-t border-border/60 pt-6">
          <p className="text-sm font-semibold">Imagem do candidato / campanha</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={previewTitle}
                  className="h-24 w-24 rounded-2xl border border-border object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                  Sem foto
                </div>
              )}
              {canEdit && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full shadow"
                  disabled={uploadPhoto.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadPhoto.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                JPEG, PNG ou WebP · até 3 MB. Aparece no topo da landing e, no estilo estampado,
                como marca d&apos;água.
              </p>
              {canEdit && photoUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletePhoto.isPending}
                  onClick={() => deletePhoto.mutate()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover arquivo
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto.mutate(file);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-border/60 pt-6">
          <p className="text-sm font-semibold">Textos públicos</p>
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
        </section>

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
