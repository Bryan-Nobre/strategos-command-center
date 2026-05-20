import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Filter, Download, Users, UserCheck, UserX, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { eleitoresMock } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/eleitores")({
  component: EleitoresPage,
});

const apoioVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Forte: "default", Médio: "secondary", Indeciso: "outline", Fraco: "destructive",
};

function EleitoresPage() {
  const [query, setQuery] = useState("");
  const filtered = eleitoresMock.filter((e) =>
    [e.nome, e.bairro, e.cidade].some((f) => f.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Eleitores"
        description="Gerencie sua base de eleitores e apoiadores cadastrados."
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Exportar</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" />Novo eleitor</Button>
              </DialogTrigger>
              <NovoEleitorModal />
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total cadastrados" value="4.892" icon={Users} tone="primary" />
        <MetricCard label="Apoio forte" value="2.140" delta={9.1} icon={UserCheck} tone="success" />
        <MetricCard label="Indecisos" value="864" delta={-2.4} icon={UserX} tone="warning" />
        <MetricCard label="Novos este mês" value="312" delta={18.7} icon={UserPlus} tone="accent" />
      </div>

      <Card className="shadow-elegant">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, bairro ou cidade..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtros</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Zona / Seção</TableHead>
                  <TableHead>Apoio</TableHead>
                  <TableHead className="text-right">Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{e.telefone}</TableCell>
                    <TableCell>{e.bairro}<div className="text-xs text-muted-foreground">{e.cidade}</div></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{e.zona} / {e.secao}</TableCell>
                    <TableCell><Badge variant={apoioVariant[e.apoio]}>{e.apoio}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate text-right text-sm text-muted-foreground">{e.obs}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
            <span>Mostrando {filtered.length} de {eleitoresMock.length} eleitores</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button variant="outline" size="sm">1</Button>
              <Button variant="ghost" size="sm">2</Button>
              <Button variant="ghost" size="sm">3</Button>
              <Button variant="outline" size="sm">Próximo</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NovoEleitorModal() {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Cadastrar novo eleitor</DialogTitle>
        <DialogDescription>Preencha os dados abaixo para adicionar à sua base.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2"><Label>Nome completo</Label><Input placeholder="João da Silva" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2"><Label>Telefone</Label><Input placeholder="(11) 99999-0000" /></div>
          <div className="grid gap-2"><Label>Cidade</Label><Input placeholder="São Paulo" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2"><Label>Bairro</Label><Input /></div>
          <div className="grid gap-2"><Label>Zona</Label><Input /></div>
          <div className="grid gap-2"><Label>Seção</Label><Input /></div>
        </div>
        <div className="grid gap-2">
          <Label>Grau de apoio</Label>
          <Select><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="forte">Forte</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="indeciso">Indeciso</SelectItem>
              <SelectItem value="fraco">Fraco</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2"><Label>Observações</Label><Textarea rows={3} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline">Cancelar</Button>
        <Button>Salvar eleitor</Button>
      </DialogFooter>
    </DialogContent>
  );
}
