-- Cargos customizados por campanha + permissões granulares (fonte de verdade no PostgreSQL).
-- O dono da campanha (signup) recebe cargo "Administrador" com is_full_access.

CREATE TABLE IF NOT EXISTS public.tenant_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_full_access BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenant_roles_name_unique UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS tenant_roles_tenant_id_idx ON public.tenant_roles(tenant_id);

ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.tenant_roles(id) ON DELETE SET NULL;

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.tenant_roles(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Templates de permissões
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.build_permissions_template(p_template TEXT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_read_only JSONB := '{
    "dashboard": {"read": true},
    "reports": {"read": true, "export": false},
    "polls": {"read": true, "create": false, "update": false, "delete": false},
    "supporters": {"read": true, "create": false, "update": false, "delete": false, "import": false},
    "leaderships": {"read": true, "create": false, "update": false, "delete": false},
    "demands": {"read": true, "create": false, "update": false, "delete": false},
    "agenda": {"read": true, "create": false, "update": false, "delete": false},
    "team": {"read": true, "invite": false, "manage_roles": false},
    "settings": {"read": true, "profile": true, "landing": false, "goals": false, "notifications": true}
  }'::jsonb;
BEGIN
  IF p_template = 'full' THEN
    RETURN '{
      "dashboard": {"read": true},
      "reports": {"read": true, "export": true},
      "polls": {"read": true, "create": true, "update": true, "delete": true},
      "supporters": {"read": true, "create": true, "update": true, "delete": true, "import": true, "export": true},
      "leaderships": {"read": true, "create": true, "update": true, "delete": true},
      "demands": {"read": true, "create": true, "update": true, "delete": true},
      "agenda": {"read": true, "create": true, "update": true, "delete": true},
      "team": {"read": true, "invite": true, "manage_roles": true},
      "settings": {"read": true, "profile": true, "landing": true, "goals": true, "notifications": true}
    }'::jsonb;
  ELSIF p_template = 'operator' THEN
    RETURN '{
      "dashboard": {"read": true},
      "reports": {"read": true, "export": false},
      "polls": {"read": true, "create": false, "update": false, "delete": false},
      "supporters": {"read": true, "create": true, "update": true, "delete": false, "import": false},
      "leaderships": {"read": true, "create": true, "update": true, "delete": false},
      "demands": {"read": true, "create": true, "update": true, "delete": false},
      "agenda": {"read": true, "create": true, "update": true, "delete": false},
      "team": {"read": true, "invite": false, "manage_roles": false},
      "settings": {"read": true, "profile": true, "landing": false, "goals": false, "notifications": true}
    }'::jsonb;
  ELSIF p_template = 'coordinator' THEN
    RETURN jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(public.build_permissions_template('operator'), '{team,invite}', 'true'::jsonb),
          '{team,manage_roles}', 'true'::jsonb
        ),
        '{settings,landing}', 'true'::jsonb
      ),
      '{settings,goals}', 'true'::jsonb
    );
  ELSIF p_template = 'advisor' THEN
    RETURN jsonb_set(
      jsonb_set(
        jsonb_set(public.build_permissions_template('operator'), '{reports,export}', 'true'::jsonb),
        '{polls,create}', 'true'::jsonb
      ),
      '{polls,update}', 'true'::jsonb
    );
  ELSE
    RETURN v_read_only;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_tenant_default_roles(p_tenant_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.tenant_roles WHERE tenant_id = p_tenant_id) THEN
    SELECT id INTO v_admin_id
    FROM public.tenant_roles
    WHERE tenant_id = p_tenant_id AND is_full_access
    LIMIT 1;
    RETURN v_admin_id;
  END IF;

  INSERT INTO public.tenant_roles (tenant_id, name, description, is_system, is_full_access, permissions)
  VALUES (
    p_tenant_id,
    'Administrador',
    'Acesso total à campanha. Atribuído automaticamente ao criador da dashboard.',
    true,
    true,
    public.build_permissions_template('full')
  )
  RETURNING id INTO v_admin_id;

  INSERT INTO public.tenant_roles (tenant_id, name, description, is_system, is_full_access, permissions) VALUES
    (p_tenant_id, 'Coordenador', 'Gerencia equipe, landing e metas. Operação completa.', false, false, public.build_permissions_template('coordinator')),
    (p_tenant_id, 'Assessor', 'Operação e relatórios. Sem gestão de equipe.', false, false, public.build_permissions_template('advisor')),
    (p_tenant_id, 'Operador', 'Cadastros e demandas do dia a dia.', false, false, public.build_permissions_template('operator')),
    (p_tenant_id, 'Visualizador', 'Somente leitura em todos os módulos.', false, false, public.build_permissions_template('viewer'));

  RETURN v_admin_id;
