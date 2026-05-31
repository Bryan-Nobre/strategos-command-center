import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ExternalLink, Shield, Target, User } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/common/LoadingState";
import { useTenant } from "@/hooks/use-tenant";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { useTenantPermissions } from "@/hooks/use-tenant-permissions";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { getLandingPage } from "@/services/landing";
import {
  DEFAULT_LANDING_THEME,
  parseLandingTheme,
  type LandingTheme,
} from "@/lib/landing-theme";
import { formatPhoneBrDisplay } from "@/lib/normalize-phone";
import { getInstagramFromSocialLinks } from "@/lib/landing-social";
import {
  parseConfiguracoesSearch,
  resolveAllowedConfigTab,
  serializeConfiguracoesSearch,
  type ConfigTab,
} from "@/lib/list-search/configuracoes";
import { SettingsCampanhaCard } from "@/components/settings/SettingsCampanhaCard";
import { ProfileSettingsCard } from "@/components/settings/ProfileSettingsCard";
import { LandingSettingsCard } from "@/components/settings/LandingSettingsCard";
import { GoalsSettingsSection } from "@/components/settings/GoalsSettingsSection";
import { NotificationsSettingsSection } from "@/components/settings/NotificationsSettingsSection";
import { PlanSettingsCard } from "@/components/settings/PlanSettingsCard";
import { useRouteContext } from "@tanstack/react-router";
import type { TenantPlan, TenantStatus } from "@/types/tenant";

export const Route = createFileRoute("/_app/configuracoes")({
  validateSearch: parseConfiguracoesSearch,
  component: ConfigPage,
});

