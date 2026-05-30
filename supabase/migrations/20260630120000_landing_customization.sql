-- Landing: personalização visual (nome público, tema, foto hero) + bucket storage

ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS theme JSONB NOT NULL DEFAULT '{
    "background_color": null,
    "hero_style": "default",
    "show_graphic_elements": true,
    "photo_style": "rounded"
  }'::jsonb;

COMMENT ON COLUMN public.landing_pages.display_name IS
  'Nome exibido no hero da landing. Null usa tenants.name.';
COMMENT ON COLUMN public.landing_pages.theme IS
  'Preferências visuais públicas: cor de fundo, estilo do hero, elementos gráficos, formato da foto.';

CREATE OR REPLACE FUNCTION public.sanitize_landing_theme(p_theme JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_bg TEXT;
  v_hero TEXT;
  v_photo TEXT;
BEGIN
  IF p_theme IS NULL OR jsonb_typeof(p_theme) <> 'object' THEN
    RETURN '{
      "background_color": null,
      "hero_style": "default",
      "show_graphic_elements": true,
      "photo_style": "rounded"
    }'::jsonb;
  END IF;

  v_bg := NULLIF(trim(p_theme->>'background_color'), '');
  IF v_bg IS NOT NULL AND v_bg !~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' THEN
    v_bg := NULL;
  END IF;

  v_hero := COALESCE(p_theme->>'hero_style', 'default');
  IF v_hero NOT IN ('default', 'minimal', 'stamped') THEN
    v_hero := 'default';
  END IF;

  v_photo := COALESCE(p_theme->>'photo_style', 'rounded');
  IF v_photo NOT IN ('rounded', 'circle', 'stamped') THEN
    v_photo := 'rounded';
  END IF;

  RETURN jsonb_build_object(
    'background_color', v_bg,
    'hero_style', v_hero,
    'show_graphic_elements', COALESCE((p_theme->>'show_graphic_elements')::boolean, true),
    'photo_style', v_photo
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_landing_pages_sanitize_theme()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.theme := public.sanitize_landing_theme(NEW.theme);
  NEW.display_name := NULLIF(trim(NEW.display_name), '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS landing_pages_sanitize_theme ON public.landing_pages;
CREATE TRIGGER landing_pages_sanitize_theme
  BEFORE INSERT OR UPDATE OF theme, display_name ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.trg_landing_pages_sanitize_theme();

-- Storage: fotos da landing (pasta = tenant_id)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-photos',
  'landing-photos',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS landing_photos_public_read ON storage.objects;
CREATE POLICY landing_photos_public_read ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'landing-photos');

DROP POLICY IF EXISTS landing_photos_insert ON storage.objects;
CREATE POLICY landing_photos_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'landing-photos'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND (
      public.is_super_admin()
      OR public.tenant_has_permission(((storage.foldername(name))[1])::uuid, 'settings', 'landing')
    )
  );

DROP POLICY IF EXISTS landing_photos_update ON storage.objects;
CREATE POLICY landing_photos_update ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'landing-photos'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND (
      public.is_super_admin()
      OR public.tenant_has_permission(((storage.foldername(name))[1])::uuid, 'settings', 'landing')
    )
  )
  WITH CHECK (
    bucket_id = 'landing-photos'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND (
      public.is_super_admin()
      OR public.tenant_has_permission(((storage.foldername(name))[1])::uuid, 'settings', 'landing')
    )
  );

DROP POLICY IF EXISTS landing_photos_delete ON storage.objects;
CREATE POLICY landing_photos_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'landing-photos'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND (
      public.is_super_admin()
      OR public.tenant_has_permission(((storage.foldername(name))[1])::uuid, 'settings', 'landing')
    )
  );

CREATE OR REPLACE FUNCTION public.get_public_landing(p_slug TEXT)
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
  SELECT lp.tenant_id INTO v_tenant_id
  FROM public.landing_pages lp
  JOIN public.tenants t ON t.id = lp.tenant_id
  WHERE lp.slug = trim(p_slug) AND lp.is_published = true AND t.status = 'active'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
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
  WHERE lp.tenant_id = v_tenant_id AND lp.slug = trim(p_slug)
  LIMIT 1;

  RETURN v_result;
END;
$$;

NOTIFY pgrst, 'reload schema';
