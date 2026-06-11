-- Pontuação unificada: total_points = soma dos pesos dos vínculos apoiador↔liderança.
-- political_strength_score mantido como alias (compatibilidade) com o mesmo valor.

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
link_points AS (
  SELECT
    sll.leadership_id,
    COALESCE(SUM(sll.weight), 0)::int AS total_points
  FROM public.supporter_leadership_links sll
  GROUP BY sll.leadership_id
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
  COALESCE(lp.total_points, 0) AS total_points,
  COALESCE(lp.total_points, 0) AS political_strength_score
FROM base b
LEFT JOIN link_points lp ON lp.leadership_id = b.leadership_id
LEFT JOIN activity a ON a.leadership_id = b.leadership_id
LEFT JOIN top_neighborhood tn ON tn.leadership_id = b.leadership_id;

COMMENT ON VIEW public.leadership_operational_summary_v IS
  'Resumo operacional por liderança. total_points = soma de supporter_leadership_links.weight '
  '(landpage: peso da chapa; CRM manual: peso do vínculo, padrão 1). Não é projeção eleitoral oficial.';

GRANT SELECT ON public.leadership_operational_summary_v TO authenticated;
