-- Admin: listar e editar limites comerciais (super_admin via RPC SECURITY DEFINER).
-- Segurança real: validação no PostgreSQL; UI apenas grava configuração.

ALTER TABLE public.plan_limit_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_limits_select_admin ON public.plan_limit_definitions;
CREATE POLICY plan_limits_select_admin ON public.plan_limit_definitions
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

REVOKE UPDATE, INSERT, DELETE ON TABLE public.plan_limit_definitions FROM authenticated;

CREATE OR REPLACE FUNCTION public.list_plan_limit_definitions_admin()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN COALESCE((
    SELECT json_agg(row ORDER BY plan_order)
    FROM (
      SELECT
        json_build_object(
          'plan', pld.plan,
          'max_supporters', pld.max_supporters,
          'max_team_members', pld.max_team_members,
          'max_regions', pld.max_regions,
          'exports_enabled', pld.exports_enabled,
          'polls_enabled', pld.polls_enabled,
          'tenant_count', (
            SELECT count(*)::int
            FROM public.tenants t
            WHERE t.plan = pld.plan
              AND t.owner_user_id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = t.owner_user_id AND p.platform_role = 'super_admin'
              )
          )
        ) AS row,
        CASE pld.plan
          WHEN 'trial' THEN 1
          WHEN 'basic' THEN 2
          WHEN 'pro' THEN 3
          WHEN 'enterprise' THEN 4
        END AS plan_order
      FROM public.plan_limit_definitions pld
    ) sub
  ), '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_plan_limit_definition(
  p_plan public.tenant_plan,
  p_max_supporters INT,
  p_max_team_members INT,
  p_max_regions INT,
  p_exports_enabled BOOLEAN,
  p_polls_enabled BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.plan_limit_definitions%ROWTYPE;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_max_supporters IS NOT NULL AND p_max_supporters < 1 THEN
    RAISE EXCEPTION 'max_supporters deve ser >= 1 ou NULL (ilimitado)';
  END IF;

  IF p_max_team_members IS NOT NULL AND p_max_team_members < 1 THEN
    RAISE EXCEPTION 'max_team_members deve ser >= 1 ou NULL (ilimitado)';
  END IF;

  IF p_max_regions IS NOT NULL AND p_max_regions < 1 THEN
    RAISE EXCEPTION 'max_regions deve ser >= 1 ou NULL (ilimitado)';
  END IF;

  UPDATE public.plan_limit_definitions
  SET
    max_supporters = p_max_supporters,
    max_team_members = p_max_team_members,
    max_regions = p_max_regions,
    exports_enabled = p_exports_enabled,
    polls_enabled = p_polls_enabled
  WHERE plan = p_plan
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plano não encontrado: %', p_plan;
  END IF;

  RETURN json_build_object(
    'plan', v_row.plan,
    'max_supporters', v_row.max_supporters,
    'max_team_members', v_row.max_team_members,
    'max_regions', v_row.max_regions,
    'exports_enabled', v_row.exports_enabled,
    'polls_enabled', v_row.polls_enabled
  );
END;
$$;

REVOKE ALL ON FUNCTION public.list_plan_limit_definitions_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_plan_limit_definition(
  public.tenant_plan, int, int, int, boolean, boolean
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_plan_limit_definitions_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_plan_limit_definition(
  public.tenant_plan, int, int, int, boolean, boolean
) TO authenticated;
