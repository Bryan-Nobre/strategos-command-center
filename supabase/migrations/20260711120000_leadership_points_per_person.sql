-- Pontuação: 1 ponto por apoiador (não soma vote_weight de chapa).
-- Corrige casos em que uma pessoa aparecia com centenas/milhares de "pontos".

-- ========== Vínculos: peso fixo 1 por apoiador↔liderança ==========

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
    1,
    false,
    'system'::public.supporter_leadership_link_source
  FROM public.supporter_chapa_pledges p
  JOIN public.leadership_chapas c ON c.id = p.chapa_id
  WHERE p.supporter_id = p_supporter_id
  GROUP BY p.supporter_id, c.leadership_id
  ON CONFLICT (supporter_id, leadership_id) DO UPDATE SET
    weight = 1,
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

CREATE OR REPLACE FUNCTION public.upsert_supporter_leadership_links_from_chapas(
  p_supporter_id UUID,
  p_tenant_id UUID,
  p_chapa_ids UUID[],
  p_source public.supporter_leadership_link_source DEFAULT 'landing'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_chapa_ids IS NULL OR array_length(p_chapa_ids, 1) IS NULL THEN
    RETURN;
  END IF;

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
    p_tenant_id,
    p_supporter_id,
    c.leadership_id,
    'pledge'::public.supporter_leadership_relationship,
    1,
    false,
    p_source
  FROM public.leadership_chapas c
  WHERE c.id = ANY (p_chapa_ids)
    AND c.tenant_id = p_tenant_id
    AND c.is_published = true
  GROUP BY c.leadership_id
  ON CONFLICT (supporter_id, leadership_id) DO UPDATE SET
    relationship_type = 'pledge',
    weight = 1,
    source = EXCLUDED.source,
    updated_at = now();
END;
$$;

-- vote_weight da chapa não altera mais pontuação por pessoa
DROP TRIGGER IF EXISTS leadership_chapas_vote_weight_sync_links ON public.leadership_chapas;

-- Normaliza dados existentes
UPDATE public.leadership_chapas SET vote_weight = 1 WHERE vote_weight IS DISTINCT FROM 1;
UPDATE public.supporter_leadership_links SET weight = 1, updated_at = now() WHERE weight IS DISTINCT FROM 1;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT supporter_id FROM public.supporter_chapa_pledges LOOP
    PERFORM public.sync_supporter_links_from_pledges(r.supporter_id);
  END LOOP;
END $$;

-- ========== Métricas: pledged_votes = contagem de pessoas ==========

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
    COUNT(DISTINCT p.supporter_id)::int AS pledged_supporters_count
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
  COALESCE(pm.pledged_supporters_count, 0) AS pledged_votes,
  COALESCE(lm.pledge_links_count, 0) AS pledge_links_count,
  COALESCE(lm.manual_links_count, 0) AS manual_links_count,
  (SELECT COUNT(*)::int FROM public.leadership_chapas lc WHERE lc.leadership_id = l.id) AS chapa_count
FROM public.leaderships l
LEFT JOIN link_metrics lm ON lm.leadership_id = l.id AND lm.tenant_id = l.tenant_id
LEFT JOIN pledge_metrics pm ON pm.leadership_id = l.id AND pm.tenant_id = l.tenant_id;

COMMENT ON VIEW public.leadership_political_metrics_v IS
  'Métricas por liderança. pledged_votes = apoiadores distintos com pledge (1 ponto cada).';

CREATE OR REPLACE VIEW public.leadership_chapa_metrics_v
WITH (security_invoker = true) AS
SELECT
  c.tenant_id,
  c.leadership_id,
  c.id AS chapa_id,
  COUNT(p.id)::int AS pledge_count,
  COUNT(p.id)::int AS pledged_votes
FROM public.leadership_chapas c
LEFT JOIN public.supporter_chapa_pledges p ON p.chapa_id = c.id
GROUP BY c.tenant_id, c.leadership_id, c.id;

COMMENT ON VIEW public.leadership_chapa_metrics_v IS
  'Métricas por chapa: contagem de apoios (1 ponto por apoiador).';

-- ========== Resumo operacional: total_points = apoiadores na rede ==========

DROP VIEW IF EXISTS public.leadership_operational_summary_v;

CREATE VIEW public.leadership_operational_summary_v
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
    COALESCE(m.pledged_supporters_count, 0)::int AS pledged_votes,
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
activity AS (
  SELECT
    sll.leadership_id,
    COUNT(DISTINCT sll.supporter_id) FILTER (
      WHERE s.last_activity_at >= (now() - interval '30 days')
    )::int AS active_supporters_30d,
    COUNT(DISTINCT sll.supporter_id) FILTER (
      WHERE s.engagement_status = 'hot'
    )::int AS hot_supporters,
    COUNT(DISTINCT sll.supporter_id) FILTER (
      WHERE s.engagement_status IN ('cold', 'inactive')
    )::int AS inactive_supporters,
    COALESCE(ROUND(AVG(s.activity_score)::numeric, 1), 0) AS avg_activity_score
  FROM public.supporter_leadership_links sll
  JOIN public.supporters s ON s.id = sll.supporter_id
  GROUP BY sll.leadership_id
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
  COALESCE(a.active_supporters_30d, 0) AS active_supporters_30d,
  COALESCE(a.hot_supporters, 0) AS hot_supporters,
  COALESCE(a.inactive_supporters, 0) AS inactive_supporters,
  COALESCE(a.avg_activity_score, 0) AS avg_activity_score,
  CASE
    WHEN b.linked_supporters > 0
    THEN ROUND((COALESCE(a.inactive_supporters, 0)::numeric / b.linked_supporters) * 100, 0)::int
    ELSE NULL
  END AS cold_network_pct,
  tn.top_neighborhood,
  tn.top_neighborhood_count,
  CASE
    WHEN b.linked_supporters > 0 AND tn.top_neighborhood_count IS NOT NULL
    THEN ROUND((tn.top_neighborhood_count::numeric / b.linked_supporters) * 100, 0)::int
    ELSE NULL
  END AS top_neighborhood_concentration_pct,
  (b.linked_supporters > 0 AND b.manual_links_count = 0) AS landing_only_network,
  b.linked_supporters AS total_points,
  b.linked_supporters AS political_strength_score
FROM base b
LEFT JOIN activity a ON a.leadership_id = b.leadership_id
LEFT JOIN top_neighborhood tn ON tn.leadership_id = b.leadership_id;

COMMENT ON VIEW public.leadership_operational_summary_v IS
  'Resumo por liderança. total_points = apoiadores distintos na rede (1 ponto por pessoa).';

GRANT SELECT ON public.leadership_operational_summary_v TO authenticated;
