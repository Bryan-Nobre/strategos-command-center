-- Provisionamento de membros pelo cliente (sem convite) + status ativo/suspenso + limites de plano

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_member_status') THEN
    CREATE TYPE public.tenant_member_status AS ENUM ('active', 'suspended');
  END IF;
END $$;

ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS status public.tenant_member_status NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_status
  ON public.tenant_members(tenant_id, status);

-- Apenas membros ativos acessam dados do tenant
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.tenant_members
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;

-- Vagas do plano: apenas membros ativos
CREATE OR REPLACE FUNCTION public.get_tenant_team_slots_used(p_tenant_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.tenant_members
  WHERE tenant_id = p_tenant_id
    AND status = 'active';
$$;

-- Validação antes do Edge Function criar usuário (chamado com JWT do cliente)
CREATE OR REPLACE FUNCTION public.validate_team_provision_request(
  p_tenant_id UUID,
  p_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_email TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  v_email := lower(trim(COALESCE(p_email, '')));
  IF v_email = '' OR position('@' in v_email) < 2 THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR public.tenant_has_permission(v_uid, p_tenant_id, 'team', 'invite')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para adicionar membros';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = p_tenant_id AND tm.user_id = v_uid AND tm.status = 'active'
  ) AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Campanha inválida';
  END IF;

  PERFORM public.assert_tenant_team_capacity(p_tenant_id, 1);

  IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = v_email) THEN
    IF EXISTS (
      SELECT 1 FROM public.tenant_members tm
      JOIN auth.users u ON u.id = tm.user_id
      WHERE tm.tenant_id = p_tenant_id AND lower(u.email) = v_email
    ) THEN
      RAISE EXCEPTION 'Este e-mail já faz parte da equipe';
    END IF;
    RAISE EXCEPTION 'E-mail já cadastrado na plataforma. Use outro e-mail ou contate o suporte.';
  END IF;
END;
$$;

