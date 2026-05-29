-- P1.3b: pipeline híbrido de enriquecimento geo (SQL claim/cache + Edge worker).

-- ========== FASE 1: colunas de controle ==========

ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS geo_enrichment_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS geo_enrichment_failed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS geo_last_error TEXT,
  ADD COLUMN IF NOT EXISTS geo_last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS geo_processing_at TIMESTAMPTZ;

COMMENT ON COLUMN public.supporters.geo_enrichment_attempts IS
  'Tentativas reais de enriquecimento (claim/worker). Cap recomendado: 5.';
COMMENT ON COLUMN public.supporters.geo_processing_at IS
  'Lock de processamento concorrente; liberado após sucesso, falha ou cache miss.';

-- ========== índices de fila ==========

CREATE INDEX IF NOT EXISTS supporters_geo_queue_idx
  ON public.supporters (geo_last_attempt_at NULLS FIRST, created_at)
  WHERE (geo_pending OR geo_enrichment_failed)
    AND cep IS NOT NULL;

CREATE INDEX IF NOT EXISTS supporters_geo_failed_idx
  ON public.supporters (tenant_id, geo_last_attempt_at)
  WHERE geo_enrichment_failed;

-- ========== FASE 3: prioridade de fontes ==========

CREATE OR REPLACE FUNCTION public.geo_source_priority(p_source TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(COALESCE(p_source, '')))
    WHEN 'manual' THEN 100
    WHEN 'import' THEN 80
    WHEN 'brasilapi' THEN 60
    WHEN 'viacep' THEN 50
    WHEN 'unknown' THEN 0
    ELSE 0
  END;
$$;

COMMENT ON FUNCTION public.geo_source_priority IS
  'Prioridade para merge idempotente de geo_source e coordenadas.';

-- ========== FASE 8: logs operacionais ==========

CREATE TABLE IF NOT EXISTS public.geo_enrichment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_id UUID NOT NULL REFERENCES public.supporters(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cep TEXT,
  provider TEXT,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS geo_enrichment_logs_created_at_idx
  ON public.geo_enrichment_logs (created_at);

CREATE INDEX IF NOT EXISTS geo_enrichment_logs_tenant_created_idx
  ON public.geo_enrichment_logs (tenant_id, created_at DESC);

COMMENT ON TABLE public.geo_enrichment_logs IS
  'Auditoria operacional do pipeline geo. Retenção recomendada: 14 dias (cleanup manual/cron).';

ALTER TABLE public.geo_enrichment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS geo_enrichment_logs_tenant_select ON public.geo_enrichment_logs;
CREATE POLICY geo_enrichment_logs_tenant_select ON public.geo_enrichment_logs
  FOR SELECT
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    OR public.is_super_admin()
  );

-- ========== helper: log interno ==========

