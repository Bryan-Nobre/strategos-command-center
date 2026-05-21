import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Calendar as CalIcon, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/hooks/use-tenant";
import { useAgendaEvents, useCreateAgendaEvent } from "@/hooks/use-agenda";
import { LoadingState } from "@/components/common/LoadingState";
import type { Enums } from "@/types/supabase";

export const Route = createFileRoute("/_app/agenda")({
  component: AgendaPage,
});

function AgendaPage() {
  const { tenantId } = useTenant();
  const { data: events, isLoading } = useAgendaEvents(tenantId);
  const createMutation = useCreateAgendaEvent(tenantId);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState<Enums<"agenda_event_type">>("reuniao");

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agenda política"
        description="Reuniões, eventos, caminhadas e visitas."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Novo evento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agendar evento</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Data</Label><Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Hora</Label><Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Local</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={eventType} onValueChange={(v) => setEventType(v as Enums<"agenda_event_type">)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                      <SelectItem value="evento">Evento</SelectItem>
                      <SelectItem value="caminhada">Caminhada</SelectItem>
                      <SelectItem value="visita">Visita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  createMutation.mutate({ title, event_date: eventDate, event_time: eventTime || null, location: location || null, event_type: eventType });
                  setOpen(false);
                }}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-elegant lg:col-span-1">
          <CardContent className="p-4">
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
          </CardContent>
        </Card>
        <div className="space-y-3 lg:col-span-2">
          {(events ?? []).map((ev) => (
            <Card key={ev.id} className="shadow-sm">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{ev.title}</h3>
                  <p className="text-sm text-muted-foreground">{ev.event_date} {ev.event_time && `· ${ev.event_time}`} · {ev.event_type}</p>
                  {ev.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{ev.location}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
          {!(events?.length) && <p className="text-sm text-muted-foreground">Nenhum evento agendado.</p>}
        </div>
      </div>
    </div>
  );
}
