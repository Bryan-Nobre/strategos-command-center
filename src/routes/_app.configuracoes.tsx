import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ExternalLink,
  Monitor,
  Moon,
  Plus,
  Shield,
  Sun,
  Target,
  Trash2,
  User,
} from "lucide-react";
import { useTheme } from "@/contexts/theme-provider";
import type { Theme } from "@/lib/theme";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useManualGoalsConfig, useSaveManualGoalsConfig } from "@/hooks/use-dashboard";
import { useTenant } from "@/hooks/use-tenant";
import { useCrudPermissions } from "@/hooks/use-crud-permissions";
import { ModuleRouteGuard } from "@/components/auth/PermissionGate";
import { getLandingPage, updateLandingPage } from "@/services/landing";
import type { ManualGoalConfig, ManualGoalMetric } from "@/services/dashboard";
import { queryKeys } from "@/lib/query-keys";
import { getUserPreferences, updateProfile, upsertUserPreferences } from "@/services/team";
import { NOTIFICATION_PREF_GROUPS } from "@/lib/notification-pref-meta";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  notificationPreferencesToJson,
  parseNotificationPreferences,
  type NotificationPrefCategory,
  type NotificationPreferences,
} from "@/types/notification-preferences";
export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const { tenantId, activeTenant } = useTenant();
  const perms = useCrudPermissions("settings");
  const { profile } = useRouteContext({ from: "/_app" });
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();

  const { data: landing } = useQuery({
    queryKey: ["landing", tenantId],
    queryFn: () => getLandingPage(tenantId),
    enabled: !!tenantId,
  });

  const { data: prefs } = useQuery({
    queryKey: ["prefs", tenantId],
    queryFn: () => getUserPreferences(tenantId),
    enabled: !!tenantId,
  });

  const { data: goalsConfig } = useManualGoalsConfig(tenantId);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [headline, setHeadline] = useState("");
  const [landingBio, setLandingBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [manualGoals, setManualGoals] = useState<ManualGoalConfig[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );

  useEffect(() => {
    if (landing) {
      setHeadline(landing.headline ?? "");
      setLandingBio(landing.bio ?? "");
      setWhatsapp(landing.whatsapp ?? "");
    }
  }, [landing]);

  useEffect(() => {
    if (prefs?.notifications) {
      setNotificationPrefs(parseNotificationPreferences(prefs.notifications));
    }
  }, [prefs?.notifications]);

  useEffect(() => {
    if (!goalsConfig) return;
    setManualGoals(goalsConfig);
  }, [goalsConfig]);

  const saveProfile = useMutation({
    mutationFn: () => updateProfile({ full_name: fullName, phone, bio }),
    onSuccess: () => toast.success("Perfil salvo"),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveLanding = useMutation({
    mutationFn: () => updateLandingPage(tenantId, { headline, bio: landingBio, whatsapp }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing", tenantId] });
      toast.success("Landing atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveManualGoals = useSaveManualGoalsConfig(tenantId);

  function addGoal() {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 6);
    setManualGoals((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Meta ${prev.length + 1}`,
        metric: "new_supporters",
        startDate: today.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        target: 10,
      },
    ]);
  }

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <ModuleRouteGuard module="settings">
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Centralize perfil, metas e operação da campanha."
      />

      <Card className="shadow-elegant">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campanha ativa</CardTitle>
          <CardDescription>{activeTenant?.name ?? "Sem campanha selecionada"}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{activeTenant?.plan ?? "trial"}</Badge>
          <Badge variant="outline">Status: {activeTenant?.status ?? "—"}</Badge>
          <Badge variant="outline">Slug: {activeTenant?.slug ?? "—"}</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-lg bg-muted p-2 md:grid-cols-3 xl:grid-cols-5">
          {perms.canEditProfile && (
          <TabsTrigger value="perfil">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          )}
          {perms.canEditLanding && (
          <TabsTrigger value="landing">
            <ExternalLink className="mr-2 h-4 w-4" />
            Landing
          </TabsTrigger>
          )}
          {perms.canEditGoals && (
          <TabsTrigger value="metas">
            <Target className="mr-2 h-4 w-4" />
            Metas
          </TabsTrigger>
          )}
          {perms.canEditNotifications && (
          <TabsTrigger value="notificacoes">
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </TabsTrigger>
          )}
          <TabsTrigger value="plano">
            <Shield className="mr-2 h-4 w-4" />
            Plano
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Perfil do usuário</CardTitle>
              <CardDescription>Dados pessoais usados na operação da campanha.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 rounded-lg border bg-muted/40 p-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.full_name ?? "Usuário"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.id}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending || !perms.canEditProfile}>
                  {saveProfile.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Escolha entre modo claro, escuro ou preferência do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:max-w-xs">
                <Label>Tema da interface</Label>
                <Select
                  value={theme}
                  onValueChange={(value) => {
                    const next = value as Theme;
                    setTheme(next);
                    upsertUserPreferences(tenantId, { theme: next }).catch(() => {
                      toast.error("Não foi possível salvar a preferência de tema.");
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <span className="flex items-center gap-2">
                        <Sun className="h-4 w-4" /> Claro
                      </span>
                    </SelectItem>
                    <SelectItem value="dark">
                      <span className="flex items-center gap-2">
                        <Moon className="h-4 w-4" /> Escuro
                      </span>
                    </SelectItem>
                    <SelectItem value="system">
                      <span className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" /> Sistema
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Landing pública</CardTitle>
              <CardDescription>
                <Link
                  to="/p/$slug"
                  params={{ slug: landing?.slug ?? activeTenant?.slug ?? "" }}
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  /p/{landing?.slug ?? activeTenant?.slug}
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label>Slogan</Label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Bio pública</Label>
                <Textarea
                  value={landingBio}
                  onChange={(e) => setLandingBio(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label>WhatsApp</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="5511999990000"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveLanding.mutate()} disabled={saveLanding.isPending || !perms.canEditLanding}>
                  {saveLanding.isPending ? "Salvando..." : "Salvar landing"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Metas personalizadas</CardTitle>
              <CardDescription>
                Defina nome, métrica, período e quantidade alvo. O Dashboard mostra o progresso de
                cada meta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-end">
                <Button variant="outline" onClick={addGoal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova meta
                </Button>
              </div>

              <div className="space-y-3">
                {manualGoals.map((goal, idx) => (
                  <div key={goal.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Meta {idx + 1}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() =>
                          setManualGoals((prev) => prev.filter((item) => item.id !== goal.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-12">
                      <div className="grid gap-2 md:col-span-4">
                        <Label>Nome da meta</Label>
                        <Input
                          value={goal.name}
                          onChange={(e) =>
                            setManualGoals((prev) =>
                              prev.map((item) =>
                                item.id === goal.id ? { ...item, name: e.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-3">
                        <Label>Métrica</Label>
                        <Select
                          value={goal.metric}
                          onValueChange={(value) =>
                            setManualGoals((prev) =>
                              prev.map((item) =>
                                item.id === goal.id
                                  ? { ...item, metric: value as ManualGoalMetric }
                                  : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new_supporters">Novos apoiadores</SelectItem>
                            <SelectItem value="resolved_demands">Demandas resolvidas</SelectItem>
                            <SelectItem value="new_strong_supporters">
                              Novos apoiadores fortes
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label>De</Label>
                        <Input
                          type="date"
                          value={goal.startDate}
                          onChange={(e) =>
                            setManualGoals((prev) =>
                              prev.map((item) =>
                                item.id === goal.id ? { ...item, startDate: e.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label>Até</Label>
                        <Input
                          type="date"
                          value={goal.endDate}
                          onChange={(e) =>
                            setManualGoals((prev) =>
                              prev.map((item) =>
                                item.id === goal.id ? { ...item, endDate: e.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-1">
                        <Label>Qtd</Label>
                        <Input
                          type="number"
                          min={0}
                          value={goal.target}
                          onChange={(e) =>
                            setManualGoals((prev) =>
                              prev.map((item) =>
                                item.id === goal.id
                                  ? { ...item, target: Math.max(0, Number(e.target.value) || 0) }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                O progresso aparece no Dashboard com realizado/objetivo dentro do período definido.
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={saveManualGoals.isPending || !perms.canEditGoals}
                  onClick={() => saveManualGoals.mutate(manualGoals)}
                >
                  {saveManualGoals.isPending ? "Salvando..." : "Salvar metas"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Notificações na plataforma</CardTitle>
              <CardDescription>
                Escolha quais alertas receber no sino do topo. Só aparecem módulos que seu cargo
                permite acessar — a validação é feita no servidor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {NOTIFICATION_PREF_GROUPS.map((group) => (
                <div key={group.category} className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">{group.title}</h3>
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  </div>
                  <div className="space-y-2">
                    {group.fields.map((field) => {
                      const cat = group.category as NotificationPrefCategory;
                      const checked =
                        notificationPrefs[cat][field.key as keyof (typeof notificationPrefs)[typeof cat]];
                      return (
                        <div
                          key={field.key}
                          className="flex items-start justify-between gap-4 rounded-lg border p-4"
                        >
                          <div className="space-y-0.5">
                            <Label htmlFor={`notif-${group.category}-${field.key}`}>
                              {field.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                          </div>
                          <Switch
                            id={`notif-${group.category}-${field.key}`}
                            checked={checked}
                            disabled={!perms.canEditNotifications}
                            onCheckedChange={(value) => {
                              const next: NotificationPreferences = {
                                ...notificationPrefs,
                                [cat]: {
                                  ...notificationPrefs[cat],
                                  [field.key]: value,
                                },
                              };
                              setNotificationPrefs(next);
                              void upsertUserPreferences(tenantId, {
                                notifications: notificationPreferencesToJson(next),
                              }).then(() => {
                                void qc.invalidateQueries({ queryKey: queryKeys.prefs(tenantId) });
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plano">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Plano atual</CardTitle>
              <CardDescription>Gerenciado pela plataforma SaaS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge className="px-4 py-2 text-base">{activeTenant?.plan ?? "trial"}</Badge>
              <p className="text-sm text-muted-foreground">Status: {activeTenant?.status}</p>
              <p className="text-sm text-muted-foreground">
                Necessidades de upgrade e billing avançado entram na fase comercial.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ModuleRouteGuard>
  );
}
