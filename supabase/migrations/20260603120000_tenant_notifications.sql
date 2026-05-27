-- Notificações in-app por usuário/campanha.
-- Segurança: criação só via funções SECURITY DEFINER; entrega filtrada por permissão de módulo + preferências.

CREATE TABLE IF NOT EXISTS public.tenant_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  action_route TEXT,
  action_search JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dedupe_key TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_notifications_inbox_idx
  ON public.tenant_notifications (tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS tenant_notifications_unread_idx
  ON public.tenant_notifications (tenant_id, user_id)
  WHERE read_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tenant_notifications_dedupe_active_idx
  ON public.tenant_notifications (tenant_id, user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL AND read_at IS NULL;

ALTER TABLE public.tenant_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_notifications_select ON public.tenant_notifications;
CREATE POLICY tenant_notifications_select ON public.tenant_notifications
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      tenant_id IN (SELECT public.user_tenant_ids())
      OR public.is_super_admin()
    )
  );

DROP POLICY IF EXISTS tenant_notifications_update ON public.tenant_notifications;
CREATE POLICY tenant_notifications_update ON public.tenant_notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Permissões por usuário explícito (fan-out de notificações)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tenant_user_role_row(p_user_id UUID, p_tenant_id UUID)
RETURNS public.tenant_roles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tr.*
  FROM public.tenant_members tm
  JOIN public.tenant_roles tr ON tr.id = tm.custom_role_id
  WHERE tm.user_id = p_user_id
    AND tm.tenant_id = p_tenant_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.tenant_user_is_full_access(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.user_id = p_user_id
      AND tm.tenant_id = p_tenant_id
      AND tm.role = 'owner'
  )
  OR COALESCE(
    (SELECT tr.is_full_access FROM public.tenant_user_role_row(p_user_id, p_tenant_id) tr),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.tenant_user_permissions(p_user_id UUID, p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.tenant_roles%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.user_id = p_user_id AND tm.tenant_id = p_tenant_id
  ) THEN
    RETURN '{}'::jsonb;
  END IF;

  IF public.tenant_user_is_full_access(p_user_id, p_tenant_id) THEN
    RETURN public.build_permissions_template('full')
      || jsonb_build_object('is_full_access', true);
  END IF;

  SELECT * INTO v_row FROM public.tenant_user_role_row(p_user_id, p_tenant_id);
  IF v_row.id IS NULL THEN
    RETURN public.build_permissions_template('viewer');
  END IF;

  RETURN v_row.permissions;
END;
$$;

CREATE OR REPLACE FUNCTION public.tenant_user_has_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_module TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perms JSONB;
  v_value JSONB;
BEGIN
  IF public.tenant_user_is_full_access(p_user_id, p_tenant_id) THEN
    RETURN true;
  END IF;

  v_perms := public.tenant_user_permissions(p_user_id, p_tenant_id);
  v_value := v_perms #> ARRAY[p_module, p_action];

  IF v_value IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_value = 'true'::jsonb;
END;
$$;

-- ---------------------------------------------------------------------------
-- Preferências de notificação (JSON em user_preferences.notifications)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notification_pref_enabled(
  p_user_id UUID,
  p_tenant_id UUID,
  p_category TEXT,
  p_key TEXT,
  p_default BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs JSONB;
  v_val JSONB;
BEGIN
  SELECT up.notifications INTO v_prefs
  FROM public.user_preferences up
  WHERE up.user_id = p_user_id AND up.tenant_id = p_tenant_id;

  IF v_prefs IS NULL OR v_prefs = '{}'::jsonb THEN
    RETURN p_default;
  END IF;

  v_val := v_prefs #> ARRAY[p_category, p_key];
  IF v_val IS NULL THEN
  -- Legado: chave plana "demands" / "agenda"
    IF p_category = 'demands' AND (v_prefs ? 'demands') THEN
      RETURN COALESCE((v_prefs->>'demands')::boolean, p_default);
    END IF;
    IF p_category = 'agenda' AND (v_prefs ? 'agenda') THEN
      RETURN COALESCE((v_prefs->>'agenda')::boolean, p_default);
    END IF;
    RETURN p_default;
  END IF;

  RETURN COALESCE((v_val)::boolean, p_default);
END;
$$;

CREATE OR REPLACE FUNCTION public.notification_type_meta(p_type TEXT)
RETURNS TABLE (
  category TEXT,
  permission_module TEXT,
  permission_action TEXT,
  pref_key TEXT,
  pref_default BOOLEAN
)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    t.category,
    t.permission_module,
    t.permission_action,
    t.pref_key,
    t.pref_default
  FROM (
    VALUES
      ('demand.assigned', 'demands', 'demands', 'read', 'assigned_to_me', true),
      ('demand.status_changed', 'demands', 'demands', 'read', 'status_on_mine', true),
      ('demand.high_priority_new', 'demands', 'demands', 'read', 'high_priority', true),
      ('demand.unassigned_digest', 'demands', 'demands', 'read', 'unassigned_digest', true),
      ('demand.new_open', 'demands', 'demands', 'read', 'new_open', false),
      ('supporter.landing_new', 'supporters', 'supporters', 'read', 'landing_new', true),
      ('supporter.import_completed', 'supporters', 'supporters', 'read', 'import_done', true),
      ('team.invite_accepted', 'team', 'team', 'read', 'invite_accepted', true),
      ('team.member_joined', 'team', 'team', 'read', 'member_joined', true),
      ('agenda.event_today', 'agenda', 'agenda', 'read', 'event_today', true),
      ('agenda.event_tomorrow', 'agenda', 'agenda', 'read', 'event_tomorrow', true)
  ) AS t(
    type,
    category,
    permission_module,
    permission_action,
    pref_key,
    pref_default
  )
  WHERE t.type = p_type;
$$;

-- ---------------------------------------------------------------------------
-- Criação de notificação (uma destinatário)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_tenant_notification(
  p_tenant_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_action_route TEXT DEFAULT NULL,
  p_action_search JSONB DEFAULT '{}'::jsonb,
  p_actor_user_id UUID DEFAULT NULL,
  p_dedupe_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta RECORD;
  v_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_tenant_id IS NULL OR p_type IS NULL OR p_title IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_actor_user_id IS NOT NULL AND p_actor_user_id = p_user_id THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = p_tenant_id AND tm.user_id = p_user_id
  ) THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_meta FROM public.notification_type_meta(p_type);
  IF v_meta IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT public.tenant_user_has_permission(
    p_user_id, p_tenant_id, v_meta.permission_module, v_meta.permission_action
  ) THEN
    RETURN NULL;
  END IF;

  IF NOT public.notification_pref_enabled(
    p_user_id, p_tenant_id, v_meta.category, v_meta.pref_key, v_meta.pref_default
  ) THEN
    RETURN NULL;
  END IF;

  IF p_dedupe_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tenant_notifications n
    WHERE n.tenant_id = p_tenant_id
      AND n.user_id = p_user_id
      AND n.dedupe_key = p_dedupe_key
      AND n.read_at IS NULL
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.tenant_notifications (
    tenant_id, user_id, type, category, severity, title, body,
    entity_type, entity_id, action_route, action_search, actor_user_id, dedupe_key
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_type,
    v_meta.category,
    COALESCE(p_severity, 'info'),
    p_title,
    p_body,
    p_entity_type,
    p_entity_id,
    p_action_route,
    COALESCE(p_action_search, '{}'::jsonb),
    p_actor_user_id,
    p_dedupe_key
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_tenant_members(
  p_tenant_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_action_route TEXT DEFAULT NULL,
  p_action_search JSONB DEFAULT '{}'::jsonb,
  p_actor_user_id UUID DEFAULT NULL,
  p_dedupe_key TEXT DEFAULT NULL,
  p_recipient_user_ids UUID[] DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count INT := 0;
BEGIN
  FOR v_user_id IN
    SELECT u.uid
    FROM (
      SELECT unnest(p_recipient_user_ids) AS uid
      WHERE p_recipient_user_ids IS NOT NULL
      UNION
      SELECT tm.user_id AS uid
      FROM public.tenant_members tm
      WHERE p_recipient_user_ids IS NULL
        AND tm.tenant_id = p_tenant_id
    ) u
    WHERE u.uid IS NOT NULL
  LOOP
    IF public.create_tenant_notification(
      p_tenant_id, v_user_id, p_type, p_title, p_body, p_severity,
      p_entity_type, p_entity_id, p_action_route, p_action_search,
      p_actor_user_id, p_dedupe_key
    ) IS NOT NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Triggers: demandas
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_demands_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID;
  v_unassigned INT;
BEGIN
  v_actor := auth.uid();

  IF TG_OP = 'INSERT' THEN
    IF NEW.priority = 'alta' THEN
      PERFORM public.notify_tenant_members(
        NEW.tenant_id,
        'demand.high_priority_new',
        'Nova demanda de alta prioridade',
        NEW.title,
        'critical',
        'demand',
        NEW.id,
        '/demandas',
        jsonb_build_object('id', NEW.id::text, 'busca', NEW.title),
        v_actor,
        NULL,
        NULL
      );
    END IF;

    IF NEW.assigned_to IS NOT NULL THEN
      PERFORM public.create_tenant_notification(
        NEW.tenant_id,
        NEW.assigned_to,
        'demand.assigned',
        'Demanda atribuída a você',
        NEW.title,
        'info',
        'demand',
        NEW.id,
        '/demandas',
        jsonb_build_object('id', NEW.id::text),
        v_actor,
        'demand-assigned:' || NEW.id::text || ':' || NEW.assigned_to::text
      );
    END IF;

    PERFORM public.notify_tenant_members(
      NEW.tenant_id,
      'demand.new_open',
      'Nova demanda registrada',
      NEW.title,
      'info',
      'demand',
      NEW.id,
      '/demandas',
      jsonb_build_object('id', NEW.id::text),
      v_actor,
      NULL,
      NULL
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      PERFORM public.create_tenant_notification(
        NEW.tenant_id,
        NEW.assigned_to,
        'demand.assigned',
        'Demanda atribuída a você',
        NEW.title,
        'info',
        'demand',
        NEW.id,
        '/demandas',
        jsonb_build_object('id', NEW.id::text),
        v_actor,
        'demand-assigned:' || NEW.id::text || ':' || NEW.assigned_to::text
      );
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status
      AND NEW.assigned_to IS NOT NULL
    THEN
      PERFORM public.create_tenant_notification(
        NEW.tenant_id,
        NEW.assigned_to,
        'demand.status_changed',
        'Status da demanda atualizado',
        NEW.title || ' → ' || NEW.status::text,
        'info',
        'demand',
        NEW.id,
        '/demandas',
        jsonb_build_object('id', NEW.id::text),
        v_actor,
        NULL
      );
    END IF;
  END IF;

  SELECT count(*)::int INTO v_unassigned
  FROM public.demands d
  WHERE d.tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
    AND d.status <> 'resolvido'
    AND d.assigned_to IS NULL;

  IF v_unassigned >= 3 THEN
    PERFORM public.notify_tenant_members(
      COALESCE(NEW.tenant_id, OLD.tenant_id),
      'demand.unassigned_digest',
      v_unassigned::text || ' demandas sem responsável',
      'Distribua encarregados para destravar o fluxo.',
      'warning',
      NULL,
      NULL,
      '/demandas',
      jsonb_build_object('semResponsavel', '1'),
      v_actor,
      'demand-unassigned-digest:' || COALESCE(NEW.tenant_id, OLD.tenant_id)::text,
      NULL
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS demands_notify ON public.demands;
CREATE TRIGGER demands_notify
  AFTER INSERT OR UPDATE ON public.demands
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_demands_notify();

-- ---------------------------------------------------------------------------
-- Trigger: apoiador via landing
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_supporters_landing_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source = 'landing' THEN
    PERFORM public.notify_tenant_members(
      NEW.tenant_id,
      'supporter.landing_new',
      'Novo cadastro na landing',
      NEW.name,
      'info',
      'supporter',
      NEW.id,
      '/eleitores',
      jsonb_build_object('id', NEW.id::text, 'busca', NEW.name),
      NULL,
      'supporter-landing:' || NEW.id::text,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supporters_landing_notify ON public.supporters;
CREATE TRIGGER supporters_landing_notify
  AFTER INSERT ON public.supporters
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_supporters_landing_notify();

-- ---------------------------------------------------------------------------
-- RPC: importação concluída (chamada pelo cliente após import CSV)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_supporter_import_completed(
  p_tenant_id UUID,
  p_count INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids())) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN public.create_tenant_notification(
    p_tenant_id,
    auth.uid(),
    'supporter.import_completed',
    'Importação de apoiadores concluída',
    p_count::text || ' registro(s) importado(s).',
    'info',
    NULL,
    NULL,
    '/eleitores',
    '{}'::jsonb,
    auth.uid(),
    'supporter-import:' || auth.uid()::text || ':' || to_char(now(), 'YYYY-MM-DD')
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Convite aceito
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.team_invitations%ROWTYPE;
  v_member_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_inv FROM public.team_invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now()
  LIMIT 1;

  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  INSERT INTO public.tenant_members (tenant_id, user_id, role, custom_role_id)
  VALUES (v_inv.tenant_id, auth.uid(), v_inv.role, v_inv.custom_role_id)
  ON CONFLICT (tenant_id, user_id) DO UPDATE
  SET role = EXCLUDED.role, custom_role_id = EXCLUDED.custom_role_id;

  UPDATE public.team_invitations SET status = 'accepted' WHERE id = v_inv.id;

  INSERT INTO public.user_preferences (user_id, tenant_id)
  VALUES (auth.uid(), v_inv.tenant_id)
  ON CONFLICT (user_id, tenant_id) DO NOTHING;

  SELECT COALESCE(p.full_name, 'Novo membro') INTO v_member_name
  FROM public.profiles p WHERE p.id = auth.uid();

  IF v_inv.invited_by IS NOT NULL THEN
    PERFORM public.create_tenant_notification(
      v_inv.tenant_id,
      v_inv.invited_by,
      'team.invite_accepted',
      'Convite aceito',
      v_member_name || ' entrou na equipe.',
      'info',
      NULL,
      NULL,
      '/equipe',
      '{}'::jsonb,
      auth.uid(),
      'team-invite-accepted:' || v_inv.id::text
    );
  END IF;

  PERFORM public.notify_tenant_members(
    v_inv.tenant_id,
    'team.member_joined',
    'Novo membro na equipe',
    v_member_name,
    'info',
    NULL,
    NULL,
    '/equipe',
    '{}'::jsonb,
    auth.uid(),
    'team-member-joined:' || auth.uid()::text,
    ARRAY(
      SELECT tm.user_id FROM public.tenant_members tm
      WHERE tm.tenant_id = v_inv.tenant_id AND tm.role = 'owner'
    )
  );

  RETURN v_inv.tenant_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Leitura / marcação (inbox)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_my_notifications(
  p_tenant_id UUID,
  p_limit INT DEFAULT 20,
  p_unread_only BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN COALESCE((
    SELECT json_agg(row ORDER BY sort_at DESC)
    FROM (
      SELECT json_build_object(
        'id', n.id,
        'type', n.type,
        'category', n.category,
        'severity', n.severity,
        'title', n.title,
        'body', n.body,
        'entity_type', n.entity_type,
        'entity_id', n.entity_id,
        'action_route', n.action_route,
        'action_search', n.action_search,
        'read_at', n.read_at,
        'created_at', n.created_at
      ) AS row,
      n.created_at AS sort_at
      FROM public.tenant_notifications n
      WHERE n.tenant_id = p_tenant_id
        AND n.user_id = auth.uid()
        AND (NOT p_unread_only OR n.read_at IS NULL)
      ORDER BY n.created_at DESC
      LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50)
    ) sub
  ), '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_tenant_id UUID)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RETURN 0;
  END IF;

  SELECT count(*)::int INTO v_count
  FROM public.tenant_notifications n
  WHERE n.tenant_id = p_tenant_id
    AND n.user_id = auth.uid()
    AND n.read_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  UPDATE public.tenant_notifications
  SET read_at = now()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND read_at IS NULL;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_tenant_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.tenant_notifications
  SET read_at = now()
  WHERE tenant_id = p_tenant_id
    AND user_id = auth.uid()
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON TABLE public.tenant_notifications FROM PUBLIC, anon;
GRANT SELECT, UPDATE ON TABLE public.tenant_notifications TO authenticated;

REVOKE ALL ON FUNCTION public.create_tenant_notification FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.notify_tenant_members FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.notify_supporter_import_completed FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_my_notifications(uuid, int, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_supporter_import_completed(uuid, int) TO authenticated;
