import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MapPin, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/hooks/use-tenant";
import { useDemands, useCreateDemand, useUpdateDemand } from "@/hooks/use-demands";
import { LoadingState } from "@/components/common/LoadingState";
import { DEMAND_CATEGORY_LABELS } from "@/types/domain";
import type { Enums } from "@/types/supabase";

export const Route = createFileRoute("/_app/demandas")({
  component: DemandasPage,
});

const columns = [
  { key: "aberto" as const, dbStatus: "aberto" as Enums<"demand_status">, title: "Aberto", icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  { key: "andamento" as const, dbStatus: "em_andamento" as Enums<"demand_status">, title: "Em andamento", icon: Clock, color: "text-warning-foreground", bg: "bg-warning/15" },
  { key: "resolvido" as const, dbStatus: "resolvido" as Enums<"demand_status">, title: "Resolvido", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
];

const prioVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  alta: "destructive", media: "secondary", baixa: "outline",
};

function DemandasPage() {
  const { tenantId } = useTenant();
  const { data: demands, isLoading } = useDemands(tenantId);
  const createMutation = useCreateDemand(tenantId);
  const updateMutation = useUpdateDemand(tenantId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Enums<"demand_category">>("infraestrutura");
  const [neighborhood, setNeighborhood] = useState("");

  if (isLoading) return <LoadingState />;

  const grouped = {
    aberto: (demands ?? []).filter((d) => d.status === "aberto"),
    andamento: (demands ?? []).filter((d) => d.status === "em_andamento"),
    resolvido: (demands ?? []).filter((d) => d.status === "resolvido"),
  };

  function moveDemand(id: string, status: Enums<"demand_status">) {
    updateMutation.mutate({ id, status });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Demandas da população"
        description="Kanban de solicitações por status."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Nova demanda</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova demanda</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Enums<"demand_category">)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEMAND_CATEGORY_LABELS).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Bairro</Label><Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  createMutation.mutate({ title, category, neighborhood: neighborhood || null, status: "aberto", priority: "media" });
                  setOpen(false);
                  setTitle("");
                }}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {columns.map((col) => {
          const items = grouped[col.key];
          return (
            <div key={col.key} className="flex flex-col rounded-xl border border-border bg-muted/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md ${col.bg} ${col.color}`}>
                    <col.icon className="h-4 w-4" />
                  </span>
                  <h3 className="font-semibold">{col.title}</h3>
                </div>
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="space-y-3">
                {items.map((d) => (
                  <Card key={d.id} className="shadow-sm">
                    <CardContent className="space-y-2 p-4">
                      <h4 className="text-sm font-medium">{d.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{DEMAND_CATEGORY_LABELS[d.category] ?? d.category}</span>
                        {d.neighborhood && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.neighborhood}</span>}
                      </div>
                      <Badge variant={prioVariant[d.priority]}>{d.priority}</Badge>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {columns.filter((c) => c.dbStatus !== d.status).map((c) => (
                          <Button key={c.key} variant="ghost" size="sm" className="h-7 text-xs" onClick={() => moveDemand(d.id, c.dbStatus)}>
                            → {c.title}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
