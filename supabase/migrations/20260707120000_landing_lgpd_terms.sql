-- Termo de consentimento LGPD configurável por landing (dados do controlador)

ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS lgpd_controller_name TEXT,
  ADD COLUMN IF NOT EXISTS lgpd_controller_cpf TEXT,
  ADD COLUMN IF NOT EXISTS lgpd_controller_email TEXT,
  ADD COLUMN IF NOT EXISTS lgpd_revoke_consent_url TEXT;

COMMENT ON COLUMN public.landing_pages.lgpd_controller_name IS
  'Nome do controlador exibido no termo LGPD da landing pública.';
COMMENT ON COLUMN public.landing_pages.lgpd_controller_cpf IS
  'CPF do controlador (texto livre, ex.: mascarado) para o termo LGPD.';
COMMENT ON COLUMN public.landing_pages.lgpd_controller_email IS
  'Canal de atendimento LGPD / dúvidas sobre dados pessoais.';
COMMENT ON COLUMN public.landing_pages.lgpd_revoke_consent_url IS
  'URL pública para revogação de consentimento.';

CREATE OR REPLACE FUNCTION public.get_public_landing(p_public_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSON;
BEGIN
  v_tenant_id := public.resolve_landing_tenant_id(p_public_code);

  IF v_tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'public_code', lp.public_code,
    'slug', lp.slug,
    'headline', lp.headline,
    'bio', lp.bio,
    'photo_url', lp.photo_url,
    'video_url', lp.video_url,
    'proposals', lp.proposals,
    'social_links', lp.social_links,
    'whatsapp', lp.whatsapp,
    'tenant_name', t.name,
    'display_name', lp.display_name,
    'theme', public.sanitize_landing_theme(lp.theme),
    'lgpd', json_build_object(
      'controller_name', COALESCE(
        NULLIF(trim(lp.lgpd_controller_name), ''),
        NULLIF(trim(lp.display_name), ''),
        t.name
      ),
      'controller_cpf', NULLIF(trim(lp.lgpd_controller_cpf), ''),
      'controller_email', NULLIF(trim(lp.lgpd_controller_email), ''),
      'revoke_consent_url', NULLIF(trim(lp.lgpd_revoke_consent_url), '')
    ),
    'leaderships', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', l.id,
          'name', l.name,
          'region', l.region
        )
        ORDER BY l.name
      )
      FROM public.leaderships l
      WHERE l.tenant_id = v_tenant_id
    ), '[]'::json),
    'chapas', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'subtitle', c.subtitle,
          'vote_weight', c.vote_weight,
          'leadership_id', c.leadership_id,
          'leadership_name', l.name,
          'leadership_region', l.region
        )
        ORDER BY l.name, c.display_order, c.name
      )
      FROM public.leadership_chapas c
      JOIN public.leaderships l ON l.id = c.leadership_id
      WHERE c.tenant_id = v_tenant_id AND c.is_published = true
    ), '[]'::json)
  ) INTO v_result
  FROM public.landing_pages lp
  JOIN public.tenants t ON t.id = lp.tenant_id
  WHERE lp.tenant_id = v_tenant_id
  LIMIT 1;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_landing(TEXT) TO anon, authenticated;
