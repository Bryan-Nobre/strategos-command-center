-- Agenda: status do evento, território, liderança e apoiadores presentes

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_event_status') THEN
    CREATE TYPE public.agenda_event_status AS ENUM ('agendado', 'confirmado', 'realizado', 'cancelado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_attendee_role') THEN
    CREATE TYPE public.agenda_attendee_role AS ENUM ('acompanhante', 'convidado', 'lideranca');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_attendee_status') THEN
    CREATE TYPE public.agenda_attendee_status AS ENUM ('convidado', 'confirmado', 'compareceu', 'nao_compareceu');
  END IF;
END $$;

ALTER TABLE public.agenda_events
  ADD COLUMN IF NOT EXISTS status public.agenda_event_status NOT NULL DEFAULT 'agendado',
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS leadership_id UUID REFERENCES public.leaderships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expected_attendance INT;

CREATE INDEX IF NOT EXISTS idx_agenda_events_tenant_status ON public.agenda_events(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_agenda_events_leadership ON public.agenda_events(leadership_id);

CREATE TABLE IF NOT EXISTS public.agenda_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.agenda_events(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES public.supporters(id) ON DELETE CASCADE,
  role public.agenda_attendee_role NOT NULL DEFAULT 'acompanhante',
  status public.agenda_attendee_status NOT NULL DEFAULT 'convidado',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, supporter_id)
);

CREATE INDEX IF NOT EXISTS idx_agenda_attendees_event ON public.agenda_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_agenda_attendees_tenant ON public.agenda_event_attendees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agenda_attendees_supporter ON public.agenda_event_attendees(supporter_id);

CREATE TRIGGER agenda_event_attendees_updated_at
  BEFORE UPDATE ON public.agenda_event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agenda_event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY agenda_attendees_select ON public.agenda_event_attendees FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY agenda_attendees_write ON public.agenda_event_attendees FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'agenda'))
  WITH CHECK (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'agenda'));

COMMENT ON TABLE public.agenda_event_attendees IS 'Apoiadores que acompanham ou participam de eventos da agenda.';
