-- Catálogo comercial de planos — leitura para tenants autenticados (vitrine em Configurações)

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
          'highlight_style', pld.highlight_style
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

REVOKE ALL ON FUNCTION public.list_plan_limit_definitions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_plan_limit_definitions() TO authenticated;

NOTIFY pgrst, 'reload schema';
