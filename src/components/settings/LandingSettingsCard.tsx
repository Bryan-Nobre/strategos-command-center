import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Camera, Copy, ExternalLink, ListChecks, Loader2, Palette, Shield, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidBrPhoneOptional, normalizeSupporterPhone, PHONE_INVALID_MSG } from "@/lib/normalize-phone";
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
  DEFAULT_LANDING_ACCENT,
  LANDING_THEME_COLOR_FIELDS,
  serializeLandingTheme,
  validateLandingThemeColors,
  type LandingHeroStyle,
  type LandingPhotoStyle,
  type LandingTheme,
} from "@/lib/landing-theme";
import { POLITICAL_DECOR_ICONS } from "@/lib/political-decor-icons";
import { landingPublicPath, landingPublicUrl } from "@/lib/landing-routes";
import {
  normalizeInstagramUrl,
  serializeLandingSocialLinks,
} from "@/lib/landing-social";
import { removeLandingHeroPhoto, uploadLandingHeroPhoto } from "@/services/landing-photo";
import { updateLandingPage } from "@/services/landing";
import { LandingProposalsEditor } from "@/components/settings/LandingProposalsEditor";
import { LandingLivePreview } from "@/components/settings/LandingLivePreview";
import { accentContrastWarning } from "@/lib/color-contrast";
import {
  buildLandingSettingsSnapshot,
  landingSettingsSnapshotsEqual,
  type LandingSettingsSnapshot,
} from "@/lib/landing-settings-snapshot";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes";
import {
  serializeLandingProposals,
  validateLandingProposals,
  type LandingProposalItem,
} from "@/lib/landing-proposals";

type Props = {
  tenantId: string;
  tenantName: string;
  publicCode: string;
  displayName: string;
  headline: string;
  landingBio: string;
  whatsapp: string;
  instagram: string;
  socialLinks: unknown;
  photoUrl: string;
  theme: LandingTheme;
  proposals: LandingProposalItem[];
  canEdit: boolean;
  onDisplayNameChange: (v: string) => void;
  onHeadlineChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onWhatsappChange: (v: string) => void;
  onInstagramChange: (v: string) => void;
  onPhotoUrlChange: (v: string) => void;
  onThemeChange: (theme: LandingTheme) => void;
  onProposalsChange: (items: LandingProposalItem[]) => void;
  lgpdControllerName: string;
  lgpdControllerCpf: string;
  lgpdControllerEmail: string;
  lgpdRevokeConsentUrl: string;
  onLgpdControllerNameChange: (v: string) => void;
  onLgpdControllerCpfChange: (v: string) => void;
  onLgpdControllerEmailChange: (v: string) => void;
  onLgpdRevokeConsentUrlChange: (v: string) => void;
  savedSnapshot: LandingSettingsSnapshot | null;
  onDirtyChange?: (dirty: boolean) => void;
};