CREATE OR REPLACE FUNCTION public.insert_geo_enrichment_log(
  p_supporter_id UUID,
  p_tenant_id UUID,
  p_cep TEXT,
  p_provider TEXT,
  p_cache_hit BOOLEAN,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_latency_ms INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.geo_enrichment_logs (
    supporter_id,
    tenant_id,
    cep,
    provider,
    cache_hit,
    success,
    error_message,
    latency_ms
  ) VALUES (
    p_supporter_id,
    p_tenant_id,
    p_cep,
    p_provider,
    COALESCE(p_cache_hit, false),
    COALESCE(p_success, false),
    NULLIF(trim(p_error_message), ''),
    p_latency_ms
  );
END;
$$;

REVOKE ALL ON FUNCTION public.insert_geo_enrichment_log(uuid, uuid, text, text, boolean, boolean, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_geo_enrichment_log(uuid, uuid, text, text, boolean, boolean, text, integer) TO service_role;

-- ========== falha de enriquecimento (worker) ==========

CREATE OR REPLACE FUNCTION public.fail_geo_enrichment(
  p_supporter_id UUID,
  p_error TEXT,
  p_provider TEXT DEFAULT NULL,
  p_cache_hit BOOLEAN DEFAULT false,
  p_latency_ms INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.supporters%ROWTYPE;
  v_max_attempts CONSTANT INTEGER := 5;
BEGIN
  SELECT * INTO v_row FROM public.supporters WHERE id = p_supporter_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Apoiador não encontrado';
  END IF;

  PERFORM public.insert_geo_enrichment_log(
    p_supporter_id,
    v_row.tenant_id,
    v_row.cep,
    p_provider,
    p_cache_hit,
    false,
    p_error,
    p_latency_ms
  );

  UPDATE public.supporters s
  SET
    geo_enrichment_failed = true,
    geo_last_error = NULLIF(left(trim(COALESCE(p_error, 'unknown')), 500), ''),
    geo_processing_at = NULL,
    geo_pending = CASE
      WHEN s.geo_enrichment_attempts >= v_max_attempts THEN false
      ELSE true
    END,
    updated_at = now()
  WHERE s.id = p_supporter_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fail_geo_enrichment(uuid, text, text, boolean, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fail_geo_enrichment(uuid, text, text, boolean, integer) TO service_role;

-- ========== FASE 2: trigger CEP (sem depender de lat/lng) ==========

CREATE OR REPLACE FUNCTION public.supporters_cep_before()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.cep := public.normalize_cep(NEW.cep);

  IF TG_OP = 'INSERT' THEN
    IF NEW.cep IS NOT NULL
      AND (NEW.geo_enriched_at IS NULL OR NEW.geo_source IS NULL)
    THEN
      NEW.geo_pending := true;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.cep IS DISTINCT FROM OLD.cep AND NEW.cep IS NOT NULL THEN
      NEW.geo_pending := true;
      NEW.geo_enrichment_failed := false;
      NEW.geo_last_error := NULL;
    ELSIF NEW.cep IS NOT NULL
      AND (OLD.geo_enriched_at IS NULL OR OLD.geo_source IS NULL)
      AND (NEW.geo_enriched_at IS NULL OR NEW.geo_source IS NULL)
    THEN
      NEW.geo_pending := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supporters_cep_before ON public.supporters;
CREATE TRIGGER supporters_cep_before
  BEFORE INSERT OR UPDATE OF cep
  ON public.supporters
  FOR EACH ROW
  EXECUTE FUNCTION public.supporters_cep_before();

-- ========== FASE 4: apply idempotente ==========

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
  v_is_service BOOLEAN;
  v_incoming_source TEXT;
  v_incoming_pri INTEGER;
  v_current_pri INTEGER;
  v_incoming_state TEXT;
  v_incoming_ibge TEXT;
  v_incoming_lat NUMERIC;
  v_incoming_lng NUMERIC;
  v_new_neighborhood TEXT;
  v_new_city TEXT;
  v_new_state TEXT;
  v_new_ibge TEXT;
  v_new_lat NUMERIC;
  v_new_lng NUMERIC;
  v_new_source TEXT;
  v_valid_success BOOLEAN;
BEGIN
  IF p_supporter_id IS NULL OR p_geo_payload IS NULL THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;

  SELECT * INTO v_row FROM public.supporters WHERE id = p_supporter_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Apoiador não encontrado';
  END IF;

  v_is_service := auth.role() = 'service_role';

  v_can_enrich :=
    v_row.geo_pending = true
    AND (
      v_is_service
      OR (
        v_row.source = 'landing'
        AND v_row.created_at > now() - interval '2 hours'
      )
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

  v_incoming_source := COALESCE(
    NULLIF(trim(p_geo_payload->>'source'), ''),
    'unknown'
  );
  v_incoming_pri := public.geo_source_priority(v_incoming_source);
  v_current_pri := public.geo_source_priority(v_row.geo_source);

  v_incoming_state := NULLIF(upper(trim(p_geo_payload->>'state_uf')), '');
  v_incoming_ibge := NULLIF(trim(p_geo_payload->>'ibge_city_code'), '');
  v_incoming_lat := NULLIF(p_geo_payload->>'latitude', '')::numeric;
  v_incoming_lng := NULLIF(p_geo_payload->>'longitude', '')::numeric;

  v_new_neighborhood := CASE
    WHEN NULLIF(trim(v_row.neighborhood), '') IS NOT NULL THEN v_row.neighborhood
    ELSE COALESCE(NULLIF(trim(p_geo_payload->>'neighborhood'), ''), v_row.neighborhood)
  END;

  v_new_city := CASE
    WHEN NULLIF(trim(v_row.city), '') IS NOT NULL THEN v_row.city
    ELSE COALESCE(NULLIF(trim(p_geo_payload->>'city'), ''), v_row.city)
  END;

  v_new_state := CASE
    WHEN v_incoming_pri >= v_current_pri AND v_incoming_state IS NOT NULL
    THEN v_incoming_state
    ELSE v_row.state_uf
  END;

  v_new_ibge := CASE
    WHEN v_incoming_pri >= v_current_pri AND v_incoming_ibge IS NOT NULL
    THEN v_incoming_ibge
    ELSE v_row.ibge_city_code
  END;

  v_new_lat := CASE
    WHEN v_incoming_pri >= v_current_pri AND v_incoming_lat IS NOT NULL
    THEN v_incoming_lat
    ELSE v_row.latitude
  END;

  v_new_lng := CASE
    WHEN v_incoming_pri >= v_current_pri AND v_incoming_lng IS NOT NULL
    THEN v_incoming_lng
    ELSE v_row.longitude
  END;

  v_new_source := CASE
    WHEN v_incoming_pri >= v_current_pri THEN v_incoming_source
    ELSE COALESCE(v_row.geo_source, 'unknown')
  END;

  v_valid_success :=
    (
      NULLIF(trim(v_new_city), '') IS NOT NULL
      AND NULLIF(trim(v_new_state), '') IS NOT NULL
    )
    OR (v_new_lat IS NOT NULL AND v_new_lng IS NOT NULL);

  PERFORM public.set_syncing_leadership_mirror(true);
  UPDATE public.supporters s
  SET
    cep = COALESCE(v_cep, s.cep),
    neighborhood = v_new_neighborhood,
    city = v_new_city,
    state_uf = v_new_state,
    ibge_city_code = v_new_ibge,
    latitude = v_new_lat,
    longitude = v_new_lng,
    geo_precision = COALESCE(
      NULLIF(trim(p_geo_payload->>'geo_precision'), ''),
      s.geo_precision,
      'cep'
    ),
    geo_source = v_new_source,
    geo_confidence = COALESCE(
      NULLIF(trim(p_geo_payload->>'geo_confidence'), ''),
      s.geo_confidence,
      'medium'
    ),
    geo_pending = CASE WHEN v_valid_success THEN false ELSE s.geo_pending END,
    geo_enriched_at = CASE WHEN v_valid_success THEN now() ELSE s.geo_enriched_at END,
    geo_enrichment_failed = false,
    geo_last_error = NULL,
    geo_last_attempt_at = now(),
    geo_processing_at = NULL,
    updated_at = now()
  WHERE s.id = p_supporter_id;
  PERFORM public.set_syncing_leadership_mirror(false);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_supporter_geo_from_cep(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_supporter_geo_from_cep(uuid, jsonb) TO anon, authenticated, service_role;

-- ========== FASE 5: claim de fila ==========

CREATE OR REPLACE FUNCTION public.claim_geo_enrichment_batch(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  supporter_id UUID,
  tenant_id UUID,
  cep TEXT,
  geo_source TEXT,
  geo_pending BOOLEAN,
  geo_enrichment_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
  v_max_attempts CONSTANT INTEGER := 5;
  v_stale INTERVAL := interval '15 minutes';
BEGIN
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);

  RETURN QUERY
  WITH picked AS (
    SELECT s.id
    FROM public.supporters s
    WHERE (
        s.geo_pending = true
        OR s.geo_enrichment_failed = true
      )
      AND s.cep IS NOT NULL
      AND s.geo_enrichment_attempts < v_max_attempts
      AND (
        s.geo_processing_at IS NULL
        OR s.geo_processing_at < now() - v_stale
      )
    ORDER BY s.geo_last_attempt_at NULLS FIRST, s.created_at ASC
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.supporters s
    SET
      geo_processing_at = now(),
      geo_last_attempt_at = now(),
      geo_enrichment_attempts = s.geo_enrichment_attempts + 1,
      updated_at = now()
    FROM picked p
    WHERE s.id = p.id
    RETURNING
      s.id,
      s.tenant_id,
      s.cep,
      s.geo_source,
      s.geo_pending,
      s.geo_enrichment_attempts
  )
  SELECT
    c.id,
    c.tenant_id,
    c.cep,
    c.geo_source,
    c.geo_pending,
    c.geo_enrichment_attempts
  FROM claimed c;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_geo_enrichment_batch(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_geo_enrichment_batch(integer) TO service_role;

-- ========== FASE 6: processamento SQL (cache hit) ==========

CREATE OR REPLACE FUNCTION public.process_pending_geo_enrichment(
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed RECORD;
  v_cache JSONB;
  v_processed INTEGER := 0;
  v_hits INTEGER := 0;
  v_misses INTEGER := 0;
  v_failed INTEGER := 0;
  v_provider TEXT;
BEGIN
  FOR v_claimed IN
    SELECT * FROM public.claim_geo_enrichment_batch(p_limit)
  LOOP
    v_processed := v_processed + 1;
    v_cache := public.get_postal_code_cache(v_claimed.cep);

    IF v_cache IS NOT NULL AND COALESCE((v_cache->>'success')::boolean, false) THEN
      BEGIN
        v_provider := COALESCE(v_cache->>'source', 'cache');
        PERFORM public.apply_supporter_geo_from_cep(v_claimed.supporter_id, v_cache);
        PERFORM public.insert_geo_enrichment_log(
          v_claimed.supporter_id,
          v_claimed.tenant_id,
          v_claimed.cep,
          v_provider,
          true,
          true,
          NULL,
          NULL
        );
        v_hits := v_hits + 1;
      EXCEPTION WHEN OTHERS THEN
        PERFORM public.fail_geo_enrichment(
          v_claimed.supporter_id,
          SQLERRM,
          COALESCE(v_cache->>'source', 'cache'),
          true,
          NULL
        );
        v_failed := v_failed + 1;
      END;
    ELSE
      UPDATE public.supporters s
      SET geo_processing_at = NULL
      WHERE s.id = v_claimed.supporter_id;
      v_misses := v_misses + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', v_processed,
    'cache_hits', v_hits,
    'cache_misses', v_misses,
    'failed', v_failed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_pending_geo_enrichment(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_pending_geo_enrichment(integer) TO service_role;

-- ========== FASE 9: métricas ==========

CREATE OR REPLACE VIEW public.geo_enrichment_metrics_v
WITH (security_invoker = true)
AS
WITH supporter_stats AS (
  SELECT
    s.tenant_id,
    COUNT(*) FILTER (
      WHERE s.geo_pending = true AND s.cep IS NOT NULL
    )::int AS pending_count,
    COUNT(*) FILTER (WHERE s.geo_enrichment_failed = true)::int AS failed_count,
    COUNT(*) FILTER (
      WHERE s.geo_enriched_at >= now() - interval '24 hours'
    )::int AS success_24h,
    COALESCE(ROUND(AVG(s.geo_enrichment_attempts) FILTER (
      WHERE s.cep IS NOT NULL
    ), 2), 0) AS avg_attempts,
    CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE ROUND(
        COUNT(*) FILTER (WHERE s.cep IS NOT NULL)::numeric / COUNT(*),
        4
      )
    END AS with_cep_pct,
    CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE ROUND(
        COUNT(*) FILTER (WHERE s.geo_enriched_at IS NOT NULL)::numeric / COUNT(*),
        4
      )
    END AS geo_enriched_pct
  FROM public.supporters s
  GROUP BY s.tenant_id
),
log_stats AS (
  SELECT
    l.tenant_id,
    CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE ROUND(
        COUNT(*) FILTER (WHERE l.cache_hit = true)::numeric / COUNT(*),
        4
      )
    END AS cache_hit_ratio
  FROM public.geo_enrichment_logs l
  WHERE l.created_at >= now() - interval '24 hours'
  GROUP BY l.tenant_id
)
SELECT
  ss.tenant_id,
  ss.pending_count,
  ss.failed_count,
  ss.success_24h,
  ls.cache_hit_ratio,
  ss.avg_attempts,
  ss.with_cep_pct,
  ss.geo_enriched_pct
FROM supporter_stats ss
LEFT JOIN log_stats ls ON ls.tenant_id = ss.tenant_id;

GRANT SELECT ON public.geo_enrichment_metrics_v TO authenticated;

-- ========== rede liderança: campos geo (aditivo, compatível) ==========

CREATE OR REPLACE FUNCTION public.get_leadership_operational_detail(
  p_leadership_id UUID,
  p_segment TEXT DEFAULT 'all',
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_segment TEXT;
  v_limit INT;
  v_offset INT;
BEGIN
  IF p_leadership_id IS NULL THEN
    RAISE EXCEPTION 'Liderança inválida';
  END IF;

  SELECT l.tenant_id INTO v_tenant_id
  FROM public.leaderships l
  WHERE l.id = p_leadership_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Liderança não encontrada';
  END IF;

  IF NOT (v_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  v_segment := lower(trim(COALESCE(p_segment, 'all')));
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_offset := GREATEST(COALESCE(p_offset, 0), 0);

  RETURN (
    WITH linked AS (
      SELECT
        sll.supporter_id,
        sll.is_primary,
        sll.relationship_type,
        sll.source AS link_source,
        sll.weight,
        sll.created_at AS link_created_at,
        s.name AS supporter_name,
        NULLIF(trim(s.neighborhood), '') AS neighborhood,
        COALESCE(
          s.normalized_neighborhood,
          public.normalize_neighborhood(s.neighborhood)
        ) AS normalized_neighborhood,
        NULLIF(trim(s.city), '') AS city,
        s.last_activity_at,
        COALESCE(s.activity_score, 0) AS activity_score,
        s.engagement_status::text AS engagement_status,
        s.geo_pending,
        s.geo_enrichment_failed,
        s.geo_enriched_at,
        s.cep,
        EXISTS (
          SELECT 1
          FROM public.supporter_chapa_pledges p
          JOIN public.leadership_chapas c ON c.id = p.chapa_id
          WHERE p.supporter_id = sll.supporter_id
            AND c.leadership_id = p_leadership_id
        ) AS has_pledge
      FROM public.supporter_leadership_links sll
      JOIN public.supporters s ON s.id = sll.supporter_id
      WHERE sll.leadership_id = p_leadership_id
        AND sll.tenant_id = v_tenant_id
    ),
    enriched AS (
      SELECT
        l.supporter_id,
        l.is_primary,
        l.relationship_type,
        l.link_source,
        l.weight,
        l.link_created_at,
        l.supporter_name,
        l.neighborhood,
        l.normalized_neighborhood,
        l.city,
        l.last_activity_at,
        l.activity_score,
        l.engagement_status,
        l.geo_pending,
        l.geo_enrichment_failed,
        l.geo_enriched_at,
        l.cep,
        l.has_pledge,
        COALESCE(
          (
            SELECT array_agg(DISTINCT c.name ORDER BY c.name)
            FROM public.supporter_chapa_pledges p
            JOIN public.leadership_chapas c ON c.id = p.chapa_id
            WHERE p.supporter_id = l.supporter_id
              AND c.leadership_id = p_leadership_id
          ),
          ARRAY[]::text[]
        ) AS chapa_names
      FROM linked l
    ),
    filtered AS (
      SELECT *
      FROM enriched e
      WHERE (
        p_search IS NULL OR trim(p_search) = ''
        OR e.supporter_name ILIKE '%' || trim(p_search) || '%'
        OR COALESCE(e.neighborhood, '') ILIKE '%' || trim(p_search) || '%'
        OR COALESCE(e.normalized_neighborhood, '') ILIKE '%' || trim(p_search) || '%'
        OR COALESCE(e.city, '') ILIKE '%' || trim(p_search) || '%'
      )
      AND (
        v_segment = 'all'
        OR (v_segment = 'primary' AND e.is_primary)
        OR (v_segment = 'secondary' AND NOT e.is_primary)
        OR (v_segment IN ('with_pledge', 'com_pledge') AND e.has_pledge)
        OR (v_segment IN ('crm_only', 'so_crm') AND NOT e.has_pledge
            AND e.relationship_type IN ('assigned', 'legacy', 'imported'))
        OR (v_segment = 'landing' AND (
            e.link_source = 'landing'
            OR (e.relationship_type = 'pledge' AND e.link_source IN ('landing', 'system', 'migration'))
          ))
        OR (v_segment = 'manual' AND (
            e.link_source = 'manual' OR e.relationship_type = 'assigned'
          ))
        OR (v_segment = 'import' AND (
            e.link_source = 'import' OR e.relationship_type = 'imported'
          ))
        OR (v_segment = 'hot' AND e.engagement_status = 'hot')
        OR (v_segment = 'warm' AND e.engagement_status = 'warm')
        OR (v_segment = 'cold' AND e.engagement_status = 'cold')
        OR (v_segment = 'inactive' AND e.engagement_status = 'inactive')
        OR (v_segment = 'active_7d' AND e.last_activity_at >= (now() - interval '7 days'))
      )
    ),
    counts AS (
      SELECT
        (SELECT COUNT(*)::int FROM linked) AS total_in_network,
        (SELECT COUNT(*)::int FROM linked WHERE is_primary) AS primary_count,
        (SELECT COUNT(*)::int FROM linked WHERE NOT is_primary) AS secondary_count,
        (SELECT COUNT(*)::int FROM linked WHERE has_pledge) AS with_pledge_count,
        (SELECT COUNT(*)::int FROM linked WHERE NOT has_pledge
          AND relationship_type IN ('assigned', 'legacy', 'imported')) AS crm_only_count,
        (SELECT COUNT(*)::int FROM linked l
          WHERE l.link_created_at >= (now() - interval '7 days')) AS weekly_growth,
        (SELECT COALESCE(ROUND(AVG(weight)::numeric, 1), 0) FROM linked) AS avg_weight,
        (SELECT COUNT(*)::int FROM filtered) AS filtered_total,
        (SELECT COUNT(*)::int FROM linked
          WHERE last_activity_at >= (now() - interval '30 days')) AS active_supporters_30d,
        (SELECT COUNT(*)::int FROM linked WHERE engagement_status = 'hot') AS hot_supporters,
        (SELECT COUNT(*)::int FROM linked
          WHERE engagement_status IN ('cold', 'inactive')) AS inactive_supporters,
        (SELECT COALESCE(ROUND(AVG(activity_score)::numeric, 1), 0) FROM linked) AS avg_activity_score
    ),
    territory_rows AS (
      SELECT
        COALESCE(l.normalized_neighborhood, 'Sem bairro') AS neighborhood,
        COUNT(*)::int AS cnt
      FROM linked l
      GROUP BY COALESCE(l.normalized_neighborhood, 'Sem bairro')
      ORDER BY cnt DESC, neighborhood
      LIMIT 5
    )
    SELECT json_build_object(
      'summary', (
        SELECT json_build_object(
          'total_in_network', c.total_in_network,
          'primary_count', c.primary_count,
          'secondary_count', c.secondary_count,
          'with_pledge_count', c.with_pledge_count,
          'crm_only_count', c.crm_only_count,
          'weekly_growth', c.weekly_growth,
          'avg_weight', c.avg_weight,
          'filtered_total', c.filtered_total,
          'active_supporters_30d', c.active_supporters_30d,
          'hot_supporters', c.hot_supporters,
          'inactive_supporters', c.inactive_supporters,
          'avg_activity_score', c.avg_activity_score,
          'segment', v_segment
        )
        FROM counts c
      ),
      'supporters', COALESCE((
        SELECT json_agg(json_build_object(
          'supporter_id', f.supporter_id,
          'supporter_name', f.supporter_name,
          'is_primary', f.is_primary,
          'relationship_type', f.relationship_type::text,
          'source', f.link_source::text,
          'weight', f.weight,
          'neighborhood', f.neighborhood,
          'normalized_neighborhood', f.normalized_neighborhood,
          'city', f.city,
          'chapa_names', f.chapa_names,
          'created_at', f.link_created_at,
          'last_activity_at', f.last_activity_at,
          'activity_score', f.activity_score,
          'engagement_status', f.engagement_status,
          'geo_pending', f.geo_pending,
          'geo_enrichment_failed', f.geo_enrichment_failed,
          'geo_enriched_at', f.geo_enriched_at,
          'cep', f.cep
        ) ORDER BY f.is_primary DESC, f.weight DESC, f.supporter_name)
        FROM (
          SELECT * FROM filtered
          ORDER BY is_primary DESC, weight DESC, supporter_name
          LIMIT v_limit OFFSET v_offset
        ) f
      ), '[]'::json),
      'territory', COALESCE((
        SELECT json_agg(json_build_object(
          'neighborhood', tr.neighborhood,
          'count', tr.cnt,
          'pct', CASE
            WHEN (SELECT total_in_network FROM counts) > 0
            THEN ROUND((tr.cnt::numeric / (SELECT total_in_network FROM counts)) * 100, 0)::int
            ELSE 0
          END
        ) ORDER BY tr.cnt DESC, tr.neighborhood)
        FROM territory_rows tr
      ), '[]'::json),
      'growth', (
        SELECT json_build_object(
          'weekly_growth', c.weekly_growth,
          'filtered_total', c.filtered_total
        )
        FROM counts c
      )
    )
  );
END;
$$;
