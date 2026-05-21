import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Palette, Bell, UsersRound, Shield, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/hooks/use-tenant";
import { useRouteContext } from "@tanstack/react-router";
import {
  listTeamMembers, createInvitation, listInvitations,
  updateProfile, getUserPreferences, upsertUserPreferences,
} from "@/services/team";
import { getLandingPage, updateLandingPage } from "@/services/landing";
import { LoadingState } from "@/components/common/LoadingState";
import { toast } from "sonner";
import type { Enums } from "@/types/supabase";

export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const { tenantId, activeTenant } = useTenant();
  const { profile } = useRouteContext({ from: "/_app" });
  const qc = useQueryClient();

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["team", tenantId],
    queryFn: () => listTeamMembers(tenantId),
    enabled: !!tenantId,
  });

  const { data: invitations } = useQuery({
    queryKey: ["invitations", tenantId],
    queryFn: () => listInvitations(tenantId),
    enabled: !!tenantId,
  });

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

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [headline, setHeadline] = useState("");
  const [landingBio, setLandingBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Enums<"tenant_role">>("viewer");

  useEffect(() => {
    if (landing) {
      setHeadline(landing.headline ?? "");
      setLandingBio(landing.bio ?? "");
      setWhatsapp(landing.whatsapp ?? "");
    }
  }, [landing]);

  const saveProfile = useMutation({
    mutationFn: () => updateProfile({ full_name: fullName, phone, bio }),
    onSuccess: () => toast.success("Perfil salvo"),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveLanding = useMutation({
    mutationFn: () => updateLandingPage(tenantId, { headline, bio: landingBio, whatsapp }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["landing", tenantId] }); toast.success("Landing atualizada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const inviteMutation = useMutation({
    mutationFn: () => createInvitation(tenantId, inviteEmail, inviteRole),
    onSuccess: (data) => {
      toast.success(`Convite criado. Link: /invite/${data.token}`);
      qc.invalidateQueries({ queryKey: ["invitations", tenantId] });
      setInviteEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const initials = (profile?.full_name ?? "U").split(" ").map((n) => n[0]).slice(0, 2).join("");

  if (teamLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Perfil, equipe, landing e preferências." />

      <Tabs defaultValue="perfil">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-5">
          <TabsTrigger value="perfil"><User className="mr-2 h-4 w-4" />Perfil</TabsTrigger>
          <TabsTrigger value="landing"><ExternalLink className="mr-2 h-4 w-4" />Landing</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell className="mr-2 h-4 w-4" />Notificações</TabsTrigger>
          <TabsTrigger value="equipe"><UsersRound className="mr-2 h-4 w-4" />Equipe</TabsTrigger>
          <TabsTrigger value="plano"><Shield className="mr-2 h-4 w-4" />Plano</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback></Avatar>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2"><Label>Nome</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              </div>
              <div className="grid gap-2"><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} /></div>
              <Button onClick={() => saveProfile.mutate()}>Salvar alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Landing pública</CardTitle>
              <CardDescription>
                <Link to="/p/$slug" params={{ slug: landing?.slug ?? activeTenant?.slug ?? "" }} className="text-primary hover:underline" target="_blank">
                  /p/{landing?.slug ?? activeTenant?.slug}
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Slogan</Label><Input value={headline} onChange={(e) => setHeadline(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Bio pública</Label><Textarea value={landingBio} onChange={(e) => setLandingBio(e.target.value)} rows={4} /></div>
              <div className="grid gap-2"><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5511999990000" /></div>
              <Button onClick={() => saveLanding.mutate()}>Salvar landing</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {["demands", "polls", "agenda", "weekly_email"].map((key) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                  <Label className="capitalize">{key.replace("_", " ")}</Label>
                  <Switch
                    defaultChecked={(prefs?.notifications as Record<string, boolean>)?.[key] ?? true}
                    onCheckedChange={(checked) => {
                      const n = { ...(prefs?.notifications as Record<string, boolean>), [key]: checked };
                      upsertUserPreferences(tenantId, { notifications: n });
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Equipe</CardTitle>
              <div className="flex gap-2">
                <Input placeholder="e-mail" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-48" />
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Enums<"tenant_role">)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coordinator">Coordenador</SelectItem>
                    <SelectItem value="advisor">Assessor</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => inviteMutation.mutate()}>Convidar</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(team ?? []).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">{(m.profiles as { full_name?: string })?.full_name ?? "Membro"}</div>
                    <div className="text-xs text-muted-foreground">{m.role}</div>
                  </div>
                  <Badge>{m.role}</Badge>
                </div>
              ))}
              {(invitations ?? []).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <span>{inv.email} (pendente)</span>
                  <Link to="/invite/$token" params={{ token: inv.token }} className="text-primary text-xs">Link convite</Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plano" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader><CardTitle>Plano atual</CardTitle><CardDescription>Gerenciado pela plataforma SaaS.</CardDescription></CardHeader>
            <CardContent>
              <Badge className="text-base px-4 py-2">{activeTenant?.plan ?? "trial"}</Badge>
              <p className="mt-2 text-sm text-muted-foreground">Status: {activeTenant?.status}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
