-- BLOCO 3.1: resumo operacional por liderança + actor_type (sem UI de tipo ainda)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leadership_actor_type') THEN
    CREATE TYPE public.leadership_actor_type AS ENUM (
      'coordinator',
      'candidate',
      'regional_leader',
      'grassroots',
      'influencer',
      'volunteer_hub'
    );
  END IF;
END $$;

ALTER TABLE public.leaderships
  ADD COLUMN IF NOT EXISTS actor_type public.leadership_actor_type NOT NULL DEFAULT 'regional_leader';

COMMENT ON COLUMN public.leaderships.actor_type IS
  'Papel político do ator (coordenador, candidato, etc.). Default regional_leader; UI futura.';

CREATE INDEX IF NOT EXISTS idx_sll_leadership_created
  ON public.supporter_leadership_links(tenant_id, leadership_id, created_at DESC);

-- Score operacional heurístico (NÃO é projeção eleitoral oficial; pode evoluir).
-- score = (primary * 5) + (secondary * 2) + pledged_votes + (weekly_growth * 3)
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
    NULLIF(trim(s.neighborhood), '') AS neighborhood,
    COUNT(DISTINCT sll.supporter_id)::int AS supporter_count
  FROM public.supporter_leadership_links sll
  JOIN public.supporters s ON s.id = sll.supporter_id
  WHERE NULLIF(trim(s.neighborhood), '') IS NOT NULL
  GROUP BY sll.leadership_id, NULLIF(trim(s.neighborhood), '')
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

COMMENT ON VIEW public.leadership_operational_summary_v IS
  'Resumo operacional por liderança. political_strength_score é heurística interna '
  '(primários×5 + secundários×2 + pledged_votes + crescimento_7d×3); não é projeção eleitoral oficial.';

GRANT SELECT ON public.leadership_operational_summary_v TO authenticated;
