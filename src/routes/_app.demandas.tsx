import { createFileRoute } from "@tanstack/react-router";
import { Plus, MapPin, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demandasMock } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/demandas")({
  component: DemandasPage,
});

const columns = [
  { key: "aberto" as const, title: "Aberto", icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  { key: "andamento" as const, title: "Em andamento", icon: Clock, color: "text-warning-foreground", bg: "bg-warning/15" },
  { key: "resolvido" as const, title: "Resolvido", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
];

const prioVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  Alta: "destructive", Média: "secondary", Baixa: "outline",
};

function DemandasPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Demandas da população"
        description="Organize as solicitações recebidas em iluminação, saúde, educação e infraestrutura."
        actions={<Button size="sm"><Plus className="mr-2 h-4 w-4" />Nova demanda</Button>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {columns.map((col) => {
          const items = demandasMock[col.key];
          return (
            <div key={col.key} className="flex flex-col rounded-xl border border-border bg-muted/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md ${col.bg} ${col.color}`}>
                    <col.icon className="h-4 w-4" />
                  </span>
                  <h3 className="font-semibold">{col.title}</h3>
                </div>
                <Badge variant="outline" className="font-mono">{items.length}</Badge>
              </div>
              <div className="space-y-3">
                {items.map((d) => (
                  <Card key={d.id} className="cursor-grab shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-elegant active:cursor-grabbing">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-snug">{d.titulo}</h4>
                        <Badge variant={prioVariant[d.prioridade]} className="shrink-0 text-[10px]">{d.prioridade}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">{d.categoria}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.bairro}</span>
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
