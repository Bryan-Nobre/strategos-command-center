import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Filter, Download, Users, UserCheck, UserX, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTenant } from "@/hooks/use-tenant";
import { useSupporters, useCreateSupporter } from "@/hooks/use-supporters";
import { useDashboardMetrics } from "@/hooks/use-dashboard";
import { LoadingState } from "@/components/common/LoadingState";
import { supporterFormSchema, SUPPORT_LEVEL_LABELS, type SupporterFormValues } from "@/types/domain";

export const Route = createFileRoute("/_app/eleitores")({
  component: EleitoresPage,
});

const apoioVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  forte: "default", medio: "secondary", indeciso: "outline", fraco: "destructive",
};

function EleitoresPage() {
  const { tenantId } = useTenant();
  const [query, setQuery] = useState("");
  const { data: supporters, isLoading } = useSupporters(tenantId);
  const { data: metrics } = useDashboardMetrics(tenantId);
  const createMutation = useCreateSupporter(tenantId);

  const filtered = (supporters ?? []).filter((e) =>
    [e.name, e.neighborhood, e.city].some((f) => f?.toLowerCase().includes(query.toLowerCase())));

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Eleitores"
        description="Gerencie sua base de apoiadores cadastrados."
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Exportar</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" />Novo eleitor</Button>
              </DialogTrigger>
              <NovoEleitorModal onSubmit={(v) => createMutation.mutate({
                name: v.name,
                phone: v.phone ?? null,
                neighborhood: v.neighborhood ?? null,
                city: v.city ?? null,
                electoral_zone: v.electoral_zone ?? null,
                electoral_section: v.electoral_section ?? null,
                status: v.status as "interessado",
                support_level: v.support_level as "indeciso",
                notes: v.notes ?? null,
              })} />
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total cadastrados" value={String(metrics?.total_supporters ?? 0)} icon={Users} tone="primary" />
        <MetricCard label="Apoio forte" value={String(metrics?.strong_support ?? 0)} icon={UserCheck} tone="success" />
        <MetricCard label="Indecisos" value={String(metrics?.undecided ?? 0)} icon={UserX} tone="warning" />
        <MetricCard label="Este mês" value="—" icon={UserPlus} tone="accent" />
      </div>

      <Card className="shadow-elegant">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
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
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.phone ?? "—"}</TableCell>
                    <TableCell>{e.neighborhood}<div className="text-xs text-muted-foreground">{e.city}</div></TableCell>
                    <TableCell className="font-mono text-xs">{e.electoral_zone} / {e.electoral_section}</TableCell>
                    <TableCell><Badge variant={apoioVariant[e.support_level]}>{SUPPORT_LEVEL_LABELS[e.support_level]}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-border p-4 text-sm text-muted-foreground">
            Mostrando {filtered.length} apoiadores
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NovoEleitorModal({ onSubmit }: { onSubmit: (v: SupporterFormValues) => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SupporterFormValues>({
    resolver: zodResolver(supporterFormSchema),
    defaultValues: { status: "interessado", support_level: "indeciso" },
  });

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Cadastrar novo eleitor</DialogTitle>
        <DialogDescription>Dados salvos no CRM com isolamento por campanha.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
        <div className="grid gap-2"><Label>Nome</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2"><Label>Telefone</Label><Input {...register("phone")} /></div>
          <div className="grid gap-2"><Label>Cidade</Label><Input {...register("city")} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2"><Label>Bairro</Label><Input {...register("neighborhood")} /></div>
          <div className="grid gap-2"><Label>Zona</Label><Input {...register("electoral_zone")} /></div>
          <div className="grid gap-2"><Label>Seção</Label><Input {...register("electoral_section")} /></div>
        </div>
        <div className="grid gap-2">
          <Label>Grau de apoio</Label>
          <Select value={watch("support_level")} onValueChange={(v) => setValue("support_level", v as SupporterFormValues["support_level"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SUPPORT_LEVEL_LABELS).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2"><Label>Observações</Label><Textarea {...register("notes")} rows={3} /></div>
        <DialogFooter>
          <Button type="submit">Salvar eleitor</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
