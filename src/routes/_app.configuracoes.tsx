import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ExternalLink, Shield, Target, User } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/use-tenant";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { getLandingPage } from "@/services/landing";
import {
  parseConfiguracoesSearch,
  resolveDefaultConfigTab,
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

export const Route = createFileRoute("/_app/configuracoes")({
  validateSearch: parseConfiguracoesSearch,
  component: ConfigPage,
});

function ConfigPage() {
  const { tenantId, activeTenant } = useTenant();
  const perms = useCrudPermissions("settings");
  const { profile } = useRouteContext({ from: "/_app" });
  const urlSearch = Route.useSearch();
  const navigate = Route.useNavigate();

  const defaultTab = useMemo(
    () => resolveDefaultConfigTab(perms),
    [perms.canEditProfile, perms.canEditLanding, perms.canEditGoals, perms.canEditNotifications],
  );

  const activeTab = urlSearch.tab ?? defaultTab;

  const { data: landing } = useQuery({
    queryKey: ["landing", tenantId],
    queryFn: () => getLandingPage(tenantId),
    enabled: !!tenantId,
  });

  const [headline, setHeadline] = useState("");
  const [landingBio, setLandingBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (landing) {
      setHeadline(landing.headline ?? "");
      setLandingBio(landing.bio ?? "");
      setWhatsapp(landing.whatsapp ?? "");
    }
  }, [landing]);

  function setTab(tab: ConfigTab) {
    void navigate({ search: serializeConfiguracoesSearch({ tab }) });
  }

  const slug = landing?.slug ?? activeTenant?.slug ?? "";

  return (
    <ModuleRouteGuard module="settings">
      <div className="settings-page mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Configurações"
          description="Perfil, metas da campanha e preferências de alertas."
        />

        <SettingsCampanhaCard
          tenantName={activeTenant?.name ?? "Sem campanha"}
          plan={activeTenant?.plan ?? "trial"}
          status={activeTenant?.status ?? "—"}
          slug={slug}
        />

        <Tabs value={activeTab} onValueChange={(v) => setTab(v as ConfigTab)} className="space-y-4">
          <TabsList className="settings-tabs-list h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1.5">
            {perms.canEditProfile && (
              <TabsTrigger value="perfil" className="settings-tab-trigger gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
            )}
            {perms.canEditLanding && (
              <TabsTrigger value="landing" className="settings-tab-trigger gap-2">
                <ExternalLink className="h-4 w-4" />
                Landing
              </TabsTrigger>
            )}
            {perms.canEditGoals && (
              <TabsTrigger value="metas" className="settings-tab-trigger gap-2">
                <Target className="h-4 w-4" />
                Metas
              </TabsTrigger>
            )}
            {perms.canEditNotifications && (
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

          {perms.canEditProfile && (
            <TabsContent value="perfil">
              <ProfileSettingsCard profile={profile} canEdit={perms.canEditProfile} />
            </TabsContent>
          )}

          {perms.canEditLanding && (
            <TabsContent value="landing">
              <LandingSettingsCard
                tenantId={tenantId}
                slug={slug}
                headline={headline}
                landingBio={landingBio}
                whatsapp={whatsapp}
                canEdit={perms.canEditLanding}
                onHeadlineChange={setHeadline}
                onBioChange={setLandingBio}
                onWhatsappChange={setWhatsapp}
              />
            </TabsContent>
          )}

          {perms.canEditGoals && (
            <TabsContent value="metas">
              <GoalsSettingsSection tenantId={tenantId} canEdit={perms.canEditGoals} />
            </TabsContent>
          )}

          {perms.canEditNotifications && (
            <TabsContent value="notificacoes">
              <NotificationsSettingsSection
                tenantId={tenantId}
                canEdit={perms.canEditNotifications}
              />
            </TabsContent>
          )}

          <TabsContent value="plano">
            <PlanSettingsCard
              plan={activeTenant?.plan ?? "trial"}
              status={activeTenant?.status ?? "—"}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleRouteGuard>
  );
}
