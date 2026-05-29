-- Chapas eleitorais por liderança + apoios declarados na landing (soma na meta de votos estimados)

CREATE TABLE public.leadership_chapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  leadership_id UUID NOT NULL REFERENCES public.leaderships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subtitle TEXT,
  vote_weight INTEGER NOT NULL DEFAULT 1 CHECK (vote_weight > 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leadership_chapas_tenant ON public.leadership_chapas(tenant_id);
CREATE INDEX idx_leadership_chapas_leadership ON public.leadership_chapas(leadership_id, display_order);

CREATE TABLE public.supporter_chapa_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES public.supporters(id) ON DELETE CASCADE,
  chapa_id UUID NOT NULL REFERENCES public.leadership_chapas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (supporter_id, chapa_id)
);

CREATE INDEX idx_supporter_chapa_pledges_chapa ON public.supporter_chapa_pledges(chapa_id);
CREATE INDEX idx_supporter_chapa_pledges_tenant ON public.supporter_chapa_pledges(tenant_id);

CREATE TRIGGER leadership_chapas_updated_at
  BEFORE UPDATE ON public.leadership_chapas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.leadership_chapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_chapa_pledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY leadership_chapas_select ON public.leadership_chapas FOR SELECT TO authenticated
  USING (public.is_super_admin() OR tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY leadership_chapas_write ON public.leadership_chapas FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'leaderships'))
  WITH CHECK (public.is_super_admin() OR public.tenant_has_any_write(tenant_id, 'leaderships'));

CREATE POLICY supporter_chapa_pledges_select ON public.supporter_chapa_pledges FOR SELECT TO authenticated
  USING (public.is_super_admin() OR tenant_id IN (SELECT public.user_tenant_ids()));

-- Inserções de pledges vêm do RPC público (SECURITY DEFINER); equipe não insere direto na landing.
CREATE POLICY supporter_chapa_pledges_delete ON public.supporter_chapa_pledges FOR DELETE TO authenticated
  USING (public.is_super_admin() OR public.tenant_has_permission(tenant_id, 'supporters', 'delete'));

COMMENT ON TABLE public.leadership_chapas IS 'Chapas/candidatos associados a uma liderança; vote_weight soma na meta estimated_votes.';
COMMENT ON COLUMN public.leaderships.estimated_votes IS 'Meta de votos esperados (associados ao partido/chapa da liderança).';

-- Landing pública: chapas publicadas
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

DROP FUNCTION IF EXISTS public.register_supporter_from_landing(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Registro na landing com seleção de chapas (soma vote_weight na liderança via pledges)
CREATE OR REPLACE FUNCTION public.register_supporter_from_landing(
  p_slug TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_interest TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_chapa_ids UUID[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_supporter_id UUID;
  v_chapa_id UUID;
  v_leadership_id UUID;
BEGIN
  IF p_slug IS NULL OR trim(p_slug) = '' OR p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.landing_pages lp
  JOIN public.tenants t ON t.id = lp.tenant_id
  WHERE lp.slug = trim(p_slug)
    AND lp.is_published = true
    AND t.status = 'active'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Landing não encontrada';
  END IF;

  INSERT INTO public.supporters (
    tenant_id, name, phone, neighborhood, city,
    status, support_level, notes, interest, source
  ) VALUES (
    v_tenant_id,
    trim(p_name),
    NULLIF(trim(p_phone), ''),
    NULLIF(trim(p_neighborhood), ''),
    NULLIF(trim(p_city), ''),
    'interessado',
    'indeciso',
    NULLIF(trim(p_notes), ''),
    NULLIF(trim(p_interest), ''),
    'landing'
  )
  RETURNING id INTO v_supporter_id;

  v_leadership_id := NULL;

  IF p_chapa_ids IS NOT NULL THEN
    FOREACH v_chapa_id IN ARRAY p_chapa_ids
    LOOP
      IF EXISTS (
        SELECT 1 FROM public.leadership_chapas c
        WHERE c.id = v_chapa_id
          AND c.tenant_id = v_tenant_id
          AND c.is_published = true
      ) THEN
        INSERT INTO public.supporter_chapa_pledges (tenant_id, supporter_id, chapa_id)
        VALUES (v_tenant_id, v_supporter_id, v_chapa_id)
        ON CONFLICT (supporter_id, chapa_id) DO NOTHING;

        IF v_leadership_id IS NULL THEN
          SELECT c.leadership_id INTO v_leadership_id
          FROM public.leadership_chapas c
          WHERE c.id = v_chapa_id;
        END IF;
      END IF;
    END LOOP;
  END IF;

  IF v_leadership_id IS NOT NULL THEN
    UPDATE public.supporters
    SET leadership_id = v_leadership_id
    WHERE id = v_supporter_id;
  END IF;

  PERFORM public.log_activity(
    v_tenant_id,
    'Novo apoiador via landing: ' || trim(p_name),
    'supporter',
    v_supporter_id
  );

  RETURN v_supporter_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_landing(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_supporter_from_landing(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID[]) TO anon, authenticated;
