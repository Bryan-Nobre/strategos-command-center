import { createFileRoute } from "@tanstack/react-router";
import { Plus, MapPin, Clock, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { agendaMock } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/agenda")({
  component: AgendaPage,
});

const tipoVariant: Record<string, "default" | "secondary" | "outline"> = {
  Reunião: "default", Caminhada: "secondary", Visita: "outline", Evento: "default",
};

function AgendaPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agenda"
        description="Programe reuniões, visitas, caminhadas e compromissos do mandato."
        actions={<Button size="sm"><Plus className="mr-2 h-4 w-4" />Novo evento</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="shadow-elegant lg:col-span-1">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" />Calendário</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
          </CardContent>
        </Card>

        <Card className="shadow-elegant lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Próximos compromissos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {agendaMock.map((e) => (
              <div key={e.id} className="flex gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40">
                <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 p-2 text-primary">
                  <div className="text-[10px] font-medium uppercase">{new Date(e.data).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</div>
                  <div className="text-xl font-bold leading-none">{new Date(e.data).getDate()}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{e.titulo}</h4>
                    <Badge variant={tipoVariant[e.tipo]}>{e.tipo}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.hora}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.local}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