END;
$$;

-- Backfill campanhas existentes
DO $$
DECLARE
  r RECORD;
  v_admin_id UUID;
  v_role_id UUID;
BEGIN
  FOR r IN SELECT id FROM public.tenants LOOP
    v_admin_id := public.seed_tenant_default_roles(r.id);

    UPDATE public.tenant_members tm
    SET custom_role_id = v_admin_id
    WHERE tm.tenant_id = r.id
      AND tm.role = 'owner'
      AND tm.custom_role_id IS NULL;

    UPDATE public.tenant_members tm
    SET custom_role_id = tr.id
    FROM public.tenant_roles tr
    WHERE tm.tenant_id = r.id
      AND tr.tenant_id = r.id
      AND tm.custom_role_id IS NULL
      AND (
        (tm.role = 'coordinator' AND tr.name = 'Coordenador') OR
        (tm.role = 'advisor' AND tr.name = 'Assessor') OR
        (tm.role = 'operator' AND tr.name = 'Operador') OR
        (tm.role = 'leadership' AND tr.name = 'Operador') OR
        (tm.role = 'viewer' AND tr.name = 'Visualizador')
      );

    UPDATE public.team_invitations ti
    SET custom_role_id = tr.id
    FROM public.tenant_roles tr
    WHERE ti.tenant_id = r.id
      AND tr.tenant_id = r.id
      AND ti.custom_role_id IS NULL
      AND (
        (ti.role = 'coordinator' AND tr.name = 'Coordenador') OR
        (ti.role = 'advisor' AND tr.name = 'Assessor') OR
        (ti.role = 'operator' AND tr.name = 'Operador') OR
        (ti.role = 'leadership' AND tr.name = 'Operador') OR
        (ti.role = 'viewer' AND tr.name = 'Visualizador')
      );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Helpers de permissão
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tenant_member_role_row(p_tenant_id UUID)
RETURNS public.tenant_roles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tr.*
  FROM public.tenant_members tm
  JOIN public.tenant_roles tr ON tr.id = tm.custom_role_id
  WHERE tm.user_id = auth.uid()
    AND tm.tenant_id = p_tenant_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.tenant_member_is_full_access(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR public.tenant_role(p_tenant_id) = 'owner'
    OR COALESCE((SELECT tr.is_full_access FROM public.tenant_member_role_row(p_tenant_id) tr), false);
$$;

CREATE OR REPLACE FUNCTION public.tenant_member_permissions(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.tenant_roles%ROWTYPE;
BEGIN
  IF public.tenant_member_is_full_access(p_tenant_id) THEN
    RETURN public.build_permissions_template('full')
      || jsonb_build_object('is_full_access', true, 'role_name', 'Administrador');
  END IF;

  SELECT * INTO v_row FROM public.tenant_member_role_row(p_tenant_id);
  IF v_row.id IS NULL THEN
    RETURN public.build_permissions_template('viewer')
      || jsonb_build_object('is_full_access', false, 'role_name', 'Visualizador');
  END IF;

  RETURN v_row.permissions
    || jsonb_build_object('is_full_access', false, 'role_name', v_row.name);
END;
$$;

CREATE OR REPLACE FUNCTION public.tenant_has_permission(
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
  IF public.tenant_member_is_full_access(p_tenant_id) THEN
    RETURN true;
  END IF;

  v_perms := public.tenant_member_permissions(p_tenant_id);
  v_value := v_perms #> ARRAY[p_module, p_action];

  IF v_value IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_value = 'true'::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.tenant_has_any_write(p_tenant_id UUID, p_module TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.tenant_has_permission(p_tenant_id, p_module, 'create')
    OR public.tenant_has_permission(p_tenant_id, p_module, 'update')
    OR public.tenant_has_permission(p_tenant_id, p_module, 'delete');
$$;

CREATE OR REPLACE FUNCTION public.can_write_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR public.tenant_member_is_full_access(p_tenant_id)
    OR public.tenant_has_any_write(p_tenant_id, 'supporters')
    OR public.tenant_has_any_write(p_tenant_id, 'leaderships')
    OR public.tenant_has_any_write(p_tenant_id, 'demands')
    OR public.tenant_has_any_write(p_tenant_id, 'agenda')
    OR public.tenant_has_any_write(p_tenant_id, 'polls');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR public.tenant_member_is_full_access(p_tenant_id)
    OR public.tenant_has_permission(p_tenant_id, 'team', 'manage_roles')
    OR public.tenant_has_permission(p_tenant_id, 'team', 'invite')
    OR public.tenant_has_permission(p_tenant_id, 'settings', 'landing');
$$;

-- ---------------------------------------------------------------------------
-- Atualizar policies RLS granulares
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS supporters_insert ON public.supporters;
CREATE POLICY supporters_insert ON public.supporters FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR public.tenant_has_permission(tenant_id, 'supporters', 'create')
  );

DROP POLICY IF EXISTS supporters_update ON public.supporters;
CREATE POLICY supporters_update ON public.supporters FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR public.tenant_has_permission(tenant_id, 'supporters', 'update')
  );

DROP POLICY IF EXISTS supporters_delete ON public.supporters;
CREATE POLICY supporters_delete ON public.supporters FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR public.tenant_has_permission(tenant_id, 'supporters', 'delete')
  );

DROP POLICY IF EXISTS demands_write ON public.demands;
CREATE POLICY demands_write ON public.demands FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'demands'))
  WITH CHECK (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'demands'));

