-- P1.2: RPC rede liderança com engagement_status / activity_score do apoiador

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
          'engagement_status', f.engagement_status
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