export function LandingSettingsCard({
  tenantId,
  tenantName,
  publicCode,
  displayName,
  headline,
  landingBio,
  whatsapp,
  instagram,
  socialLinks,
  photoUrl,
  theme,
  proposals,
  canEdit,
  onDisplayNameChange,
  onHeadlineChange,
  onBioChange,
  onWhatsappChange,
  onInstagramChange,
  onPhotoUrlChange,
  onThemeChange,
  onProposalsChange,
  lgpdControllerName,
  lgpdControllerCpf,
  lgpdControllerEmail,
  lgpdRevokeConsentUrl,
  onLgpdControllerNameChange,
  onLgpdControllerCpfChange,
  onLgpdControllerEmailChange,
  onLgpdRevokeConsentUrlChange,
  savedSnapshot,
  onDirtyChange,
}: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const saveLanding = useMutation({
    mutationFn: () => {
      const colorError = validateLandingThemeColors(theme);
      if (colorError) throw new Error(colorError);
      if (!isValidBrPhoneOptional(whatsapp)) {
        throw new Error(PHONE_INVALID_MSG);
      }
      const igRaw = instagram.trim();
      if (igRaw && !normalizeInstagramUrl(igRaw)) {
        throw new Error("Instagram inválido. Use @usuario ou o link completo do perfil.");
      }
      const proposalError = validateLandingProposals(proposals);
      if (proposalError) throw new Error(proposalError);
      const serializedProposals = serializeLandingProposals(proposals);
      return updateLandingPage(tenantId, {
        display_name: displayName.trim() || null,
        headline: headline.trim() || null,
        bio: landingBio.trim() || null,
        proposals: serializedProposals as never,
        whatsapp: normalizeSupporterPhone(whatsapp),
        social_links: serializeLandingSocialLinks(socialLinks, instagram) as never,
        photo_url: photoUrl.trim() || null,
        theme: serializeLandingTheme(theme) as never,
        lgpd_controller_name: lgpdControllerName.trim() || null,
        lgpd_controller_cpf: lgpdControllerCpf.trim() || null,
        lgpd_controller_email: lgpdControllerEmail.trim() || null,
        lgpd_revoke_consent_url: lgpdRevokeConsentUrl.trim() || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing", tenantId] });
      qc.invalidateQueries({ queryKey: ["public-landing", publicCode] });
      toast.success("Landing atualizada");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar a landing."),
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
  const previewAccent = theme.accent_color ?? DEFAULT_LANDING_ACCENT;
  const accentWarning = accentContrastWarning(
    previewAccent,
    theme.hero_background_color ?? theme.background_color,
  );

  const currentSnapshot = useMemo(
    () =>
      buildLandingSettingsSnapshot({
        displayName,
        headline,
        landingBio,
        whatsapp,
        instagram,
        photoUrl,
        theme,
        proposals,
        lgpdControllerName,
        lgpdControllerCpf,
        lgpdControllerEmail,
        lgpdRevokeConsentUrl,
      }),
    [
      displayName,
      headline,
      landingBio,
      whatsapp,
      instagram,
      photoUrl,
      theme,
      proposals,
      lgpdControllerName,
      lgpdControllerCpf,
      lgpdControllerEmail,
      lgpdRevokeConsentUrl,
    ],
  );

  const isDirty = savedSnapshot
    ? !landingSettingsSnapshotsEqual(currentSnapshot, savedSnapshot)
    : false;

  useUnsavedChangesWarning(isDirty, canEdit);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

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
              <p className="text-xs font-medium text-muted-foreground">Link público da campanha</p>
              <p className="break-all font-mono text-sm">{landingPublicUrl(publicCode)}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canEdit}
              onClick={() => {
                void navigator.clipboard.writeText(landingPublicUrl(publicCode)).then(() => {
                  toast.success("Link completo copiado");
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

          <LandingLivePreview
            title={previewTitle}
            headline={headline}
            photoUrl={photoUrl}
            theme={theme}
            proposals={proposals}
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            O cadastro tem 3 passos (dados, endereço e apoio com LGPD). O passo «Seu bairro» é extra e
            opcional — envio de demanda exige LGPD e usa o botão no rodapé do passo. O rodapé da página é
            só texto, sem bloco colorido.
          </p>

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

          <div className="grid gap-2 sm:max-w-md">
            <Label>Detalhes pequenos (botão, círculo, coração e etc.)</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.accent_color ?? DEFAULT_LANDING_ACCENT}
                disabled={!canEdit}
                className="h-10 w-14 cursor-pointer px-1 py-1"
                onChange={(e) => onThemeChange({ ...theme, accent_color: e.target.value })}
              />
              <Input
                value={theme.accent_color ?? ""}
                disabled={!canEdit}
                placeholder={`${DEFAULT_LANDING_ACCENT} (padrão da campanha)`}
                onChange={(e) =>
                  onThemeChange({ ...theme, accent_color: e.target.value || null })
                }
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cor dos botões, checkboxes, coração, bolinhas decorativas e demais destaques na
              landing. Vazio usa o verde padrão da plataforma.
            </p>
            {accentWarning && (
              <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {accentWarning}
              </p>
            )}
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
                      theme.political_icons_color || theme.accent_color
                        ? { color: theme.political_icons_color ?? theme.accent_color ?? undefined }
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
                    value={theme.political_icons_color ?? theme.accent_color ?? DEFAULT_LANDING_ACCENT}
                    disabled={!canEdit}
                    className="h-10 w-14 cursor-pointer px-1 py-1"
                    onChange={(e) =>
                      onThemeChange({ ...theme, political_icons_color: e.target.value })
                    }
                  />
                  <Input
                    value={theme.political_icons_color ?? ""}
                    disabled={!canEdit}
                    placeholder={`${DEFAULT_LANDING_ACCENT} (usa cor dos detalhes pequenos)`}
                    onChange={(e) =>
                      onThemeChange({
                        ...theme,
                        political_icons_color: e.target.value || null,
                      })
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Vazio usa a cor dos detalhes pequenos (ou o verde padrão). Ajuste o contraste com o fundo.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>WhatsApp</Label>
              <PhoneInput
                value={whatsapp}
                disabled={!canEdit}
                onValueChange={onWhatsappChange}
              />
              <p className="text-xs text-muted-foreground">
                Botão no topo da landing. Salvo com DDD (apenas números).
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Instagram</Label>
              <Input
                value={instagram}
                disabled={!canEdit}
                placeholder="@usuario ou link do perfil"
                onChange={(e) => onInstagramChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Botão ao lado do WhatsApp no topo da landing pública.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-border/60 pt-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="h-4 w-4 text-primary" />
            Propostas da campanha
          </div>
          <p className="text-xs text-muted-foreground">
            Cards exibidos na landing pública, entre o hero e o formulário «Quero apoiar».
          </p>
          <LandingProposalsEditor
            proposals={proposals}
            canEdit={canEdit}
            onChange={onProposalsChange}
          />
        </section>

        <section className="space-y-4 border-t border-border/60 pt-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-primary" />
            Termo de consentimento (LGPD)
          </div>
          <p className="text-xs text-muted-foreground">
            Exibido no cadastro «Quero apoiar». O nome do controlador usa o campo abaixo; se vazio,
            usa o nome na landing ou o da campanha.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label>Nome do controlador</Label>
              <Input
                value={lgpdControllerName}
                disabled={!canEdit}
                placeholder={previewTitle}
                onChange={(e) => onLgpdControllerNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>CPF do controlador</Label>
              <Input
                value={lgpdControllerCpf}
                disabled={!canEdit}
                placeholder="Ex.: 000.000.000-00"
                onChange={(e) => onLgpdControllerCpfChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>E-mail de atendimento LGPD</Label>
              <Input
                type="email"
                value={lgpdControllerEmail}
                disabled={!canEdit}
                placeholder="contato@campanha.org.br"
                onChange={(e) => onLgpdControllerEmailChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>URL para revogar consentimento</Label>
              <Input
                type="url"
                value={lgpdRevokeConsentUrl}
                disabled={!canEdit}
                placeholder="https://strategos-command-center.vercel.app/lgpd/seu-codigo/revogar"
                onChange={(e) => onLgpdRevokeConsentUrlChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se vazio, usa a página de revogação da área LGPD desta campanha (
                <span className="font-mono">/lgpd/{publicCode || "código"}/revogar</span>).
              </p>
            </div>
          </div>
        </section>

        {canEdit && (
          <div className="sticky bottom-0 z-10 -mx-1 space-y-3 border-t border-border/60 bg-background/95 px-1 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            {isDirty && (
              <p className="text-center text-xs text-amber-700 dark:text-amber-400">
                Você tem alterações não salvas na landing.
              </p>
            )}
            <div className="flex justify-end">
              <Button disabled={saveLanding.isPending || !isDirty} onClick={() => saveLanding.mutate()}>
                {saveLanding.isPending ? "Salvando..." : "Salvar landing"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
