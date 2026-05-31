-- Landing: campos ampliados de apoio + busca de locais de votação (DF)

ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS address_number TEXT,
  ADD COLUMN IF NOT EXISTS address_complement TEXT,
  ADD COLUMN IF NOT EXISTS voting_place_name TEXT,
  ADD COLUMN IF NOT EXISTS lgpd_consent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.polling_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_uf CHAR(2) NOT NULL DEFAULT 'DF',
  municipality TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_polling_places_state_municipality
  ON public.polling_places (state_uf, municipality);

CREATE INDEX IF NOT EXISTS idx_polling_places_name_lower
  ON public.polling_places (lower(name));

COMMENT ON TABLE public.polling_places IS
  'Referência de locais de votação. Importação futura a partir de dados abertos do TRE/TSE.';

ALTER TABLE public.polling_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS polling_places_public_read ON public.polling_places;
CREATE POLICY polling_places_public_read ON public.polling_places
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.search_public_polling_places(
  p_query TEXT,
  p_state_uf TEXT DEFAULT 'DF',
  p_limit INTEGER DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  municipality TEXT,
  address TEXT,
  state_uf TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pp.id,
    pp.name,
    pp.municipality,
    pp.address,
    pp.state_uf::text
  FROM public.polling_places pp
  WHERE upper(pp.state_uf) = upper(COALESCE(NULLIF(trim(p_state_uf), ''), 'DF'))
    AND length(trim(COALESCE(p_query, ''))) >= 2
    AND (
      lower(pp.name) LIKE '%' || lower(trim(p_query)) || '%'
      OR lower(COALESCE(pp.address, '')) LIKE '%' || lower(trim(p_query)) || '%'
      OR lower(pp.municipality) LIKE '%' || lower(trim(p_query)) || '%'
    )
  ORDER BY pp.name
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50);
$$;