-- Registro após Auth user criado (somente service_role / Edge Function)
CREATE OR REPLACE FUNCTION public.register_team_member_provision(
  p_tenant_id UUID,
  p_user_id UUID,
  p_custom_role_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.tenant_roles%ROWTYPE;
  v_member_id UUID;
  v_legacy public.tenant_role;
BEGIN
  IF p_user_id IS NULL OR p_tenant_id IS NULL OR p_custom_role_id IS NULL THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;

  SELECT * INTO v_role FROM public.tenant_roles
  WHERE id = p_custom_role_id AND tenant_id = p_tenant_id;
  IF v_role.id IS NULL THEN
    RAISE EXCEPTION 'Cargo inválido';
  END IF;

  IF v_role.is_full_access THEN
    RAISE EXCEPTION 'Use um cargo específico, não o administrador total';
  END IF;

  v_legacy := CASE
    WHEN v_role.name = 'Coordenador' THEN 'coordinator'::public.tenant_role
    WHEN v_role.name = 'Assessor' THEN 'advisor'::public.tenant_role
    WHEN v_role.name = 'Visualizador' THEN 'viewer'::public.tenant_role
    ELSE 'operator'::public.tenant_role
  END;

  UPDATE public.profiles
  SET
    full_name = NULLIF(trim(COALESCE(p_full_name, '')), ''),
    phone = NULLIF(trim(COALESCE(p_phone, '')), '')
  WHERE id = p_user_id;

  INSERT INTO public.tenant_members (tenant_id, user_id, role, custom_role_id, status)
  VALUES (p_tenant_id, p_user_id, v_legacy, p_custom_role_id, 'active')
  RETURNING id INTO v_member_id;

  PERFORM public.log_activity(
    p_tenant_id,
    'Novo membro na equipe: ' || COALESCE(NULLIF(trim(p_full_name), ''), 'Membro'),
    'team_member',
    v_member_id
  );

  RETURN v_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_team_members_enriched(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR p_tenant_id IN (SELECT public.user_tenant_ids())
    OR EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = p_tenant_id AND tm.user_id = v_uid
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN COALESCE(
    (
      SELECT json_agg(row_to_json(x) ORDER BY x."createdAt" DESC)
      FROM (
        SELECT
          tm.id,
          tm.user_id,
          tm.role,
          tm.status,
          tm.custom_role_id AS "customRoleId",
          tr.name AS "customRoleName",
          tm.created_at AS "createdAt",
          p.full_name AS "fullName",
          p.phone,
          p.avatar_url AS "avatarUrl",
          u.email
        FROM public.tenant_members tm
        JOIN public.profiles p ON p.id = tm.user_id
        LEFT JOIN public.tenant_roles tr ON tr.id = tm.custom_role_id
        LEFT JOIN auth.users u ON u.id = tm.user_id
        WHERE tm.tenant_id = p_tenant_id
      ) x
    ),
    '[]'::json
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_team_member_details(
  p_member_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_custom_role_id UUID DEFAULT NULL
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

  IF NOT (
    public.is_super_admin()
    OR public.tenant_has_permission(auth.uid(), v_member.tenant_id, 'team', 'manage_roles')
    OR public.tenant_has_permission(auth.uid(), v_member.tenant_id, 'team', 'invite')
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_member.role = 'owner' AND p_custom_role_id IS NOT NULL THEN
    RAISE EXCEPTION 'Não é possível alterar o cargo do administrador principal';
  END IF;

  IF p_full_name IS NOT NULL OR p_phone IS NOT NULL THEN
    UPDATE public.profiles
    SET
      full_name = COALESCE(NULLIF(trim(p_full_name), ''), full_name),
      phone = CASE WHEN p_phone IS NOT NULL THEN NULLIF(trim(p_phone), '') ELSE phone END
    WHERE id = v_member.user_id;
  END IF;

  IF p_custom_role_id IS NOT NULL AND v_member.role <> 'owner' THEN
    SELECT * INTO v_role FROM public.tenant_roles
    WHERE id = p_custom_role_id AND tenant_id = v_member.tenant_id;
    IF v_role.id IS NULL THEN
      RAISE EXCEPTION 'Cargo inválido';
    END IF;

    UPDATE public.tenant_members
    SET
      custom_role_id = p_custom_role_id,
      role = CASE
        WHEN v_role.name = 'Coordenador' THEN 'coordinator'::public.tenant_role
        WHEN v_role.name = 'Assessor' THEN 'advisor'::public.tenant_role
        WHEN v_role.name = 'Visualizador' THEN 'viewer'::public.tenant_role
        ELSE 'operator'::public.tenant_role
      END
    WHERE id = p_member_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_team_member_status(
  p_member_id UUID,
  p_status public.tenant_member_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member public.tenant_members%ROWTYPE;
BEGIN
  SELECT * INTO v_member FROM public.tenant_members WHERE id = p_member_id;
  IF v_member.id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado';
  END IF;

  IF v_member.role = 'owner' THEN
    RAISE EXCEPTION 'Não é possível suspender o administrador principal';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR public.tenant_has_permission(auth.uid(), v_member.tenant_id, 'team', 'manage_roles')
    OR public.tenant_has_permission(auth.uid(), v_member.tenant_id, 'team', 'invite')
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Status inválido';
  END IF;

  IF p_status = 'active' AND v_member.status = 'suspended' THEN
    PERFORM public.assert_tenant_team_capacity(v_member.tenant_id, 1);
  END IF;

  UPDATE public.tenant_members SET status = p_status WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_team_member(p_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member public.tenant_members%ROWTYPE;
BEGIN
  SELECT * INTO v_member FROM public.tenant_members WHERE id = p_member_id;
  IF v_member.id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado';
  END IF;

  IF v_member.role = 'owner' THEN
    RAISE EXCEPTION 'Não é possível remover o administrador principal';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR public.tenant_has_permission(auth.uid(), v_member.tenant_id, 'team', 'manage_roles')
    OR public.tenant_has_permission(auth.uid(), v_member.tenant_id, 'team', 'invite')
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  DELETE FROM public.tenant_members WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_can_manage_team_member(p_member_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member public.tenant_members%ROWTYPE;
BEGIN
  SELECT * INTO v_member FROM public.tenant_members WHERE id = p_member_id;
  IF v_member.id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR public.tenant_has_permission(auth.uid(), v_member.tenant_id, 'team', 'manage_roles')
    OR public.tenant_has_permission(auth.uid(), v_member.tenant_id, 'team', 'invite')
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN json_build_object(
    'tenant_id', v_member.tenant_id,
    'user_id', v_member.user_id,
    'member_role', v_member.role::text,
    'status', v_member.status::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.register_team_member_provision FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_team_provision_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_team_member_provision TO service_role;
GRANT EXECUTE ON FUNCTION public.list_team_members_enriched TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_member_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_team_member_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.assert_can_manage_team_member TO authenticated;
