-- Vitrine comercial: ocultar plano interno (start) e expor flag is_listed por plano.

ALTER TABLE public.plan_limit_definitions
  ADD COLUMN IF NOT EXISTS is_listed BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.plan_limit_definitions.is_listed IS
  'Quando false, o plano não aparece na vitrine (Configurações / comparativo). Start = interno no signup.';

UPDATE public.plan_limit_definitions
SET is_listed = false
WHERE plan = 'start';

-- Catálogo para tenants: só planos listados na vitrine
CREATE OR REPLACE FUNCTION public.list_plan_limit_definitions()
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
          'tagline', pld.tagline,
          'price_label', pld.price_label,
          'is_highlighted', pld.is_highlighted,
          'highlight_style', pld.highlight_style,
          'is_listed', pld.is_listed
        ) AS row,
        CASE pld.plan
          WHEN 'start' THEN 1
          WHEN 'basic' THEN 2
          WHEN 'pro' THEN 3
          WHEN 'enterprise' THEN 4
        END AS plan_order
      FROM public.plan_limit_definitions pld
      WHERE pld.is_listed = true
    ) sub
  ), '[]'::json);
END;
$$;

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
          'tagline', pld.tagline,
          'price_label', pld.price_label,
          'is_highlighted', pld.is_highlighted,
          'highlight_style', pld.highlight_style,
          'is_listed', pld.is_listed,
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
          WHEN 'start' THEN 1
          WHEN 'basic' THEN 2
          WHEN 'pro' THEN 3
          WHEN 'enterprise' THEN 4
        END AS plan_order
      FROM public.plan_limit_definitions pld
    ) sub
  ), '[]'::json);
END;
$$;

DROP FUNCTION IF EXISTS public.update_plan_limit_definition(
  public.tenant_plan, int, int, int, boolean, boolean, text, text, boolean, text
);

CREATE OR REPLACE FUNCTION public.update_plan_limit_definition(
  p_plan public.tenant_plan,
  p_max_supporters INT,
  p_max_team_members INT,
  p_max_regions INT,
  p_exports_enabled BOOLEAN,
  p_polls_enabled BOOLEAN,
  p_tagline TEXT DEFAULT NULL,
  p_price_label TEXT DEFAULT NULL,
  p_is_highlighted BOOLEAN DEFAULT NULL,
  p_highlight_style TEXT DEFAULT NULL,
  p_is_listed BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.plan_limit_definitions%ROWTYPE;
  v_style TEXT;
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

  v_style := COALESCE(NULLIF(trim(p_highlight_style), ''), 'blue');
  IF v_style NOT IN ('blue', 'purple') THEN
    RAISE EXCEPTION 'highlight_style inválido';
  END IF;

  UPDATE public.plan_limit_definitions
  SET
    max_supporters = p_max_supporters,
    max_team_members = p_max_team_members,
    max_regions = p_max_regions,
    exports_enabled = p_exports_enabled,
    polls_enabled = p_polls_enabled,
    tagline = NULLIF(trim(COALESCE(p_tagline, tagline)), ''),
    price_label = COALESCE(NULLIF(trim(p_price_label), ''), price_label),
    is_highlighted = COALESCE(p_is_highlighted, is_highlighted),
    highlight_style = v_style,
    is_listed = COALESCE(p_is_listed, is_listed)
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
    'polls_enabled', v_row.polls_enabled,
    'tagline', v_row.tagline,
    'price_label', v_row.price_label,
    'is_highlighted', v_row.is_highlighted,
    'highlight_style', v_row.highlight_style,
    'is_listed', v_row.is_listed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_plan_limit_definition(
  public.tenant_plan, int, int, int, boolean, boolean, text, text, boolean, text, boolean
) TO authenticated;

NOTIFY pgrst, 'reload schema';