REVOKE ALL ON FUNCTION public.search_public_polling_places(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_polling_places(TEXT, TEXT, INTEGER) TO anon, authenticated;

-- Amostra inicial (lista completa via importação futura)
INSERT INTO public.polling_places (state_uf, municipality, name, address)
SELECT 'DF', v.municipality, v.name, v.address
FROM (
  VALUES
    ('Brasília', 'CENTRO DE ENSINO MÉDIO 01 DE BRASÍLIA', 'Asa Sul'),
    ('Brasília', 'CENTRO DE ENSINO MÉDIO 04 DE BRASÍLIA', 'Taguatinga'),
    ('Brasília', 'CENTRO DE ENSINO MÉDIO 05 DE BRASÍLIA', 'Samambaia'),
    ('Brasília', 'EEEFM CEF 01', 'Asa Norte'),
    ('Brasília', 'EEEFM CEF 04', 'Ceilândia'),
    ('Brasília', 'UNB - CAMPUS DARCY RIBEIRO', 'Asa Norte'),
    ('Ceilândia', 'CENTRO DE ENSINO MÉDIO DE CEILÂNDIA', 'Ceilândia Centro'),
    ('Taguatinga', 'CENTRO DE ENSINO MÉDIO DE TAGUATINGA', 'Taguatinga Centro'),
    ('Samambaia', 'CENTRO DE ENSINO MÉDIO DE SAMAMBAIA', 'Samambaia Sul'),
    ('Gama', 'CENTRO DE ENSINO MÉDIO DE GAMA', 'Gama')
) AS v(municipality, name, address)
WHERE NOT EXISTS (SELECT 1 FROM public.polling_places LIMIT 1);

DROP FUNCTION IF EXISTS public.register_supporter_from_landing(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID[], TEXT, TEXT, UUID
);

CREATE OR REPLACE FUNCTION public.register_supporter_from_landing(
  p_public_code TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_interest TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_chapa_ids UUID[] DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_cep TEXT DEFAULT NULL,
  p_primary_leadership_id UUID DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_street TEXT DEFAULT NULL,
  p_address_number TEXT DEFAULT NULL,
  p_address_complement TEXT DEFAULT NULL,
  p_state_uf TEXT DEFAULT NULL,
  p_voting_place_name TEXT DEFAULT NULL,
  p_lgpd_consent BOOLEAN DEFAULT false
)
RETURNS JSONB
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
  v_display_name TEXT;
  v_primary_leadership_name TEXT;
BEGIN
  IF p_public_code IS NULL OR trim(p_public_code) = '' OR p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;

  IF COALESCE(p_lgpd_consent, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'É necessário aceitar o tratamento de dados (LGPD)';
  END IF;

  v_cep := public.normalize_cep(p_cep);
  v_phone := public.normalize_supporter_phone(p_phone);

  v_tenant_id := public.resolve_landing_tenant_id(p_public_code);

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Landing não encontrada';
  END IF;

  IF p_primary_leadership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.leaderships l
    WHERE l.id = p_primary_leadership_id AND l.tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'Liderança inválida para esta campanha';
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
      birth_date = COALESCE(p_birth_date, s.birth_date),
      street = COALESCE(NULLIF(trim(p_street), ''), s.street),
      address_number = COALESCE(NULLIF(trim(p_address_number), ''), s.address_number),
      address_complement = COALESCE(NULLIF(trim(p_address_complement), ''), s.address_complement),
      state_uf = COALESCE(NULLIF(upper(trim(p_state_uf)), ''), s.state_uf),
      voting_place_name = COALESCE(NULLIF(trim(p_voting_place_name), ''), s.voting_place_name),
      lgpd_consent_at = COALESCE(s.lgpd_consent_at, CASE WHEN p_lgpd_consent THEN now() ELSE NULL END),
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
      source = CASE
        WHEN s.source IS NULL OR s.source = 'import' THEN 'landing'::public.supporter_source
        ELSE s.source
      END,
      updated_at = now()
    WHERE s.id = v_supporter_id;
    PERFORM public.set_syncing_leadership_mirror(false);
  ELSE
    PERFORM public.assert_tenant_supporter_capacity(v_tenant_id, 1);

    PERFORM public.set_syncing_leadership_mirror(true);
    INSERT INTO public.supporters (
      tenant_id, name, phone, email, birth_date, street, address_number, address_complement,
      state_uf, voting_place_name, lgpd_consent_at,
      neighborhood, city, cep,
      status, support_level, notes, interest, source, geo_pending
    ) VALUES (
      v_tenant_id,
      trim(p_name),
      v_phone,
      public.normalize_supporter_email(p_email),
      p_birth_date,
      NULLIF(trim(p_street), ''),
      NULLIF(trim(p_address_number), ''),
      NULLIF(trim(p_address_complement), ''),
      NULLIF(upper(trim(p_state_uf)), ''),
      NULLIF(trim(p_voting_place_name), ''),
      CASE WHEN p_lgpd_consent THEN now() ELSE NULL END,
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

  IF p_primary_leadership_id IS NOT NULL THEN
    PERFORM public.set_syncing_leadership_mirror(true);
    INSERT INTO public.supporter_leadership_links (
      tenant_id,
      supporter_id,
      leadership_id,
      relationship_type,
      weight,
      is_primary,
      source
    ) VALUES (
      v_tenant_id,
      v_supporter_id,
      p_primary_leadership_id,
      'assigned',
      1000,
      false,
      'landing'
    )
    ON CONFLICT (supporter_id, leadership_id) DO UPDATE SET
      weight = GREATEST(public.supporter_leadership_links.weight, 1000),
      relationship_type = 'assigned',
      source = 'landing',
      updated_at = now();
    PERFORM public.recompute_supporter_leadership_primary(v_supporter_id);
    PERFORM public.set_syncing_leadership_mirror(false);
  ELSIF p_chapa_ids IS NOT NULL THEN
    PERFORM public.recompute_supporter_leadership_primary(v_supporter_id);
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

  SELECT s.name INTO v_display_name
  FROM public.supporters s
  WHERE s.id = v_supporter_id;

  SELECT l.name INTO v_primary_leadership_name
  FROM public.supporter_leadership_links sll
  JOIN public.leaderships l ON l.id = sll.leadership_id
  WHERE sll.supporter_id = v_supporter_id
    AND sll.is_primary = true
  LIMIT 1;

  RETURN jsonb_build_object(
    'supporter_id', v_supporter_id,
    'merged', v_merged,
    'supporter_name', v_display_name,
    'primary_leadership_name', v_primary_leadership_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_supporter_from_landing(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID[], TEXT, TEXT, UUID,
  DATE, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;
