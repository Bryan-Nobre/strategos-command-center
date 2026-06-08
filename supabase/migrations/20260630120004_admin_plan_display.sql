-- Plano trial → start + vitrine comercial (preço, destaque, gradiente)

ALTER TYPE public.tenant_plan RENAME VALUE 'trial' TO 'start';

ALTER TABLE public.tenants ALTER COLUMN plan SET DEFAULT 'start';

ALTER TABLE public.plan_limit_definitions
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS price_label TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS highlight_style TEXT NOT NULL DEFAULT 'blue'
    CHECK (highlight_style IN ('blue', 'purple'));

COMMENT ON COLUMN public.plan_limit_definitions.tagline IS 'Subtítulo exibido no card comercial do plano.';
COMMENT ON COLUMN public.plan_limit_definitions.price_label IS 'Texto de preço exibido no card (ex.: Grátis, R$ 199/mês).';
COMMENT ON COLUMN public.plan_limit_definitions.is_highlighted IS 'Destaque visual na vitrine de planos.';
COMMENT ON COLUMN public.plan_limit_definitions.highlight_style IS 'Gradiente do card em destaque: blue ou purple.';

UPDATE public.plan_limit_definitions SET
  tagline = CASE plan
    WHEN 'start' THEN 'Para começar a organizar sua campanha'
    WHEN 'basic' THEN 'Campanhas em crescimento'
    WHEN 'pro' THEN 'Operação profissional de campo'
    WHEN 'enterprise' THEN 'Escala e governança avançada'
  END,
  price_label = CASE plan
    WHEN 'start' THEN 'Grátis'
    WHEN 'basic' THEN 'Sob consulta'
    WHEN 'pro' THEN 'Sob consulta'
    WHEN 'enterprise' THEN 'Personalizado'
  END,
  is_highlighted = plan IN ('pro', 'enterprise'),
  highlight_style = CASE plan WHEN 'enterprise' THEN 'purple' ELSE 'blue' END
WHERE tagline IS NULL OR trim(tagline) = '' OR price_label = '';

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
  VALUES (v_slug, trim(p_tenant_name), p_user_id, 'start', 'suspended')
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
    false
  );

  INSERT INTO public.user_preferences (user_id, tenant_id)
  VALUES (p_user_id, v_tenant_id);

  PERFORM public.log_activity(v_tenant_id, 'Campanha criada — aguardando ativação', 'tenant', v_tenant_id);

  RETURN v_tenant_id;
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
  public.tenant_plan, int, int, int, boolean, boolean
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
  p_highlight_style TEXT DEFAULT NULL
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
    highlight_style = v_style
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
    'highlight_style', v_row.highlight_style
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_plan_limit_definition(
  public.tenant_plan, int, int, int, boolean, boolean, text, text, boolean, text
) TO authenticated;

NOTIFY pgrst, 'reload schema';
