import { createFileRoute } from "@tanstack/react-router";
import { User, Palette, Bell, UsersRound, Shield } from "lucide-react";
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

export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfigPage,
});

const equipe = [
  { nome: "Ricardo Campos", cargo: "Coordenador", email: "ricardo@strategos.com", role: "Admin" },
  { nome: "Marina Souza", cargo: "Analista", email: "marina@strategos.com", role: "Editor" },
  { nome: "Lucas Ferreira", cargo: "Voluntário", email: "lucas@strategos.com", role: "Visualizador" },
];

function ConfigPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Gerencie seu perfil, equipe e preferências do sistema." />

      <Tabs defaultValue="perfil">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-5">
          <TabsTrigger value="perfil"><User className="mr-2 h-4 w-4" />Perfil</TabsTrigger>
          <TabsTrigger value="aparencia"><Palette className="mr-2 h-4 w-4" />Aparência</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell className="mr-2 h-4 w-4" />Notificações</TabsTrigger>
          <TabsTrigger value="equipe"><UsersRound className="mr-2 h-4 w-4" />Equipe</TabsTrigger>
          <TabsTrigger value="permissoes"><Shield className="mr-2 h-4 w-4" />Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader><CardTitle>Perfil público</CardTitle><CardDescription>Como você aparece no sistema.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20"><AvatarFallback className="bg-primary text-xl text-primary-foreground">RC</AvatarFallback></Avatar>
                <div className="space-y-2"><Button variant="outline" size="sm">Trocar foto</Button><p className="text-xs text-muted-foreground">JPG ou PNG. Máx 2MB.</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2"><Label>Nome completo</Label><Input defaultValue="Ricardo Campos" /></div>
                <div className="grid gap-2"><Label>Cargo</Label><Input defaultValue="Coordenador de Campanha" /></div>
                <div className="grid gap-2"><Label>E-mail</Label><Input defaultValue="ricardo@strategos.com" /></div>
                <div className="grid gap-2"><Label>Telefone</Label><Input defaultValue="(11) 99999-0000" /></div>
              </div>
              <div className="grid gap-2"><Label>Bio</Label><Textarea rows={3} defaultValue="Coordenador da campanha, atuando há 8 anos em estratégia política." /></div>
              <div className="flex justify-end"><Button>Salvar alterações</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader><CardTitle>Aparência</CardTitle><CardDescription>Personalize o visual do sistema.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {["Tema claro", "Tema escuro", "Automático"].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div><div className="font-medium">{t}</div><div className="text-xs text-muted-foreground">Aplicar tema {t.toLowerCase()} à interface.</div></div>
                  <Switch defaultChecked={t === "Tema claro"} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader><CardTitle>Notificações</CardTitle><CardDescription>Escolha o que deseja receber.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {["Novas demandas registradas", "Atualizações de pesquisas", "Eventos da agenda", "Resumo semanal por e-mail"].map((n) => (
                <div key={n} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <Label className="font-medium">{n}</Label>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Equipe</CardTitle><CardDescription>Membros com acesso ao sistema.</CardDescription></div>
              <Button size="sm">Convidar membro</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipe.map((m) => (
                <div key={m.email} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback className="bg-secondary text-secondary-foreground">{m.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                    <div><div className="font-medium">{m.nome}</div><div className="text-xs text-muted-foreground">{m.cargo} · {m.email}</div></div>
                  </div>
                  <Badge variant={m.role === "Admin" ? "default" : "secondary"}>{m.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissoes" className="mt-6">
          <Card className="shadow-elegant">
            <CardHeader><CardTitle>Permissões</CardTitle><CardDescription>Defina o que cada nível pode acessar.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {["Gerenciar eleitores", "Editar demandas", "Acessar relatórios financeiros", "Convidar novos membros", "Exportar dados"].map((p) => (
                <div key={p} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <Label className="font-medium">{p}</Label>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
