import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Calendar as CalIcon, MapPin, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/hooks/use-tenant";
import {
  useAgendaEvents,
  useCreateAgendaEvent,
  useUpdateAgendaEvent,
  useDeleteAgendaEvent,
} from "@/hooks/use-agenda";
import { LoadingState } from "@/components/common/LoadingState";
import type { Enums } from "@/types/supabase";

export const Route = createFileRoute("/_app/agenda")({
  component: AgendaPage,
});

type EventRow = NonNullable<ReturnType<typeof useAgendaEvents>["data"]>[number];

function AgendaPage() {
  const { tenantId } = useTenant();
  const { data: events, isLoading } = useAgendaEvents(tenantId);
  const createMutation = useCreateAgendaEvent(tenantId);
  const updateMutation = useUpdateAgendaEvent(tenantId);
  const deleteMutation = useDeleteAgendaEvent(tenantId);

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);

  if (isLoading) return <LoadingState />;

  const selectedDateStr = date?.toISOString().slice(0, 10);
  const visibleEvents = selectedDateStr
    ? (events ?? []).filter((ev) => ev.event_date === selectedDateStr)
    : events ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agenda política"
        description="Reuniões, eventos, caminhadas e visitas."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo evento
              </Button>
            </DialogTrigger>
            <EventFormDialog
              title="Agendar evento"
              loading={createMutation.isPending}
              defaultDate={selectedDateStr}
              onSubmit={(values) => {
                createMutation.mutate(values, { onSuccess: () => setCreateOpen(false) });
              }}
            />
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
          {!(events?.length) ? (
            <EmptyState
              icon={CalIcon}
              title="Nenhum evento agendado"
              description="Cadastre reuniões, caminhadas e visitas da campanha."
              actionLabel="Novo evento"
              onAction={() => setCreateOpen(true)}
            />
          ) : !visibleEvents.length ? (
            <EmptyState
              icon={CalIcon}
              title="Nenhum evento nesta data"
              description="Selecione outra data no calendário ou crie um novo evento."
              actionLabel="Novo evento"
              onAction={() => setCreateOpen(true)}
            />
          ) : (
            visibleEvents.map((ev) => (
              <Card key={ev.id} className="shadow-sm">
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{ev.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ev.event_date} {ev.event_time && `· ${ev.event_time}`} · {ev.event_type}
                      </p>
                      {ev.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {ev.location}
                        </p>
                      )}
                      {ev.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{ev.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTarget(ev)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteTarget(ev)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        {editTarget && (
          <EventFormDialog
            title="Editar evento"
            loading={updateMutation.isPending}
            initial={editTarget}
            onSubmit={(values) => {
              updateMutation.mutate({ id: editTarget.id, ...values }, { onSuccess: () => setEditTarget(null) });
            }}
          />
        )}
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir evento"
        description={`Tem certeza que deseja excluir "${deleteTarget?.title}"?`}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }
        }}
      />
    </div>
  );
}

type EventFormValues = {
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  event_type: Enums<"agenda_event_type">;
  description: string | null;
};

function EventFormDialog({
  title,
  loading,
  defaultDate,
  initial,
  onSubmit,
}: {
  title: string;
  loading?: boolean;
  defaultDate?: string;
  initial?: EventRow;
  onSubmit: (values: EventFormValues) => void;
}) {
  const [formTitle, setFormTitle] = useState(initial?.title ?? "");
  const [eventDate, setEventDate] = useState(initial?.event_date ?? defaultDate ?? "");
  const [eventTime, setEventTime] = useState(initial?.event_time ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [eventType, setEventType] = useState<Enums<"agenda_event_type">>(initial?.event_type ?? "reuniao");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Título</Label>
          <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Data</Label>
          <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Hora</Label>
          <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Local</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <Select value={eventType} onValueChange={(v) => setEventType(v as Enums<"agenda_event_type">)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reuniao">Reunião</SelectItem>
              <SelectItem value="evento">Evento</SelectItem>
              <SelectItem value="caminhada">Caminhada</SelectItem>
              <SelectItem value="visita">Visita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!formTitle.trim() || !eventDate || loading}
          onClick={() =>
            onSubmit({
              title: formTitle.trim(),
              event_date: eventDate,
              event_time: eventTime || null,
              location: location || null,
              event_type: eventType,
              description: description || null,
            })
          }
        >
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