DROP POLICY IF EXISTS leaderships_write ON public.leaderships;
CREATE POLICY leaderships_write ON public.leaderships FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'leaderships'))
  WITH CHECK (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'leaderships'));

DROP POLICY IF EXISTS agenda_write ON public.agenda_events;
CREATE POLICY agenda_write ON public.agenda_events FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'agenda'))
  WITH CHECK (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'agenda'));

DROP POLICY IF EXISTS poll_write ON public.poll_snapshots;
CREATE POLICY poll_write ON public.poll_snapshots FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'polls'))
  WITH CHECK (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'polls'));

DROP POLICY IF EXISTS landing_pages_write ON public.landing_pages;
CREATE POLICY landing_pages_write ON public.landing_pages FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_permission(tenant_id, 'settings', 'landing'))
  WITH CHECK (public.is_super_admin() OR public.tenant_has_permission(tenant_id, 'settings', 'landing'));

DROP POLICY IF EXISTS invitations_write ON public.team_invitations;
CREATE POLICY invitations_write ON public.team_invitations FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_permission(tenant_id, 'team', 'invite'))
  WITH CHECK (public.is_super_admin() OR public.tenant_has_permission(tenant_id, 'team', 'invite'));

DROP POLICY IF EXISTS tenant_members_insert ON public.tenant_members;
CREATE POLICY tenant_members_insert ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR public.tenant_has_permission(tenant_id, 'team', 'manage_roles'));

DROP POLICY IF EXISTS tenant_members_update ON public.tenant_members;
CREATE POLICY tenant_members_update ON public.tenant_members FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_permission(tenant_id, 'team', 'manage_roles'));

DROP POLICY IF EXISTS tenant_members_delete ON public.tenant_members;
CREATE POLICY tenant_members_delete ON public.tenant_members FOR DELETE TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_permission(tenant_id, 'team', 'manage_roles'));

-- ---------------------------------------------------------------------------
-- RLS tenant_roles
-- ---------------------------------------------------------------------------

ALTER TABLE public.tenant_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_roles_select ON public.tenant_roles;
CREATE POLICY tenant_roles_select ON public.tenant_roles FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