function ConfigPage() {
  const { tenantId, activeTenant } = useTenant();
  const permsQuery = useTenantPermissions(tenantId);
  const perms = useCrudPermissions("settings");
  const { profile } = useRouteContext({ from: "/_app" });
  const urlSearch = Route.useSearch();
  const navigate = Route.useNavigate();

  const tabPerms = useMemo(
    () => ({
      canEditProfile: !permsQuery.isLoading && perms.canEditProfile,
      canEditLanding: !permsQuery.isLoading && perms.canEditLanding,
      canEditGoals: !permsQuery.isLoading && perms.canEditGoals,
      canEditNotifications: !permsQuery.isLoading && perms.canEditNotifications,
    }),
    [
      permsQuery.isLoading,
      perms.canEditProfile,
      perms.canEditLanding,
      perms.canEditGoals,
      perms.canEditNotifications,
    ],
  );

  const activeTab = useMemo(
    () => resolveAllowedConfigTab(urlSearch.tab, tabPerms),
    [urlSearch.tab, tabPerms],
  );

  useEffect(() => {
    if (permsQuery.isLoading) return;
    if (urlSearch.tab === activeTab) return;
    void navigate({
      search: serializeConfiguracoesSearch({ tab: activeTab }) as never,
      replace: true,
    });
  }, [activeTab, navigate, permsQuery.isLoading, urlSearch.tab]);

  const { data: landing } = useQuery({
    queryKey: ["landing", tenantId],
    queryFn: () => getLandingPage(tenantId),
    enabled: !!tenantId,
  });

  const [headline, setHeadline] = useState("");
  const [landingBio, setLandingBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [theme, setTheme] = useState<LandingTheme>(DEFAULT_LANDING_THEME);
  const [lgpdControllerName, setLgpdControllerName] = useState("");
  const [lgpdControllerCpf, setLgpdControllerCpf] = useState("");
  const [lgpdControllerEmail, setLgpdControllerEmail] = useState("");
  const [lgpdRevokeConsentUrl, setLgpdRevokeConsentUrl] = useState("");

  useEffect(() => {
    if (landing) {
      setHeadline(landing.headline ?? "");
      setLandingBio(landing.bio ?? "");
      setWhatsapp(landing.whatsapp ? formatPhoneBrDisplay(landing.whatsapp) : "");
      setInstagram(getInstagramFromSocialLinks(landing.social_links));
      setDisplayName(landing.display_name ?? "");
      setPhotoUrl(landing.photo_url ?? "");
      setTheme(parseLandingTheme(landing.theme));
      setLgpdControllerName(landing.lgpd_controller_name ?? "");
      setLgpdControllerCpf(landing.lgpd_controller_cpf ?? "");
      setLgpdControllerEmail(landing.lgpd_controller_email ?? "");
      setLgpdRevokeConsentUrl(landing.lgpd_revoke_consent_url ?? "");
    }
  }, [landing]);

  function setTab(tab: ConfigTab) {
    const next = resolveAllowedConfigTab(tab, tabPerms);
    void navigate({
      search: serializeConfiguracoesSearch({ tab: next }) as never,
      replace: true,
    });
  }

  const publicCode = landing?.public_code ?? "";

  if (permsQuery.isLoading) {
    return (
      <ModuleRouteGuard module="settings">
        <LoadingState label="Carregando configurações…" />
      </ModuleRouteGuard>
    );
  }

  return (
    <ModuleRouteGuard module="settings">
      <div className="settings-page mx-auto w-full max-w-7xl space-y-6">
        <PageHeader
          title="Configurações"
          description="Perfil, metas da campanha e preferências de alertas."
        />

        <SettingsCampanhaCard
          tenantName={activeTenant?.name ?? "Sem campanha"}
          plan={activeTenant?.plan ?? "start"}
          status={activeTenant?.status ?? "—"}
          publicCode={publicCode}
        />

        <Tabs value={activeTab} onValueChange={(v) => setTab(v as ConfigTab)} className="space-y-4">
          <TabsList className="settings-tabs-list h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1.5">
            {tabPerms.canEditProfile && (
              <TabsTrigger value="perfil" className="settings-tab-trigger gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
            )}
            {tabPerms.canEditLanding && (
              <TabsTrigger value="landing" className="settings-tab-trigger gap-2">
                <ExternalLink className="h-4 w-4" />
                Landing
              </TabsTrigger>
            )}
            {tabPerms.canEditGoals && (
              <TabsTrigger value="metas" className="settings-tab-trigger gap-2">
                <Target className="h-4 w-4" />
                Metas
              </TabsTrigger>
            )}
            {tabPerms.canEditNotifications && (
              <TabsTrigger value="notificacoes" className="settings-tab-trigger gap-2">
                <Bell className="h-4 w-4" />
                Notificações
              </TabsTrigger>
            )}
            <TabsTrigger value="plano" className="settings-tab-trigger gap-2">
              <Shield className="h-4 w-4" />
              Plano
            </TabsTrigger>
          </TabsList>

          {tabPerms.canEditProfile && (
            <TabsContent value="perfil">
              <ProfileSettingsCard profile={profile} canEdit={perms.canEditProfile} />
            </TabsContent>
          )}

          {tabPerms.canEditLanding && (
            <TabsContent value="landing">
              <LandingSettingsCard
                tenantId={tenantId}
                tenantName={activeTenant?.name ?? "Campanha"}
                publicCode={publicCode}
                displayName={displayName}
                headline={headline}
                landingBio={landingBio}
                whatsapp={whatsapp}
                instagram={instagram}
                socialLinks={landing?.social_links}
                photoUrl={photoUrl}
                theme={theme}
                canEdit={perms.canEditLanding}
                onDisplayNameChange={setDisplayName}
                onHeadlineChange={setHeadline}
                onBioChange={setLandingBio}
                onWhatsappChange={setWhatsapp}
                onInstagramChange={setInstagram}
                onPhotoUrlChange={setPhotoUrl}
                onThemeChange={setTheme}
                lgpdControllerName={lgpdControllerName}
                lgpdControllerCpf={lgpdControllerCpf}
                lgpdControllerEmail={lgpdControllerEmail}
                lgpdRevokeConsentUrl={lgpdRevokeConsentUrl}
                onLgpdControllerNameChange={setLgpdControllerName}
                onLgpdControllerCpfChange={setLgpdControllerCpf}
                onLgpdControllerEmailChange={setLgpdControllerEmail}
                onLgpdRevokeConsentUrlChange={setLgpdRevokeConsentUrl}
              />
            </TabsContent>
          )}

          {tabPerms.canEditGoals && (
            <TabsContent value="metas">
              <GoalsSettingsSection tenantId={tenantId} canEdit={perms.canEditGoals} />
            </TabsContent>
          )}

          {tabPerms.canEditNotifications && (
            <TabsContent value="notificacoes">
              <NotificationsSettingsSection
                tenantId={tenantId}
                canEdit={perms.canEditNotifications}
              />
            </TabsContent>
          )}

          <TabsContent value="plano">
            <PlanSettingsCard
              plan={(activeTenant?.plan ?? "start") as TenantPlan}
              status={(activeTenant?.status ?? "active") as TenantStatus}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleRouteGuard>
  );
}
