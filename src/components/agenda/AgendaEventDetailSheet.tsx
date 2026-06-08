import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Pencil, Plus, Trash2, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgendaEventWithRelations } from "@/services/agenda";
import {
  AGENDA_ATTENDEE_ROLE_LABELS,
  AGENDA_ATTENDEE_STATUS_LABELS,
  AGENDA_EVENT_STATUS_LABELS,
  AGENDA_EVENT_TYPE_LABELS,
} from "@/types/domain";
import type { Enums } from "@/types/supabase";
import {
  useAddAgendaAttendee,
  useRemoveAgendaAttendee,
  useUpdateAgendaAttendee,
} from "@/hooks/use-agenda";

export function AgendaEventDetailSheet({
  event,
  tenantId,
  supporters,
  open,
  onOpenChange,
  canUpdate,
  onEdit,
}: {
  event: AgendaEventWithRelations | null;
  tenantId: string;
  supporters: { id: string; name: string; phone: string | null; neighborhood: string | null }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate: boolean;
  onEdit: () => void;
}) {
  const [pickerQuery, setPickerQuery] = useState("");
  const addAttendee = useAddAgendaAttendee(tenantId);
  const updateAttendee = useUpdateAgendaAttendee(tenantId);
  const removeAttendee = useRemoveAgendaAttendee(tenantId);

  const existingIds = useMemo(
    () => new Set((event?.agenda_event_attendees ?? []).map((a) => a.supporter_id)),
    [event?.agenda_event_attendees],
  );

  const pickerOptions = useMemo(() => {
    const q = pickerQuery.toLowerCase();
    return supporters
      .filter((s) => !existingIds.has(s.id))
      .filter(
        (s) =>
          !q ||
          [s.name, s.phone, s.neighborhood].some((f) => f?.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [supporters, existingIds, pickerQuery]);

  if (!event) return null;

  const attendees = event.agenda_event_attendees ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="pr-8 text-left leading-snug">{event.title}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {AGENDA_EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
              </Badge>
              <Badge variant="secondary">
                {AGENDA_EVENT_STATUS_LABELS[event.status] ?? event.status}
              </Badge>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Quando</p>
            <p>
              {format(parseIsoLocal(event.event_date), "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}
              {event.event_time && ` · ${event.event_time.slice(0, 5)}`}
            </p>
          </div>

          {(event.location || event.neighborhood || event.city) && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                {[event.location, event.neighborhood, event.city].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}

          {event.leaderships && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Liderança</p>
              <p>{event.leaderships.name}</p>
            </div>
          )}

          {event.expected_attendance != null && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Público esperado</p>
              <p>{event.expected_attendance} pessoas</p>
            </div>
          )}

          {event.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Descrição</p>
              <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}

          <div className="rounded-lg border border-border/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Apoiadores ({attendees.length})</p>
            </div>

            {canUpdate && (
              <div className="mb-3 space-y-2">
                <Label className="text-xs">Adicionar apoiador</Label>
                <Input
                  placeholder="Buscar por nome, telefone..."
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  className="h-8 text-xs"
                />
                {pickerQuery.trim() && pickerOptions.length > 0 && (
                  <ul className="max-h-36 overflow-y-auto rounded-md border border-border/60">
                    {pickerOptions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-2 py-2 text-left text-xs hover:bg-muted/60"
                          disabled={addAttendee.isPending}
                          onClick={() => {
                            addAttendee.mutate(
                              { event_id: event.id, supporter_id: s.id },
                              { onSuccess: () => setPickerQuery("") },
                            );
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                          {s.neighborhood && (
                            <span className="truncate text-muted-foreground">{s.neighborhood}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {attendees.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum apoiador vinculado. Adicione quem vai acompanhar o evento.
              </p>
            ) : (
              <ul className="space-y-2">
                {attendees.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-2 rounded-md border border-border/50 bg-muted/20 p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium text-xs">
                          {a.supporters?.name ?? "Apoiador"}
                        </span>
                      </div>
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-destructive"
                          disabled={removeAttendee.isPending}
                          onClick={() => removeAttendee.mutate(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {canUpdate ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={a.status}
                          onValueChange={(v) =>
                            updateAttendee.mutate({
                              id: a.id,
                              status: v as Enums<"agenda_attendee_status">,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(AGENDA_ATTENDEE_STATUS_LABELS).map(([k, l]) => (
                              <SelectItem key={k} value={k} className="text-xs">
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={a.role}
                          onValueChange={(v) =>
                            updateAttendee.mutate({
                              id: a.id,
                              role: v as Enums<"agenda_attendee_role">,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(AGENDA_ATTENDEE_ROLE_LABELS).map(([k, l]) => (
                              <SelectItem key={k} value={k} className="text-xs">
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        {AGENDA_ATTENDEE_STATUS_LABELS[a.status]} ·{" "}
                        {AGENDA_ATTENDEE_ROLE_LABELS[a.role]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {canUpdate && (
            <Button variant="outline" className="w-full" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar evento
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function parseIsoLocal(iso: string) {
  return new Date(`${iso}T12:00:00`);
}
