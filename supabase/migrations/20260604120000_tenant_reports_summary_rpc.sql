-- Central analítica: resumo consolidado por período e filtros (RLS via membership).

CREATE OR REPLACE FUNCTION public.get_tenant_reports_summary(
  p_tenant_id UUID,
  p_from DATE,
  p_to DATE,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_support_level TEXT DEFAULT NULL,
  p_leadership_id UUID DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INT;
  v_prev_from DATE;
  v_prev_to DATE;
  v_summary JSON;
  v_pulse JSON;
  v_territories JSON;
  v_funnel JSON;
  v_demands JSON;
  v_growth JSON;
  v_distribution JSON;
  v_export_counts JSON;
  v_filter_options JSON;
  v_polls JSON;
BEGIN
  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
    RAISE EXCEPTION 'Período inválido';
  END IF;

  v_days := (p_to - p_from) + 1;
  v_prev_to := p_from - 1;
  v_prev_from := v_prev_to - (v_days - 1);

  -- Resumo da base (filtros de apoiador; demandas com filtro de responsável quando aplicável)
  SELECT json_build_object(
    'total_supporters', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
        AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    ),
    'strong_support', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND s.support_level = 'forte'
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    ),
    'undecided', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND (s.support_level = 'indeciso' OR s.status = 'indeciso')
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    ),
    'opposition', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND s.status = 'oposicao'
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    ),
    'leaderships', (SELECT count(*)::int FROM public.leaderships WHERE tenant_id = p_tenant_id),
    'open_demands', (
      SELECT count(*)::int FROM public.demands d
      WHERE d.tenant_id = p_tenant_id AND d.status <> 'resolvido'
        AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(d.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
    ),
    'resolved_in_period', (
      SELECT count(*)::int FROM public.demands d
      WHERE d.tenant_id = p_tenant_id AND d.status = 'resolvido'
        AND (d.updated_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
        AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)
    ),
    'new_supporters_in_period', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
        AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    ),
    'prev_new_supporters', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_prev_from AND v_prev_to
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
        AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    )
  ) INTO v_summary;

  SELECT json_build_object(
    'new_supporters', (v_summary->>'new_supporters_in_period')::int,
    'growth_pct', public.dashboard_pct_change(
      (v_summary->>'new_supporters_in_period')::int,
      (v_summary->>'prev_new_supporters')::int
    ),
    'resolved_demands', (v_summary->>'resolved_in_period')::int,
    'critical_territories', 0
  ) INTO v_pulse;

  -- Territórios (mesma lógica do dashboard, com filtros de apoiador)
  WITH supporter_agg AS (
    SELECT
      COALESCE(NULLIF(trim(s.neighborhood), ''), 'Sem bairro') AS neighborhood,
      count(*)::int AS supporters,
      count(*) FILTER (WHERE s.support_level = 'forte')::int AS strong,
      count(*) FILTER (WHERE s.support_level = 'indeciso' OR s.status = 'indeciso')::int AS undecided,
      count(*) FILTER (WHERE s.status = 'oposicao')::int AS opposition
    FROM public.supporters s
    WHERE s.tenant_id = p_tenant_id
      AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
      AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
      AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
      AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
      AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
      AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    GROUP BY 1
  ),
  demand_agg AS (
    SELECT
      COALESCE(NULLIF(trim(d.neighborhood), ''), 'Sem bairro') AS neighborhood,
      count(*) FILTER (WHERE d.status <> 'resolvido')::int AS open_demands
    FROM public.demands d
    WHERE d.tenant_id = p_tenant_id
      AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)
    GROUP BY 1
  ),
  merged AS (
    SELECT sa.*, COALESCE(da.open_demands, 0)::int AS open_demands
    FROM supporter_agg sa
    LEFT JOIN demand_agg da USING (neighborhood)
    WHERE sa.supporters > 0
  ),
  scored AS (
    SELECT
      neighborhood, supporters, open_demands,
      round(strong::numeric / greatest(supporters, 1) * 100)::int AS strong_support_pct,
      round(undecided::numeric / greatest(supporters, 1) * 100)::int AS undecided_pct,
      round(opposition::numeric / greatest(supporters, 1) * 100)::int AS opposition_pct,
      (
        round(strong::numeric / greatest(supporters, 1) * 100)::int
        - round(undecided::numeric / greatest(supporters, 1) * 100)::int
        - round(opposition::numeric / greatest(supporters, 1) * 100)::int
        - open_demands * 3
      )::int AS score
    FROM merged
  ),
  bounds AS (
    SELECT COALESCE(min(score), 0) AS min_score, COALESCE(max(score), 0) AS max_score FROM scored
  ),
  enriched AS (
    SELECT
      s.*,
      CASE
        WHEN (SELECT max_score - min_score FROM bounds) <= 0 THEN 50
        ELSE round(((s.score - b.min_score)::numeric / greatest(b.max_score - b.min_score, 1)) * 100)::int
      END AS display_score
    FROM scored s
    CROSS JOIN bounds b
  )
  SELECT json_build_object(
    'critical', COALESCE((
      SELECT json_agg(row ORDER BY row->>'display_score' ASC)
      FROM (
        SELECT json_build_object(
          'neighborhood', e.neighborhood,
          'supporters', e.supporters,
          'strong_support_pct', e.strong_support_pct,
          'undecided_pct', e.undecided_pct,
          'opposition_pct', e.opposition_pct,
          'open_demands', e.open_demands,
          'score', e.score,
          'display_score', e.display_score,
          'risk_level', CASE
            WHEN e.display_score <= 33 THEN 'critico'
            WHEN e.display_score >= 67 THEN 'promissor'
            ELSE 'atencao'
          END
        ) AS row
        FROM enriched e
        ORDER BY e.display_score ASC
        LIMIT 5
      ) sub
    ), '[]'::json),
    'promising', COALESCE((
      SELECT json_agg(row ORDER BY (row->>'display_score')::int DESC)
      FROM (
        SELECT json_build_object(
          'neighborhood', e.neighborhood,
          'supporters', e.supporters,
          'strong_support_pct', e.strong_support_pct,
          'undecided_pct', e.undecided_pct,
          'opposition_pct', e.opposition_pct,
          'open_demands', e.open_demands,
          'score', e.score,
          'display_score', e.display_score,
          'risk_level', CASE
            WHEN e.display_score <= 33 THEN 'critico'
            WHEN e.display_score >= 67 THEN 'promissor'
            ELSE 'atencao'
          END
        ) AS row
        FROM enriched e
        ORDER BY e.display_score DESC
        LIMIT 5
      ) sub
    ), '[]'::json),
    'critical_count', (SELECT count(*)::int FROM enriched WHERE display_score <= 33)
  ) INTO v_territories;

  v_pulse := jsonb_set(v_pulse::jsonb, '{critical_territories}', to_jsonb((v_territories->>'critical_count')::int))::json;

  -- Funil político (base filtrada)
  SELECT json_build_object(
    'interessado', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND s.status = 'interessado'
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    ),
    'apoiador', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND s.status = 'apoiador'
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    ),
    'apoio_forte', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND s.support_level = 'forte'
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    ),
    'lideranca', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND s.status = 'lideranca'
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    ),
    'new_in_period', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
        AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
        AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
        AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
        AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    )
  ) INTO v_funnel;

  -- Demandas operacionais
  SELECT json_build_object(
    'by_status', COALESCE((
      SELECT json_object_agg(status::text, cnt)
      FROM (
        SELECT d.status, count(*)::int AS cnt
        FROM public.demands d
        WHERE d.tenant_id = p_tenant_id
          AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)
          AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(d.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
        GROUP BY d.status
      ) x
    ), '{}'::json),
    'unassigned', (
      SELECT count(*)::int FROM public.demands d
      WHERE d.tenant_id = p_tenant_id AND d.status <> 'resolvido' AND d.assigned_to IS NULL
        AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(d.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
    ),
    'avg_resolution_days', COALESCE((
      SELECT round(avg(
        EXTRACT(epoch FROM (d.updated_at - d.created_at)) / 86400
      ))::int
      FROM public.demands d
      WHERE d.tenant_id = p_tenant_id AND d.status = 'resolvido'
        AND (d.updated_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
        AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)
    ), 0),
    'by_category', COALESCE((
      SELECT json_agg(json_build_object('category', category::text, 'count', cnt) ORDER BY cnt DESC)
      FROM (
        SELECT d.category, count(*)::int AS cnt
        FROM public.demands d
        WHERE d.tenant_id = p_tenant_id
          AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)
        GROUP BY d.category
        LIMIT 6
      ) c
    ), '[]'::json)
  ) INTO v_demands;

  -- Crescimento real da base (CRM)
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'label', to_char(bucket, 'YYYY-MM'),
        'apoiadores', cnt
      )
      ORDER BY bucket
    ),
    '[]'::json
  ) INTO v_growth
  FROM (
    SELECT date_trunc('month', (s.created_at AT TIME ZONE 'America/Sao_Paulo'))::date AS bucket,
           count(*)::int AS cnt
    FROM public.supporters s
    WHERE s.tenant_id = p_tenant_id
      AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
      AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
      AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
      AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
      AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
      AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
      AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
    GROUP BY 1
  ) g;

  SELECT json_build_object(
    'by_support_level', COALESCE((
      SELECT json_object_agg(support_level::text, cnt)
      FROM (
        SELECT s.support_level, count(*)::int AS cnt
        FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id
          AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
          AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
          AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
          AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
          AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
        GROUP BY s.support_level
      ) sl
    ), '{}'::json),
    'by_status', COALESCE((
      SELECT json_object_agg(status::text, cnt)
      FROM (
        SELECT s.status, count(*)::int AS cnt
        FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id
          AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')
          AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
          AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
          AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
          AND (p_leadership_id IS NULL OR s.leadership_id = p_leadership_id)
        GROUP BY s.status
      ) st
    ), '{}'::json)
  ) INTO v_distribution;

  SELECT json_build_object(
    'supporters', (v_summary->>'total_supporters')::int,
    'demands', (
      SELECT count(*)::int FROM public.demands d
      WHERE d.tenant_id = p_tenant_id
        AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)
    ),
    'leaderships', (v_summary->>'leaderships')::int,
    'territories', (SELECT count(*)::int FROM (
      SELECT 1 FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND COALESCE(trim(s.neighborhood), '') <> ''
      GROUP BY trim(s.neighborhood)
    ) t),
    'agenda', (
      SELECT count(*)::int FROM public.agenda_events a
      WHERE a.tenant_id = p_tenant_id
        AND (a.event_date BETWEEN p_from AND p_to)
    ),
    'activities', (
      SELECT count(*)::int FROM public.activities a
      WHERE a.tenant_id = p_tenant_id
        AND (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_from AND p_to
    )
  ) INTO v_export_counts;

  SELECT json_build_object(
    'neighborhoods', COALESCE((
      SELECT json_agg(DISTINCT trim(s.neighborhood) ORDER BY trim(s.neighborhood))
      FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND trim(COALESCE(s.neighborhood, '')) <> ''
    ), '[]'::json),
    'cities', COALESCE((
      SELECT json_agg(DISTINCT trim(s.city) ORDER BY trim(s.city))
      FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND trim(COALESCE(s.city, '')) <> ''
    ), '[]'::json),
    'sources', COALESCE((
      SELECT json_agg(DISTINCT s.source::text ORDER BY s.source::text)
      FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND s.source IS NOT NULL
    ), '[]'::json),
    'leaderships', COALESCE((
      SELECT json_agg(json_build_object('id', l.id, 'name', l.name) ORDER BY l.name)
      FROM public.leaderships l WHERE l.tenant_id = p_tenant_id
    ), '[]'::json),
    'assignees', COALESCE((
      SELECT json_agg(json_build_object('id', tm.user_id, 'name', COALESCE(p.full_name, 'Membro')) ORDER BY p.full_name)
      FROM public.tenant_members tm
      JOIN public.profiles p ON p.id = tm.user_id
      WHERE tm.tenant_id = p_tenant_id
    ), '[]'::json)
  ) INTO v_filter_options;

  SELECT COALESCE(
    json_agg(
      json_build_object(
        'type', ps.snapshot_type,
        'title', ps.title,
        'updated_at', ps.recorded_at
      )
    ),
    '[]'::json
  ) INTO v_polls
  FROM public.poll_snapshots ps
  WHERE ps.tenant_id = p_tenant_id
    AND ps.snapshot_type IN ('intencao_voto', 'aprovacao_bairro', 'crescimento_apoiadores');

  RETURN json_build_object(
    'period', json_build_object('from', p_from, 'to', p_to, 'days', v_days, 'prev_from', v_prev_from, 'prev_to', v_prev_to),
    'pulse', v_pulse,
    'summary', v_summary,
    'territories', v_territories,
    'funnel', v_funnel,
    'demands', v_demands,
    'growth_series', v_growth,
    'distribution', v_distribution,
    'export_counts', v_export_counts,
    'filter_options', v_filter_options,
    'poll_meta', v_polls
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_reports_summary(
  uuid, date, date, text, text, text, text, text, uuid, uuid
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_reports_summary(
  uuid, date, date, text, text, text, text, text, uuid, uuid
) TO authenticated;
