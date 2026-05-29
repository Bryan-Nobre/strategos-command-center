-- P1.3a (parte 2): RPCs de landing e enrichment geo.

-- ========== 3.2 apply_supporter_geo_from_cep ==========

CREATE OR REPLACE FUNCTION public.apply_supporter_geo_from_cep(
  p_supporter_id UUID,
  p_geo_payload JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.supporters%ROWTYPE;
  v_cep TEXT;
  v_can_enrich BOOLEAN;
BEGIN
  IF p_supporter_id IS NULL OR p_geo_payload IS NULL THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;

  SELECT * INTO v_row FROM public.supporters WHERE id = p_supporter_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Apoiador não encontrado';
  END IF;

  v_can_enrich :=
    v_row.geo_pending = true
    AND (
      v_row.source = 'landing'
      AND v_row.created_at > now() - interval '2 hours'
    );

  IF NOT v_can_enrich THEN
    IF NOT (
      v_row.tenant_id IN (SELECT public.user_tenant_ids())
      OR public.is_super_admin()
    ) THEN
      RAISE EXCEPTION 'Acesso negado';
    END IF;
  END IF;

  v_cep := public.normalize_cep(COALESCE(p_geo_payload->>'cep', v_row.cep));

  PERFORM public.set_syncing_leadership_mirror(true);
  UPDATE public.supporters s
  SET
    cep = COALESCE(v_cep, s.cep),
    neighborhood = CASE
      WHEN NULLIF(trim(s.neighborhood), '') IS NOT NULL THEN s.neighborhood
      ELSE COALESCE(NULLIF(trim(p_geo_payload->>'neighborhood'), ''), s.neighborhood)
    END,
    city = CASE
      WHEN NULLIF(trim(s.city), '') IS NOT NULL THEN s.city
      ELSE COALESCE(NULLIF(trim(p_geo_payload->>'city'), ''), s.city)
    END,
    state_uf = COALESCE(
      NULLIF(upper(trim(p_geo_payload->>'state_uf')), ''),
      s.state_uf
    ),
    ibge_city_code = COALESCE(
      NULLIF(trim(p_geo_payload->>'ibge_city_code'), ''),
      s.ibge_city_code
    ),
    latitude = COALESCE(
      NULLIF(p_geo_payload->>'latitude', '')::numeric,
      s.latitude
    ),
    longitude = COALESCE(
      NULLIF(p_geo_payload->>'longitude', '')::numeric,
      s.longitude
    ),
    geo_precision = COALESCE(
      NULLIF(trim(p_geo_payload->>'geo_precision'), ''),
      s.geo_precision,
      'cep'
    ),
    geo_source = COALESCE(
      NULLIF(trim(p_geo_payload->>'source'), ''),
      s.geo_source,
      'unknown'
    ),
    geo_confidence = COALESCE(
      NULLIF(trim(p_geo_payload->>'geo_confidence'), ''),
      s.geo_confidence,
      'medium'
    ),
    geo_pending = false,
    geo_enriched_at = now(),
    updated_at = now()
  WHERE s.id = p_supporter_id;
  PERFORM public.set_syncing_leadership_mirror(false);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_supporter_geo_from_cep(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_supporter_geo_from_cep(uuid, jsonb) TO anon, authenticated;

-- ========== 3.1 register_supporter_from_landing + p_cep ==========

DROP FUNCTION IF EXISTS public.register_supporter_from_landing(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID[], TEXT
);

CREATE OR REPLACE FUNCTION public.register_supporter_from_landing(
  p_slug TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_interest TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_chapa_ids UUID[] DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_cep TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_supporter_id UUID;
  v_existing public.supporters%ROWTYPE;
  v_chapa_id UUID;
  v_crm_managed BOOLEAN;
  v_merged BOOLEAN := false;
  v_cep TEXT;
  v_phone TEXT;
BEGIN
  IF p_slug IS NULL OR trim(p_slug) = '' OR p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;

  v_cep := public.normalize_cep(p_cep);
  v_phone := public.normalize_supporter_phone(p_phone);

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

  v_supporter_id := public.find_possible_duplicate_supporter(
    v_tenant_id,
    v_phone,
    p_email
  );

  IF v_supporter_id IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.supporters WHERE id = v_supporter_id;
    v_crm_managed := public.supporter_is_crm_managed(v_existing);
    v_merged := true;

    PERFORM public.set_syncing_leadership_mirror(true);
    UPDATE public.supporters s
    SET
      name = CASE
        WHEN v_crm_managed THEN COALESCE(NULLIF(trim(s.name), ''), trim(p_name))
        ELSE trim(p_name)
      END,
      phone = CASE
        WHEN v_crm_managed THEN COALESCE(NULLIF(trim(s.phone), ''), v_phone)
        ELSE COALESCE(v_phone, s.phone)
      END,
      email = CASE
        WHEN v_crm_managed THEN COALESCE(public.normalize_supporter_email(s.email), public.normalize_supporter_email(p_email))
        ELSE COALESCE(public.normalize_supporter_email(p_email), s.email)
      END,
      neighborhood = CASE
        WHEN v_crm_managed THEN COALESCE(NULLIF(trim(s.neighborhood), ''), NULLIF(trim(p_neighborhood), ''))
        ELSE COALESCE(NULLIF(trim(p_neighborhood), ''), s.neighborhood)
      END,
      city = CASE
        WHEN v_crm_managed THEN COALESCE(NULLIF(trim(s.city), ''), NULLIF(trim(p_city), ''))
        ELSE COALESCE(NULLIF(trim(p_city), ''), s.city)
      END,
      cep = CASE
        WHEN v_crm_managed THEN COALESCE(s.cep, v_cep)
        ELSE COALESCE(v_cep, s.cep)
      END,
      interest = CASE
        WHEN v_crm_managed THEN COALESCE(NULLIF(trim(s.interest), ''), NULLIF(trim(p_interest), ''))
        ELSE COALESCE(NULLIF(trim(p_interest), ''), s.interest)
      END,
      notes = CASE
        WHEN v_crm_managed THEN COALESCE(NULLIF(trim(s.notes), ''), NULLIF(trim(p_notes), ''))
        ELSE COALESCE(NULLIF(trim(p_notes), ''), s.notes)
      END,
      geo_pending = CASE
        WHEN v_cep IS NOT NULL AND (s.cep IS DISTINCT FROM v_cep OR s.geo_pending) THEN true
        ELSE s.geo_pending
      END,
      updated_at = now()
    WHERE s.id = v_supporter_id;
    PERFORM public.set_syncing_leadership_mirror(false);
  ELSE
    PERFORM public.assert_tenant_supporter_capacity(v_tenant_id, 1);

    PERFORM public.set_syncing_leadership_mirror(true);
    INSERT INTO public.supporters (
      tenant_id, name, phone, email, neighborhood, city, cep,
      status, support_level, notes, interest, source, geo_pending
    ) VALUES (
      v_tenant_id,
      trim(p_name),
      v_phone,
      public.normalize_supporter_email(p_email),
      NULLIF(trim(p_neighborhood), ''),
      NULLIF(trim(p_city), ''),
      v_cep,
      'interessado',
      'indeciso',
      NULLIF(trim(p_notes), ''),
      NULLIF(trim(p_interest), ''),
      'landing',
      v_cep IS NOT NULL
    )
    RETURNING id INTO v_supporter_id;
    PERFORM public.set_syncing_leadership_mirror(false);
  END IF;

  IF p_chapa_ids IS NOT NULL THEN
    PERFORM set_config('app.defer_pledge_link_sync', 'on', true);
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
      END IF;
    END LOOP;
    PERFORM set_config('app.defer_pledge_link_sync', 'off', true);
    PERFORM public.sync_supporter_links_from_pledges(v_supporter_id);
  END IF;

  PERFORM public.refresh_supporter_duplicate_flags(v_supporter_id);

  PERFORM public.log_activity(
    v_tenant_id,
    CASE
      WHEN v_merged THEN 'Apoiador atualizado via landing (cadastro existente): ' || trim(p_name)
      ELSE 'Novo apoiador via landing: ' || trim(p_name)
    END,
    'supporter',
    v_supporter_id
  );

  RETURN v_supporter_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_supporter_from_landing(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID[], TEXT, TEXT
) TO anon, authenticated;