DROP POLICY IF EXISTS tenant_roles_insert ON public.tenant_roles;
CREATE POLICY tenant_roles_insert ON public.tenant_roles FOR INSERT TO authenticated
  WITH CHECK (public.tenant_has_permission(tenant_id, 'team', 'manage_roles') OR public.is_super_admin());

DROP POLICY IF EXISTS tenant_roles_update ON public.tenant_roles;
CREATE POLICY tenant_roles_update ON public.tenant_roles FOR UPDATE TO authenticated
  USING (public.tenant_has_permission(tenant_id, 'team', 'manage_roles') OR public.is_super_admin())
  WITH CHECK (public.tenant_has_permission(tenant_id, 'team', 'manage_roles') OR public.is_super_admin());

DROP POLICY IF EXISTS tenant_roles_delete ON public.tenant_roles;
CREATE POLICY tenant_roles_delete ON public.tenant_roles FOR DELETE TO authenticated
  USING (
    (public.tenant_has_permission(tenant_id, 'team', 'manage_roles') OR public.is_super_admin())
    AND NOT is_system
  );

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_tenant_permissions(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN public.tenant_member_permissions(p_tenant_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_tenant_roles(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN COALESCE((
    SELECT json_agg(row ORDER BY is_system DESC, name)
    FROM (
      SELECT json_build_object(
        'id', tr.id,
        'name', tr.name,
        'description', tr.description,
        'is_system', tr.is_system,
        'is_full_access', tr.is_full_access,
        'permissions', tr.permissions,
        'member_count', (
          SELECT count(*)::int FROM public.tenant_members tm
          WHERE tm.custom_role_id = tr.id
        )
      ) AS row,
      tr.is_system,
      tr.name
      FROM public.tenant_roles tr
      WHERE tr.tenant_id = p_tenant_id
    ) sub
  ), '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_tenant_role(
  p_tenant_id UUID,
  p_role_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_permissions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.tenant_roles%ROWTYPE;
BEGIN
  IF NOT public.tenant_has_permission(p_tenant_id, 'team', 'manage_roles')
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_role_id IS NULL THEN
    INSERT INTO public.tenant_roles (tenant_id, name, description, permissions)
    VALUES (p_tenant_id, trim(p_name), nullif(trim(p_description), ''), p_permissions)
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.tenant_roles
    SET
      name = CASE WHEN is_system THEN name ELSE trim(p_name) END,
      description = nullif(trim(p_description), ''),
      permissions = CASE WHEN is_full_access THEN permissions ELSE p_permissions END,
      updated_at = now()
    WHERE id = p_role_id AND tenant_id = p_tenant_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cargo não encontrado';
    END IF;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'description', v_row.description,
    'is_system', v_row.is_system,
    'is_full_access', v_row.is_full_access,
    'permissions', v_row.permissions
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_tenant_role(p_role_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.tenant_roles%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.tenant_roles WHERE id = p_role_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Cargo não encontrado';
  END IF;

  IF NOT public.tenant_has_permission(v_row.tenant_id, 'team', 'manage_roles')
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF v_row.is_system THEN
    RAISE EXCEPTION 'Cargo do sistema não pode ser excluído';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenant_members WHERE custom_role_id = p_role_id) THEN
    RAISE EXCEPTION 'Cargo em uso por membros da equipe';
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_invitations WHERE custom_role_id = p_role_id AND status = 'pending') THEN
    RAISE EXCEPTION 'Cargo em uso por convites pendentes';
  END IF;

  DELETE FROM public.tenant_roles WHERE id = p_role_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_member_custom_role(
  p_member_id UUID,
  p_custom_role_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member public.tenant_members%ROWTYPE;
  v_role public.tenant_roles%ROWTYPE;
BEGIN
  SELECT * INTO v_member FROM public.tenant_members WHERE id = p_member_id;
  IF v_member.id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado';
  END IF;

  IF NOT public.tenant_has_permission(v_member.tenant_id, 'team', 'manage_roles')
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF v_member.role = 'owner' THEN
    RAISE EXCEPTION 'Não é possível alterar o cargo do administrador principal';
  END IF;

  SELECT * INTO v_role FROM public.tenant_roles
  WHERE id = p_custom_role_id AND tenant_id = v_member.tenant_id;
  IF v_role.id IS NULL THEN
    RAISE EXCEPTION 'Cargo inválido';
  END IF;

  UPDATE public.tenant_members
  SET custom_role_id = p_custom_role_id,
      role = CASE
        WHEN v_role.name = 'Coordenador' THEN 'coordinator'::public.tenant_role
        WHEN v_role.name = 'Assessor' THEN 'advisor'::public.tenant_role
        WHEN v_role.name = 'Visualizador' THEN 'viewer'::public.tenant_role
        ELSE 'operator'::public.tenant_role
      END
  WHERE id = p_member_id;
END;
$$;

-- Signup: seed roles + assign admin
CREATE OR REPLACE FUNCTION public.setup_politician_tenant_for_user(
  p_user_id UUID,
  p_tenant_name TEXT,
  p_slug TEXT,
  p_headline TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_slug TEXT;
  v_role TEXT;
  v_admin_role_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id obrigatório';
  END IF;

  v_role := COALESCE(auth.jwt() ->> 'role', '');
  IF v_role <> 'service_role' AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  SELECT tm.tenant_id INTO v_tenant_id
  FROM public.tenant_members tm
  WHERE tm.user_id = p_user_id
  LIMIT 1;

  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id;
  END IF;

  v_slug := lower(regexp_replace(trim(p_slug), '[^a-z0-9-]', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  IF v_slug = '' OR length(v_slug) < 3 THEN
    RAISE EXCEPTION 'Slug inválido';
  END IF;

  INSERT INTO public.tenants (slug, name, owner_user_id, plan, status)
  VALUES (v_slug, trim(p_tenant_name), p_user_id, 'trial', 'active')
  RETURNING id INTO v_tenant_id;

  v_admin_role_id := public.seed_tenant_default_roles(v_tenant_id);

  INSERT INTO public.tenant_members (tenant_id, user_id, role, custom_role_id)
  VALUES (v_tenant_id, p_user_id, 'owner', v_admin_role_id);

  INSERT INTO public.landing_pages (tenant_id, slug, headline, bio, proposals, is_published)
  VALUES (
    v_tenant_id,
    v_slug,
    COALESCE(p_headline, 'Juntos por uma cidade melhor'),
    '',
    '[]'::jsonb,
    true
  );

  INSERT INTO public.user_preferences (user_id, tenant_id)
  VALUES (p_user_id, v_tenant_id);

  INSERT INTO public.poll_snapshots (tenant_id, snapshot_type, title, data) VALUES
    (v_tenant_id, 'intencao_voto', 'Intenção de voto', '[
      {"candidato":"Você","valor":38},
      {"candidato":"Cand. B","valor":26},
      {"candidato":"Cand. C","valor":18},
      {"candidato":"Cand. D","valor":11},
      {"candidato":"Indecisos","valor":7}
    ]'::jsonb),
    (v_tenant_id, 'aprovacao_bairro', 'Aprovação por bairro', '[
      {"bairro":"Centro","aprovacao":72},
      {"bairro":"Sul","aprovacao":64},
      {"bairro":"Norte","aprovacao":58},
      {"bairro":"Leste","aprovacao":81},
      {"bairro":"Oeste","aprovacao":49}
    ]'::jsonb),
    (v_tenant_id, 'crescimento_apoiadores', 'Crescimento', '[
      {"mes":"Jan","apoiadores":0},{"mes":"Fev","apoiadores":0},
      {"mes":"Mar","apoiadores":0},{"mes":"Abr","apoiadores":0},
      {"mes":"Mai","apoiadores":0},{"mes":"Jun","apoiadores":0}
    ]'::jsonb);

  PERFORM public.log_activity(v_tenant_id, 'Campanha criada com sucesso', 'tenant', v_tenant_id);

  RETURN v_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.team_invitations%ROWTYPE;
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

  RETURN v_inv.tenant_id;
END;
$$;

GRANT SELECT ON TABLE public.tenant_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_permissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_tenant_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_tenant_role(uuid, uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tenant_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_member_custom_role(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.seed_tenant_default_roles(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.build_permissions_template(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.build_permissions_template(text) TO authenticated;
