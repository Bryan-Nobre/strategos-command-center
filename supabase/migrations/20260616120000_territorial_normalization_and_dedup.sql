-- P1.1: Normalização territorial + deduplicação operacional (sem geocode/mapas)

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ========== Normalização de texto territorial ==========

CREATE OR REPLACE FUNCTION public.normalize_territory_label(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_text IS NULL OR trim(p_text) = '' THEN NULL
    ELSE initcap(
      lower(
        unaccent(regexp_replace(trim(p_text), '\s+', ' ', 'g'))
      )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_neighborhood(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT public.normalize_territory_label(p_text);
$$;

CREATE OR REPLACE FUNCTION public.normalize_city(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT public.normalize_territory_label(p_text);
$$;

COMMENT ON FUNCTION public.normalize_neighborhood IS
  'Normaliza bairro: trim, espaços, sem acento, capitalização (ex: "  ceNtro " → "Centro").';

-- ========== Normalização de contato (dedup) ==========

CREATE OR REPLACE FUNCTION public.normalize_supporter_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN p_phone IS NULL OR regexp_replace(p_phone, '\D', '', 'g') = '' THEN NULL
    ELSE right(regexp_replace(p_phone, '\D', '', 'g'), 11)
  END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_supporter_email(p_email TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(lower(trim(COALESCE(p_email, ''))), '');
$$;

-- ========== Colunas derivadas ==========

ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS normalized_neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS normalized_city TEXT,
  ADD COLUMN IF NOT EXISTS is_possible_duplicate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_group_key TEXT;

ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS normalized_neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS normalized_city TEXT;

COMMENT ON COLUMN public.supporters.normalized_neighborhood IS
  'Derivado de neighborhood via trigger; usado em ranking/filtros territoriais.';
COMMENT ON COLUMN public.supporters.is_possible_duplicate IS
  'Soft dedup: mesmo telefone/e-mail no tenant; merge manual futuro.';
COMMENT ON COLUMN public.supporters.duplicate_group_key IS
  'Chave estável do grupo de possíveis duplicatas (tenant + contato normalizado).';

-- ========== Triggers de normalização territorial ==========

CREATE OR REPLACE FUNCTION public.trg_set_supporter_territory_normalized()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.normalized_neighborhood := public.normalize_neighborhood(NEW.neighborhood);
  NEW.normalized_city := public.normalize_city(NEW.city);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supporters_territory_normalized ON public.supporters;
CREATE TRIGGER supporters_territory_normalized
  BEFORE INSERT OR UPDATE OF neighborhood, city ON public.supporters
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_supporter_territory_normalized();

CREATE OR REPLACE FUNCTION public.trg_set_demand_territory_normalized()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.normalized_neighborhood := public.normalize_neighborhood(NEW.neighborhood);
  NEW.normalized_city := public.normalize_city(NEW.requester_city);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS demands_territory_normalized ON public.demands;
CREATE TRIGGER demands_territory_normalized
  BEFORE INSERT OR UPDATE OF neighborhood, requester_city ON public.demands
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_demand_territory_normalized();

-- Backfill
UPDATE public.supporters
SET
  normalized_neighborhood = public.normalize_neighborhood(neighborhood),
  normalized_city = public.normalize_city(city);

UPDATE public.demands
SET
  normalized_neighborhood = public.normalize_neighborhood(neighborhood),
  normalized_city = public.normalize_city(requester_city);

-- ========== Índices territoriais ==========

DROP INDEX IF EXISTS public.idx_supporters_tenant_neighborhood;

CREATE INDEX IF NOT EXISTS idx_supporters_tenant_normalized_neighborhood
  ON public.supporters(tenant_id, normalized_neighborhood)
  WHERE normalized_neighborhood IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supporters_tenant_normalized_city
  ON public.supporters(tenant_id, normalized_city)
  WHERE normalized_city IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_demands_tenant_normalized_neighborhood
  ON public.demands(tenant_id, normalized_neighborhood)
  WHERE normalized_neighborhood IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supporters_tenant_phone_normalized
  ON public.supporters(tenant_id, (public.normalize_supporter_phone(phone)))
  WHERE public.normalize_supporter_phone(phone) IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supporters_tenant_email_normalized
  ON public.supporters(tenant_id, (public.normalize_supporter_email(email)))
  WHERE public.normalize_supporter_email(email) IS NOT NULL;

-- ========== Deduplicação soft ==========

CREATE OR REPLACE FUNCTION public.supporter_duplicate_group_key(
  p_tenant_id UUID,
  p_phone TEXT,
  p_email TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN public.normalize_supporter_phone(p_phone) IS NULL
      AND public.normalize_supporter_email(p_email) IS NULL
    THEN NULL
    ELSE md5(
      p_tenant_id::text || '|'
      || COALESCE(public.normalize_supporter_phone(p_phone), '') || '|'
      || COALESCE(public.normalize_supporter_email(p_email), '')
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.find_possible_duplicate_supporter(
  p_tenant_id UUID,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_email TEXT;
  v_id UUID;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_phone := public.normalize_supporter_phone(p_phone);
  v_email := public.normalize_supporter_email(p_email);

  IF v_phone IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT s.id INTO v_id
  FROM public.supporters s
  WHERE s.tenant_id = p_tenant_id
    AND (p_exclude_id IS NULL OR s.id <> p_exclude_id)
    AND (
      (v_phone IS NOT NULL AND public.normalize_supporter_phone(s.phone) = v_phone)
      OR (v_email IS NOT NULL AND public.normalize_supporter_email(s.email) = v_email)
    )
  ORDER BY s.created_at ASC
  LIMIT 1;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.supporter_is_crm_managed(p_row public.supporters)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    p_row.source <> 'landing'::public.supporter_source
    OR p_row.created_by IS NOT NULL
    OR p_row.updated_at > p_row.created_at + interval '2 seconds';
$$;

CREATE OR REPLACE FUNCTION public.refresh_supporter_duplicate_flags(p_supporter_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.supporters%ROWTYPE;
  v_phone TEXT;
  v_email TEXT;
  v_group_key TEXT;
  v_match_count INT;
BEGIN
  IF p_supporter_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_row FROM public.supporters WHERE id = p_supporter_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_phone := public.normalize_supporter_phone(v_row.phone);
  v_email := public.normalize_supporter_email(v_row.email);
  v_group_key := public.supporter_duplicate_group_key(v_row.tenant_id, v_row.phone, v_row.email);

  IF v_phone IS NULL AND v_email IS NULL THEN
    UPDATE public.supporters
    SET is_possible_duplicate = false, duplicate_group_key = NULL
    WHERE id = p_supporter_id;
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO v_match_count
  FROM public.supporters s
  WHERE s.tenant_id = v_row.tenant_id
    AND (
      (v_phone IS NOT NULL AND public.normalize_supporter_phone(s.phone) = v_phone)
      OR (v_email IS NOT NULL AND public.normalize_supporter_email(s.email) = v_email)
    );

  UPDATE public.supporters s
  SET
    duplicate_group_key = v_group_key,
    is_possible_duplicate = v_match_count > 1
  WHERE s.tenant_id = v_row.tenant_id
    AND (
      (v_phone IS NOT NULL AND public.normalize_supporter_phone(s.phone) = v_phone)
      OR (v_email IS NOT NULL AND public.normalize_supporter_email(s.email) = v_email)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_supporters_refresh_duplicate_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_supporter_duplicate_flags(NEW.id);
  IF TG_OP = 'UPDATE' AND (
    OLD.phone IS DISTINCT FROM NEW.phone
    OR OLD.email IS DISTINCT FROM NEW.email
    OR OLD.tenant_id IS DISTINCT FROM NEW.tenant_id
  ) THEN
    PERFORM public.refresh_supporter_duplicate_flags(OLD.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supporters_duplicate_flags ON public.supporters;
CREATE TRIGGER supporters_duplicate_flags
  AFTER INSERT OR UPDATE OF phone, email, tenant_id ON public.supporters
  FOR EACH ROW EXECUTE FUNCTION public.trg_supporters_refresh_duplicate_flags();

-- Backfill flags
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.supporters LOOP
    PERFORM public.refresh_supporter_duplicate_flags(r.id);
  END LOOP;
END $$;

-- ========== Landing: reutilizar cadastro existente ==========

CREATE OR REPLACE FUNCTION public.register_supporter_from_landing(
  p_slug TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_interest TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_chapa_ids UUID[] DEFAULT NULL,
  p_email TEXT DEFAULT NULL
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

  v_supporter_id := public.find_possible_duplicate_supporter(
    v_tenant_id,
    p_phone,
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
        WHEN v_crm_managed THEN COALESCE(NULLIF(trim(s.phone), ''), NULLIF(trim(p_phone), ''))
        ELSE COALESCE(NULLIF(trim(p_phone), ''), s.phone)
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
      interest = CASE
        WHEN v_crm_managed THEN COALESCE(NULLIF(trim(s.interest), ''), NULLIF(trim(p_interest), ''))
        ELSE COALESCE(NULLIF(trim(p_interest), ''), s.interest)
      END,
      notes = CASE
        WHEN v_crm_managed THEN COALESCE(NULLIF(trim(s.notes), ''), NULLIF(trim(p_notes), ''))
        ELSE COALESCE(NULLIF(trim(p_notes), ''), s.notes)
      END,
      updated_at = now()
    WHERE s.id = v_supporter_id;
    PERFORM public.set_syncing_leadership_mirror(false);
  ELSE
    PERFORM public.assert_tenant_supporter_capacity(v_tenant_id, 1);

    PERFORM public.set_syncing_leadership_mirror(true);
    INSERT INTO public.supporters (
      tenant_id, name, phone, email, neighborhood, city,
      status, support_level, notes, interest, source
    ) VALUES (
      v_tenant_id,
      trim(p_name),
      NULLIF(trim(p_phone), ''),
      public.normalize_supporter_email(p_email),
      NULLIF(trim(p_neighborhood), ''),
      NULLIF(trim(p_city), ''),
      'interessado',
      'indeciso',
      NULLIF(trim(p_notes), ''),
      NULLIF(trim(p_interest), ''),
      'landing'
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

GRANT EXECUTE ON FUNCTION public.find_possible_duplicate_supporter(uuid, text, text, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.find_possible_duplicate_supporter(uuid, text, text, uuid) FROM PUBLIC, anon;

-- ========== Views/RPCs: usar normalized_neighborhood ==========

CREATE OR REPLACE VIEW public.leadership_operational_summary_v
WITH (security_invoker = true) AS
WITH base AS (
  SELECT
    l.tenant_id,
    l.id AS leadership_id,
    l.name,
    l.region AS leadership_region,
    l.estimated_votes,
    l.actor_type,
    l.supporter_id,
    l.created_at,
    COALESCE(m.linked_supporters_count, 0)::int AS linked_supporters,
    COALESCE(m.primary_supporters_count, 0)::int AS primary_supporters,
    GREATEST(
      COALESCE(m.linked_supporters_count, 0) - COALESCE(m.primary_supporters_count, 0),
      0
    )::int AS secondary_supporters,
    COALESCE(m.pledged_votes, 0)::int AS pledged_votes,
    COALESCE(m.pledged_supporters_count, 0)::int AS pledged_supporters_count,
    COALESCE(m.chapa_count, 0)::int AS chapa_count,
    COALESCE(m.pledge_links_count, 0)::int AS pledge_links_count,
    COALESCE(m.manual_links_count, 0)::int AS manual_links_count,
    (
      SELECT COUNT(*)::int
      FROM public.supporter_leadership_links sll
      WHERE sll.leadership_id = l.id
        AND sll.created_at >= (now() - interval '7 days')
    ) AS weekly_growth
  FROM public.leaderships l
  LEFT JOIN public.leadership_political_metrics_v m
    ON m.leadership_id = l.id AND m.tenant_id = l.tenant_id
),
territory AS (
  SELECT
    sll.leadership_id,
    COALESCE(
      s.normalized_neighborhood,
      public.normalize_neighborhood(s.neighborhood),
      'Sem bairro'
    ) AS neighborhood,
    COUNT(DISTINCT sll.supporter_id)::int AS supporter_count
  FROM public.supporter_leadership_links sll
  JOIN public.supporters s ON s.id = sll.supporter_id
  GROUP BY sll.leadership_id, 2
),
top_neighborhood AS (
  SELECT DISTINCT ON (leadership_id)
    leadership_id,
    neighborhood AS top_neighborhood,
    supporter_count AS top_neighborhood_count
  FROM territory
  ORDER BY leadership_id, supporter_count DESC, neighborhood ASC
)
SELECT
  b.tenant_id,
  b.leadership_id,
  b.name,
  b.leadership_region,
  b.estimated_votes,
  b.actor_type,
  b.supporter_id,
  b.created_at,
  b.linked_supporters,
  b.primary_supporters,
  b.secondary_supporters,
  b.pledged_votes,
  b.pledged_supporters_count,
  b.chapa_count,
  b.pledge_links_count,
  b.manual_links_count,
  b.weekly_growth,
  tn.top_neighborhood,
  tn.top_neighborhood_count,
  CASE
    WHEN b.linked_supporters > 0 AND tn.top_neighborhood_count IS NOT NULL
    THEN ROUND((tn.top_neighborhood_count::numeric / b.linked_supporters) * 100, 0)::int
    ELSE NULL
  END AS top_neighborhood_concentration_pct,
  (b.linked_supporters > 0 AND b.manual_links_count = 0) AS landing_only_network,
  (
    (b.primary_supporters * 5)
    + (b.secondary_supporters * 2)
    + b.pledged_votes
    + (b.weekly_growth * 3)
  )::int AS political_strength_score
FROM base b
LEFT JOIN top_neighborhood tn ON tn.leadership_id = b.leadership_id;

-- Recreate operational detail RPC (territory on normalized)
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
        s.created_at AS supporter_created_at,
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
        l.supporter_created_at,
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
        ) AS chapa_names,
        (
          SELECT MAX(a.created_at)
          FROM public.activities a
          WHERE a.tenant_id = v_tenant_id
            AND a.entity_type = 'supporter'
            AND a.entity_id = l.supporter_id
        ) AS last_activity_at
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
        (SELECT COUNT(*)::int FROM filtered) AS filtered_total
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
          'last_activity_at', f.last_activity_at
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
