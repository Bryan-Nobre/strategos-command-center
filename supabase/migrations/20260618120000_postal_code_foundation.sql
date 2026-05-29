-- P1.3a: CEP, cache nacional, enrichment assÃ­ncrono, chaves territoriais unificadas.

-- ========== 1.1 Helpers territoriais (dashboard/reports) ==========

CREATE OR REPLACE FUNCTION public.supporter_territory_key_row(
  p_neighborhood TEXT,
  p_normalized_neighborhood TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT COALESCE(
    NULLIF(trim(p_normalized_neighborhood), ''),
    public.normalize_neighborhood(p_neighborhood),
    'Sem bairro'
  );
$$;

CREATE OR REPLACE FUNCTION public.supporter_territory_label_row(
  p_neighborhood TEXT,
  p_normalized_neighborhood TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT COALESCE(
    NULLIF(trim(p_neighborhood), ''),
    NULLIF(trim(p_normalized_neighborhood), ''),
    public.normalize_neighborhood(p_neighborhood),
    'Sem bairro'
  );
$$;

CREATE OR REPLACE FUNCTION public.demand_territory_key_row(
  p_neighborhood TEXT,
  p_normalized_neighborhood TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT COALESCE(
    NULLIF(trim(p_normalized_neighborhood), ''),
    public.normalize_neighborhood(p_neighborhood),
    'Sem bairro'
  );
$$;

CREATE OR REPLACE FUNCTION public.supporter_matches_neighborhood_filter(
  p_neighborhood TEXT,
  p_normalized_neighborhood TEXT,
  p_filter TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT
    p_filter IS NULL
    OR trim(p_filter) = ''
    OR public.supporter_territory_key_row(p_neighborhood, p_normalized_neighborhood)
       = public.normalize_neighborhood(p_filter)
    OR COALESCE(p_neighborhood, '') ILIKE '%' || trim(p_filter) || '%';
$$;

-- ========== 1.1 Supporters geo columns ==========

ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS ibge_city_code TEXT,
  ADD COLUMN IF NOT EXISTS state_uf CHAR(2),
  ADD COLUMN IF NOT EXISTS geo_precision TEXT,
  ADD COLUMN IF NOT EXISTS geo_source TEXT,
  ADD COLUMN IF NOT EXISTS geo_confidence TEXT,
  ADD COLUMN IF NOT EXISTS geo_enriched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS geo_pending BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.supporters
  DROP CONSTRAINT IF EXISTS supporters_geo_precision_check,
  DROP CONSTRAINT IF EXISTS supporters_geo_source_check,
  DROP CONSTRAINT IF EXISTS supporters_geo_confidence_check,
  DROP CONSTRAINT IF EXISTS supporters_state_uf_check;

ALTER TABLE public.supporters
  ADD CONSTRAINT supporters_geo_precision_check
    CHECK (geo_precision IS NULL OR geo_precision IN ('cep', 'city', 'manual', 'unknown')),
  ADD CONSTRAINT supporters_geo_source_check
    CHECK (geo_source IS NULL OR geo_source IN ('viacep', 'brasilapi', 'manual', 'import', 'unknown')),
  ADD CONSTRAINT supporters_geo_confidence_check
    CHECK (geo_confidence IS NULL OR geo_confidence IN ('high', 'medium', 'low', 'unknown')),
  ADD CONSTRAINT supporters_state_uf_check
    CHECK (state_uf IS NULL OR state_uf ~ '^[A-Z]{2}$');

CREATE INDEX IF NOT EXISTS supporters_tenant_cep_idx
  ON public.supporters (tenant_id, cep)
  WHERE cep IS NOT NULL;

CREATE INDEX IF NOT EXISTS supporters_geo_pending_idx
  ON public.supporters (tenant_id, geo_pending)
  WHERE geo_pending = true;

-- ========== 1.2 postal_code_cache ==========

CREATE TABLE IF NOT EXISTS public.postal_code_cache (
  cep CHAR(8) PRIMARY KEY,
  ibge_city_code TEXT,
  city_name TEXT,
  state_uf CHAR(2),
  neighborhood TEXT,
  street TEXT,
  provider TEXT NOT NULL,
  raw_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  geo_precision TEXT,
  geo_confidence TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT postal_code_cache_geo_precision_check
    CHECK (geo_precision IS NULL OR geo_precision IN ('cep', 'city', 'manual', 'unknown')),
  CONSTRAINT postal_code_cache_geo_confidence_check
    CHECK (geo_confidence IS NULL OR geo_confidence IN ('high', 'medium', 'low', 'unknown')),
  CONSTRAINT postal_code_cache_state_uf_check
    CHECK (state_uf IS NULL OR state_uf ~ '^[A-Z]{2}$')
);

CREATE INDEX IF NOT EXISTS postal_code_cache_ibge_idx
  ON public.postal_code_cache (ibge_city_code);

CREATE INDEX IF NOT EXISTS postal_code_cache_state_city_idx
  ON public.postal_code_cache (state_uf, city_name);

CREATE INDEX IF NOT EXISTS postal_code_cache_expires_idx
  ON public.postal_code_cache (expires_at);

ALTER TABLE public.postal_code_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS postal_code_cache_select_authenticated ON public.postal_code_cache;
CREATE POLICY postal_code_cache_select_authenticated
  ON public.postal_code_cache
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE ALL ON public.postal_code_cache FROM PUBLIC, anon;
GRANT SELECT ON public.postal_code_cache TO authenticated;

-- ========== 1.3 normalize_cep ==========

CREATE OR REPLACE FUNCTION public.normalize_cep(p_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
  v_digits TEXT;
BEGIN
  IF p_input IS NULL OR trim(p_input) = '' THEN
    RETURN NULL;
  END IF;

  v_digits := regexp_replace(p_input, '\D', '', 'g');
  IF length(v_digits) <> 8 THEN
    RETURN NULL;
  END IF;

  RETURN v_digits;
END;
$$;

COMMENT ON FUNCTION public.normalize_cep IS
  'Extrai 8 dÃ­gitos do CEP brasileiro; retorna NULL se invÃ¡lido.';

-- ========== 1.4 Trigger supporters CEP ==========

CREATE OR REPLACE FUNCTION public.supporters_cep_before()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.cep := public.normalize_cep(NEW.cep);

  IF TG_OP = 'INSERT' THEN
    IF NEW.cep IS NOT NULL THEN
      NEW.geo_pending := true;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.cep IS DISTINCT FROM OLD.cep AND NEW.cep IS NOT NULL THEN
      NEW.geo_pending := true;
    END IF;
    IF NEW.cep IS NOT NULL AND (NEW.latitude IS NULL OR NEW.longitude IS NULL) THEN
      NEW.geo_pending := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supporters_cep_before ON public.supporters;
CREATE TRIGGER supporters_cep_before
  BEFORE INSERT OR UPDATE OF cep, latitude, longitude
  ON public.supporters
  FOR EACH ROW
  EXECUTE FUNCTION public.supporters_cep_before();

-- ========== 1.5 Cache upsert (service / SECURITY DEFINER) ==========

CREATE OR REPLACE FUNCTION public.upsert_postal_code_cache(p_payload JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cep TEXT;
BEGIN
  v_cep := public.normalize_cep(p_payload->>'cep');
  IF v_cep IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.postal_code_cache (
    cep,
    ibge_city_code,
    city_name,
    state_uf,
    neighborhood,
    street,
    provider,
    raw_response,
    latitude,
    longitude,
    geo_precision,
    geo_confidence,
    fetched_at,
    expires_at
  ) VALUES (
    v_cep,
    NULLIF(trim(p_payload->>'ibge_city_code'), ''),
    NULLIF(trim(p_payload->>'city'), ''),
    NULLIF(upper(trim(p_payload->>'state_uf')), ''),
    NULLIF(trim(p_payload->>'neighborhood'), ''),
    NULLIF(trim(p_payload->>'street'), ''),
    COALESCE(NULLIF(trim(p_payload->>'source'), ''), 'unknown'),
    COALESCE(p_payload->'raw_response', '{}'::jsonb),
    NULLIF(p_payload->>'latitude', '')::numeric,
    NULLIF(p_payload->>'longitude', '')::numeric,
    COALESCE(NULLIF(trim(p_payload->>'geo_precision'), ''), 'cep'),
    COALESCE(NULLIF(trim(p_payload->>'geo_confidence'), ''), 'medium'),
    now(),
    now() + interval '90 days'
  )
  ON CONFLICT (cep) DO UPDATE SET
    ibge_city_code = EXCLUDED.ibge_city_code,
    city_name = EXCLUDED.city_name,
    state_uf = EXCLUDED.state_uf,
    neighborhood = EXCLUDED.neighborhood,
    street = EXCLUDED.street,
    provider = EXCLUDED.provider,
    raw_response = EXCLUDED.raw_response,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    geo_precision = EXCLUDED.geo_precision,
    geo_confidence = EXCLUDED.geo_confidence,
    fetched_at = EXCLUDED.fetched_at,
    expires_at = EXCLUDED.expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_postal_code_cache(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_postal_code_cache(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.get_postal_code_cache(p_cep TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cep TEXT;
  v_row public.postal_code_cache%ROWTYPE;
BEGIN
  v_cep := public.normalize_cep(p_cep);
  IF v_cep IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_row
  FROM public.postal_code_cache c
  WHERE c.cep = v_cep
    AND c.expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'cep', v_row.cep,
    'neighborhood', v_row.neighborhood,
    'city', v_row.city_name,
    'state_uf', v_row.state_uf,
    'ibge_city_code', v_row.ibge_city_code,
    'street', v_row.street,
    'latitude', v_row.latitude,
    'longitude', v_row.longitude,
    'geo_precision', v_row.geo_precision,
    'geo_confidence', v_row.geo_confidence,
    'source', v_row.provider,
    'cache_hit', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_postal_code_cache(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_postal_code_cache(text) TO service_role;

-- RPCs de landing: ver 20260618120001_postal_code_landing_rpcs.sql
-- Dashboard territory_key: ver 20260618120002_dashboard_territory_keys.sql
