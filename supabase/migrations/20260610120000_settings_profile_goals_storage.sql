-- Perfil: bucket de avatares | Metas: RPC com permissão settings.goals | Agenda: lembretes diários

-- ---------------------------------------------------------------------------
-- Storage: avatares (pasta = user id)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
CREATE POLICY avatars_insert_own ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
CREATE POLICY avatars_update_own ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
CREATE POLICY avatars_delete_own ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Metas manuais: persistência sem exigir permissão em polls
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_manual_goals_config(
  p_tenant_id UUID,
  p_goals JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_id UUID;
  v_payload JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR public.tenant_has_permission(v_user_id, p_tenant_id, 'settings', 'goals')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para editar metas';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = p_tenant_id AND tm.user_id = v_user_id
  ) AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Campanha inválida';
  END IF;

  v_payload := jsonb_build_object('goals', COALESCE(p_goals, '[]'::jsonb));

  SELECT ps.id INTO v_existing_id
  FROM public.poll_snapshots ps
  WHERE ps.tenant_id = p_tenant_id
    AND ps.snapshot_type = 'custom'
    AND ps.title = 'manual_goals'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.poll_snapshots
    SET data = v_payload, recorded_at = now()
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.poll_snapshots (tenant_id, snapshot_type, title, data, created_by)
    VALUES (p_tenant_id, 'custom', 'manual_goals', v_payload, v_user_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_manual_goals_config(UUID, JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- Lembretes de agenda (hoje / amanhã) — chamar via pg_cron ou manualmente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_agenda_daily_reminders()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INT := 0;
  v_today DATE := (timezone('America/Sao_Paulo', now()))::date;
  v_tomorrow DATE := v_today + 1;
BEGIN
  FOR v_row IN
    SELECT e.tenant_id, e.id, e.title, e.event_date
    FROM public.agenda_events e
    JOIN public.tenants t ON t.id = e.tenant_id
    WHERE t.status = 'active'
      AND e.status NOT IN ('cancelado', 'realizado')
      AND e.event_date IN (v_today, v_tomorrow)
  LOOP
    IF v_row.event_date = v_today THEN
      v_count := v_count + public.notify_tenant_members(
        v_row.tenant_id,
        'agenda.event_today',
        'Evento hoje',
        v_row.title,
        'info',
        'agenda_event',
        v_row.id,
        '/agenda',
        jsonb_build_object('id', v_row.id::text, 'data', v_row.event_date::text),
        NULL,
        'agenda-today:' || v_row.id::text || ':' || v_today::text,
        NULL
      );
    ELSE
      v_count := v_count + public.notify_tenant_members(
        v_row.tenant_id,
        'agenda.event_tomorrow',
        'Evento amanhã',
        v_row.title,
        'info',
        'agenda_event',
        v_row.id,
        '/agenda',
        jsonb_build_object('id', v_row.id::text, 'data', v_row.event_date::text),
        NULL,
        'agenda-tomorrow:' || v_row.id::text || ':' || v_tomorrow::text,
        NULL
      );
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_agenda_daily_reminders() TO authenticated;

COMMENT ON FUNCTION public.notify_agenda_daily_reminders IS
  'Dispara lembretes in-app para eventos hoje/amanhã. Agendar com pg_cron (ex.: 0 7 * * *).';
