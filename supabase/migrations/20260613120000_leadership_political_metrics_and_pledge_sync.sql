-- BLOCO 2: métricas políticas server-side + sincronização canônica pledge → links

-- Filtro de relatórios: apoiador com qualquer vínculo à liderança (não só espelho primário)
CREATE OR REPLACE FUNCTION public.supporter_matches_leadership_filter(
  p_supporter_id UUID,
  p_leadership_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_leadership_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.supporter_leadership_links l
      WHERE l.supporter_id = p_supporter_id
        AND l.leadership_id = p_leadership_id
    );
$$;

COMMENT ON FUNCTION public.supporter_matches_leadership_filter IS
  'Filtro de relatórios por vínculo político (supporter_leadership_links), não apenas supporters.leadership_id.';

-- Sincroniza vínculos pledge a partir de supporter_chapa_pledges (fonte canônica de chapas)
CREATE OR REPLACE FUNCTION public.sync_supporter_links_from_pledges(p_supporter_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  IF p_supporter_id IS NULL THEN
    RETURN;
  END IF;

  SELECT tenant_id INTO v_tenant_id FROM public.supporters WHERE id = p_supporter_id;
  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM set_config('app.bulk_leadership_link_sync', 'on', true);

  -- Remove vínculos pledge órfãos (sem pledges ativos para a liderança)
  DELETE FROM public.supporter_leadership_links sll
  WHERE sll.supporter_id = p_supporter_id
    AND sll.relationship_type = 'pledge'
    AND NOT EXISTS (
      SELECT 1
      FROM public.supporter_chapa_pledges p
      JOIN public.leadership_chapas c ON c.id = p.chapa_id
      WHERE p.supporter_id = sll.supporter_id
        AND c.leadership_id = sll.leadership_id
    );

  -- Upsert agregado por liderança (weight = soma exata dos vote_weight das chapas apoiadas)
  INSERT INTO public.supporter_leadership_links (
    tenant_id,
    supporter_id,
    leadership_id,
    relationship_type,
    weight,
    is_primary,
    source
  )
  SELECT
    v_tenant_id,
    p.supporter_id,
    c.leadership_id,
    'pledge'::public.supporter_leadership_relationship,
    SUM(c.vote_weight)::int,
    false,
    'system'::public.supporter_leadership_link_source
  FROM public.supporter_chapa_pledges p
  JOIN public.leadership_chapas c ON c.id = p.chapa_id
  WHERE p.supporter_id = p_supporter_id
  GROUP BY p.supporter_id, c.leadership_id
  ON CONFLICT (supporter_id, leadership_id) DO UPDATE SET
    weight = EXCLUDED.weight,
    relationship_type = CASE
      WHEN public.supporter_leadership_links.relationship_type IN ('assigned', 'legacy')
        THEN public.supporter_leadership_links.relationship_type
      ELSE 'pledge'::public.supporter_leadership_relationship
    END,
    source = CASE
      WHEN public.supporter_leadership_links.relationship_type IN ('assigned', 'legacy')
        THEN public.supporter_leadership_links.source
      ELSE 'system'::public.supporter_leadership_link_source
    END,
    updated_at = now();

  PERFORM set_config('app.bulk_leadership_link_sync', 'off', true);

  PERFORM public.recompute_supporter_leadership_primary(p_supporter_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_pledges_sync_supporter_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supporter_id UUID;
BEGIN
  IF COALESCE(current_setting('app.defer_pledge_link_sync', true), '') = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_supporter_id := COALESCE(NEW.supporter_id, OLD.supporter_id);
  PERFORM public.sync_supporter_links_from_pledges(v_supporter_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS supporter_chapa_pledges_sync_links ON public.supporter_chapa_pledges;
CREATE TRIGGER supporter_chapa_pledges_sync_links
  AFTER INSERT OR UPDATE OR DELETE ON public.supporter_chapa_pledges
  FOR EACH ROW EXECUTE FUNCTION public.trg_pledges_sync_supporter_links();

-- Recalcula weights quando vote_weight da chapa muda
CREATE OR REPLACE FUNCTION public.trg_chapa_vote_weight_sync_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  IF NEW.vote_weight IS NOT DISTINCT FROM OLD.vote_weight THEN
    RETURN NEW;
  END IF;

  FOR r IN
    SELECT DISTINCT p.supporter_id
    FROM public.supporter_chapa_pledges p
    WHERE p.chapa_id = NEW.id
  LOOP
    PERFORM public.sync_supporter_links_from_pledges(r.supporter_id);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leadership_chapas_vote_weight_sync_links ON public.leadership_chapas;
CREATE TRIGGER leadership_chapas_vote_weight_sync_links
  AFTER UPDATE OF vote_weight ON public.leadership_chapas
  FOR EACH ROW EXECUTE FUNCTION public.trg_chapa_vote_weight_sync_links();

-- Landing: usar sync canônico após pledges
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

  PERFORM public.assert_tenant_supporter_capacity(v_tenant_id, 1);

  PERFORM public.set_syncing_leadership_mirror(true);
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
  PERFORM public.set_syncing_leadership_mirror(false);

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

  PERFORM public.log_activity(
    v_tenant_id,
    'Novo apoiador via landing: ' || trim(p_name),
    'supporter',
    v_supporter_id
  );

  RETURN v_supporter_id;
END;
$$;

-- ========== Views de métricas (realtime; security_invoker = RLS das tabelas base) ==========

CREATE OR REPLACE VIEW public.leadership_political_metrics_v
WITH (security_invoker = true) AS
WITH link_metrics AS (
  SELECT
    sll.tenant_id,
    sll.leadership_id,
    COUNT(*)::int AS total_relationships,
    COUNT(DISTINCT sll.supporter_id)::int AS unique_supporters,
    COUNT(DISTINCT sll.supporter_id) FILTER (WHERE sll.is_primary)::int AS primary_supporters_count,
    COUNT(*) FILTER (WHERE sll.relationship_type = 'pledge')::int AS pledge_links_count,
    COUNT(*) FILTER (
      WHERE sll.relationship_type IN ('assigned', 'legacy', 'imported')
    )::int AS manual_links_count
  FROM public.supporter_leadership_links sll
  GROUP BY sll.tenant_id, sll.leadership_id
),
pledge_metrics AS (
  SELECT
    c.tenant_id,
    c.leadership_id,
    COUNT(DISTINCT p.supporter_id)::int AS pledged_supporters_count,
    COALESCE(SUM(c.vote_weight), 0)::int AS pledged_votes
  FROM public.leadership_chapas c
  JOIN public.supporter_chapa_pledges p ON p.chapa_id = c.id
  GROUP BY c.tenant_id, c.leadership_id
)
SELECT
  l.tenant_id,
  l.id AS leadership_id,
  COALESCE(lm.total_relationships, 0) AS total_relationships,
  COALESCE(lm.unique_supporters, 0) AS unique_supporters,
  COALESCE(lm.unique_supporters, 0) AS linked_supporters_count,
  COALESCE(lm.primary_supporters_count, 0) AS primary_supporters_count,
  COALESCE(pm.pledged_supporters_count, 0) AS pledged_supporters_count,
  COALESCE(pm.pledged_votes, 0) AS pledged_votes,
  COALESCE(lm.pledge_links_count, 0) AS pledge_links_count,
  COALESCE(lm.manual_links_count, 0) AS manual_links_count,
  (SELECT COUNT(*)::int FROM public.leadership_chapas lc WHERE lc.leadership_id = l.id) AS chapa_count
FROM public.leaderships l
LEFT JOIN link_metrics lm ON lm.leadership_id = l.id AND lm.tenant_id = l.tenant_id
LEFT JOIN pledge_metrics pm ON pm.leadership_id = l.id AND pm.tenant_id = l.tenant_id;

COMMENT ON VIEW public.leadership_political_metrics_v IS
  'Métricas políticas por liderança (realtime). linked/unique = apoiadores distintos com vínculo. pledged_votes = soma vote_weight por pledge.';

CREATE OR REPLACE VIEW public.leadership_chapa_metrics_v
WITH (security_invoker = true) AS
SELECT
  c.tenant_id,
  c.leadership_id,
  c.id AS chapa_id,
  COUNT(p.id)::int AS pledge_count,
  COALESCE(SUM(c.vote_weight), 0)::int AS pledged_votes
FROM public.leadership_chapas c
LEFT JOIN public.supporter_chapa_pledges p ON p.chapa_id = c.id
GROUP BY c.tenant_id, c.leadership_id, c.id;

COMMENT ON VIEW public.leadership_chapa_metrics_v IS
  'Métricas por chapa (realtime): apoios declarados e votos ponderados.';

CREATE OR REPLACE VIEW public.supporter_political_summary_v
WITH (security_invoker = true) AS
SELECT
  s.id AS supporter_id,
  s.tenant_id,
  s.leadership_id AS primary_leadership_id,
  pl.name AS primary_leadership_name,
  COUNT(DISTINCT sll.leadership_id)::int AS link_count,
  COALESCE(
    array_agg(DISTINCT ld.name ORDER BY ld.name) FILTER (WHERE ld.name IS NOT NULL),
    '{}'::text[]
  ) AS leadership_names,
  COALESCE(
    array_agg(DISTINCT sll.leadership_id::text ORDER BY sll.leadership_id::text)
      FILTER (WHERE sll.leadership_id IS NOT NULL),
    '{}'::text[]
  ) AS leadership_ids,
  BOOL_OR(sll.is_primary) AS has_primary_link
FROM public.supporters s
LEFT JOIN public.leaderships pl ON pl.id = s.leadership_id
LEFT JOIN public.supporter_leadership_links sll ON sll.supporter_id = s.id
LEFT JOIN public.leaderships ld ON ld.id = sll.leadership_id
GROUP BY s.id, s.tenant_id, s.leadership_id, pl.name;

COMMENT ON VIEW public.supporter_political_summary_v IS
  'Resumo político por apoiador para listas/filtros (realtime).';

GRANT SELECT ON public.leadership_political_metrics_v TO authenticated;
GRANT SELECT ON public.leadership_chapa_metrics_v TO authenticated;
GRANT SELECT ON public.supporter_political_summary_v TO authenticated;
GRANT EXECUTE ON FUNCTION public.supporter_matches_leadership_filter(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_supporter_links_from_pledges(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_supporter_links_from_pledges(uuid) FROM PUBLIC, anon;
