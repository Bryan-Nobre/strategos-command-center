import { useState } from "react";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGENDA_EVENT_STATUS_LABELS,
  AGENDA_EVENT_TYPE_LABELS,
} from "@/types/domain";
import type { AgendaEventWithRelations } from "@/services/agenda";
import type { Enums } from "@/types/supabase";

export type AgendaEventFormValues = {
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  neighborhood: string | null;
  city: string | null;
  event_type: Enums<"agenda_event_type">;
  status: Enums<"agenda_event_status">;
  leadership_id: string | null;
  expected_attendance: number | null;
  description: string | null;
};

export function AgendaEventFormDialog({
  title,
  loading,
  defaultDate,
  leaderships,
  initial,
  onSubmit,
}: {
  title: string;
  loading?: boolean;
  defaultDate?: string;
  leaderships: { id: string; name: string }[];
  initial?: AgendaEventWithRelations;
  onSubmit: (values: AgendaEventFormValues) => void;
}) {
  const [formTitle, setFormTitle] = useState(initial?.title ?? "");
  const [eventDate, setEventDate] = useState(initial?.event_date ?? defaultDate ?? "");
  const [eventTime, setEventTime] = useState(initial?.event_time?.slice(0, 5) ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [eventType, setEventType] = useState<Enums<"agenda_event_type">>(
    initial?.event_type ?? "reuniao",
  );
  const [status, setStatus] = useState<Enums<"agenda_event_status">>(
    initial?.status ?? "agendado",
  );
  const [leadershipId, setLeadershipId] = useState(initial?.leadership_id ?? "");
  const [expectedAttendance, setExpectedAttendance] = useState(
    initial?.expected_attendance?.toString() ?? "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Título</Label>
          <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Data</Label>
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Hora</Label>
            <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Local</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Bairro</Label>
            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select
              value={eventType}
              onValueChange={(v) => setEventType(v as Enums<"agenda_event_type">)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AGENDA_EVENT_TYPE_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Enums<"agenda_event_status">)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AGENDA_EVENT_STATUS_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Liderança (opcional)</Label>
            <Select
              value={leadershipId || "none"}
              onValueChange={(v) => setLeadershipId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {leaderships.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Público esperado</Label>
            <Input
              type="number"
              min={0}
              value={expectedAttendance}
              onChange={(e) => setExpectedAttendance(e.target.value)}
            />
          </div>
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
              neighborhood: neighborhood || null,
              city: city || null,
              event_type: eventType,
              status,
              leadership_id: leadershipId || null,
              expected_attendance: expectedAttendance ? Number(expectedAttendance) : null,
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
