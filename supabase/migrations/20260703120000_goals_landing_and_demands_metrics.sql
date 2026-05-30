-- Metas: captação só via landing; demandas só quando resolvidas; progresso centralizado.

CREATE OR REPLACE FUNCTION public.compute_tenant_manual_goals(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    WITH goals_config AS (
      SELECT ps.data
      FROM public.poll_snapshots ps
      WHERE ps.tenant_id = p_tenant_id
        AND ps.snapshot_type = 'custom'
        AND ps.title = 'manual_goals'
      ORDER BY ps.recorded_at DESC
      LIMIT 1
    ),
    goal_rows AS (
      SELECT
        COALESCE(g->>'id', gen_random_uuid()::text) AS id,
        trim(g->>'name') AS name,
        g->>'metric' AS metric,
        g->>'startDate' AS start_date,
        g->>'endDate' AS end_date,
        greatest(COALESCE((g->>'target')::numeric, 0), 0)::int AS target
      FROM goals_config gc
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(gc.data->'goals') = 'array' THEN gc.data->'goals'
          ELSE '[]'::jsonb
        END
      ) AS g
      WHERE trim(COALESCE(g->>'name', '')) <> ''
        AND g->>'metric' IN ('new_supporters', 'resolved_demands')
        AND (g->>'startDate') ~ '^\d{4}-\d{2}-\d{2}$'
        AND (g->>'endDate') ~ '^\d{4}-\d{2}-\d{2}$'
    ),
    goal_values AS (
      SELECT
        gr.*,
        CASE gr.metric
          WHEN 'new_supporters' THEN (
            SELECT count(*)::int
            FROM public.supporters s
            WHERE s.tenant_id = p_tenant_id
              AND s.source = 'landing'
              AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date
                BETWEEN gr.start_date::date AND gr.end_date::date
          )
          WHEN 'resolved_demands' THEN (
            SELECT count(*)::int
            FROM public.demands d
            WHERE d.tenant_id = p_tenant_id
              AND d.status = 'resolvido'
              AND (d.updated_at AT TIME ZONE 'America/Sao_Paulo')::date
                BETWEEN gr.start_date::date AND gr.end_date::date
          )
          ELSE 0
        END AS value
      FROM goal_rows gr
    )
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', gv.id,
          'name', gv.name,
          'metric', gv.metric,
          'start_date', gv.start_date,
          'end_date', gv.end_date,
          'target', gv.target,
          'value', gv.value,
          'status', CASE
            WHEN gv.value >= greatest(gv.target, 1) THEN 'no_ritmo'
            WHEN gv.value >= greatest(gv.target, 1) * 0.7 THEN 'risco'
            ELSE 'atrasado'
          END
        )
        ORDER BY gv.start_date
      ),
      '[]'::json
    )
    FROM goal_values gv
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_tenant_manual_goals(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_tenant_operational_dashboard(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE;
  v_week_start DATE;
  v_week_end DATE;
  v_prev_start DATE;
  v_prev_end DATE;
  v_metrics JSON;
  v_kpi JSON;
  v_daily JSON;
  v_territories JSON;
  v_weekly_goals JSON;
  v_unassigned INTEGER;
  v_insights JSON;
BEGIN
  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_week_end := v_today;
  v_week_start := v_today - 6;
  v_prev_end := v_week_start - 1;
  v_prev_start := v_prev_end - 6;

  SELECT json_build_object(
    'total_supporters', (SELECT count(*)::int FROM public.supporters WHERE tenant_id = p_tenant_id),
    'strong_support', (
      SELECT count(*)::int FROM public.supporters
      WHERE tenant_id = p_tenant_id AND support_level = 'forte'
    ),
    'undecided', (
      SELECT count(*)::int FROM public.supporters
      WHERE tenant_id = p_tenant_id AND status = 'indeciso'
    ),
    'leaderships', (SELECT count(*)::int FROM public.leaderships WHERE tenant_id = p_tenant_id),
    'open_demands', (
      SELECT count(*)::int FROM public.demands
      WHERE tenant_id = p_tenant_id AND status = 'aberto'
    ),
    'funnel', COALESCE(
      (
        SELECT json_object_agg(status::text, cnt)
        FROM (
          SELECT status, count(*)::int AS cnt
          FROM public.supporters
          WHERE tenant_id = p_tenant_id
          GROUP BY status
        ) s
      ),
      '{}'::json
    )
  ) INTO v_metrics;

  SELECT json_build_object(
    'supporters', json_build_object(
      'last_7', (
        SELECT count(*)::int FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id
          AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_week_start AND v_week_end
      ),
      'prev_7', (
        SELECT count(*)::int FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id
          AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_prev_start AND v_prev_end
      )
    ),
    'strong_support', json_build_object(
      'last_7', (
        SELECT count(*)::int FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id AND s.support_level = 'forte'
          AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_week_start AND v_week_end
      ),
      'prev_7', (
        SELECT count(*)::int FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id AND s.support_level = 'forte'
          AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_prev_start AND v_prev_end
      )
    ),
    'leaderships', json_build_object(
      'last_7', (SELECT count(*)::int FROM public.leaderships WHERE tenant_id = p_tenant_id),
      'prev_7', NULL
    ),
    'open_demands', json_build_object(
      'last_7', (
        SELECT count(*)::int FROM public.demands d
        WHERE d.tenant_id = p_tenant_id AND d.status <> 'resolvido'
          AND (d.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_week_start AND v_week_end
      ),
      'prev_7', (
        SELECT count(*)::int FROM public.demands d
        WHERE d.tenant_id = p_tenant_id AND d.status <> 'resolvido'
          AND (d.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_prev_start AND v_prev_end
      ),
      'total_open', (
        SELECT count(*)::int FROM public.demands d
        WHERE d.tenant_id = p_tenant_id AND d.status <> 'resolvido'
      )
    )
  ) INTO v_kpi;

  SELECT json_build_object(
    'supporters_today', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
    ),
    'demands_today', (
      SELECT count(*)::int FROM public.demands d
      WHERE d.tenant_id = p_tenant_id
        AND (d.created_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
    ),
    'resolved_today', (
      SELECT count(*)::int FROM public.demands d
      WHERE d.tenant_id = p_tenant_id AND d.status = 'resolvido'
        AND (d.updated_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today
    ),
    'leadership_active', (
      SELECT count(*)::int FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id AND s.status = 'lideranca'
    )
  ) INTO v_daily;

  SELECT count(*)::int INTO v_unassigned
  FROM public.demands d
  WHERE d.tenant_id = p_tenant_id
    AND d.status <> 'resolvido'
    AND d.assigned_to IS NULL;

  WITH supporter_agg AS (
    SELECT
      public.supporter_territory_key_row(s.neighborhood, s.normalized_neighborhood) AS territory_key,
      public.supporter_territory_label_row(s.neighborhood, s.normalized_neighborhood) AS territory_label,
      count(*)::int AS supporters,
      count(*) FILTER (WHERE s.support_level = 'forte')::int AS strong,
      count(*) FILTER (WHERE s.support_level = 'indeciso' OR s.status = 'indeciso')::int AS undecided,
      count(*) FILTER (WHERE s.status = 'oposicao')::int AS opposition
    FROM public.supporters s
    WHERE s.tenant_id = p_tenant_id
    GROUP BY 1, 2
  ),
  demand_agg AS (
    SELECT
      public.demand_territory_key_row(d.neighborhood, d.normalized_neighborhood) AS territory_key,
      count(*) FILTER (WHERE d.status <> 'resolvido')::int AS open_demands
    FROM public.demands d
    WHERE d.tenant_id = p_tenant_id
    GROUP BY 1
  ),
  merged AS (
    SELECT
      sa.territory_key,
      sa.territory_label,
      sa.supporters,
      sa.strong,
      sa.undecided,
      sa.opposition,
      COALESCE(da.open_demands, 0)::int AS open_demands
    FROM supporter_agg sa
    LEFT JOIN demand_agg da ON da.territory_key = sa.territory_key
    WHERE sa.supporters > 0
  ),
  scored AS (
    SELECT
      territory_key,
      territory_label,
      supporters,
      round(strong::numeric / greatest(supporters, 1) * 100)::int AS strong_support_pct,
      round(undecided::numeric / greatest(supporters, 1) * 100)::int AS undecided_pct,
      round(opposition::numeric / greatest(supporters, 1) * 100)::int AS opposition_pct,
      open_demands,
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
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'neighborhood', e.territory_label,
        'territory_key', e.territory_key,
        'territory_label', e.territory_label,
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
      )
      ORDER BY e.score ASC
    ),
    '[]'::json
  ) INTO v_territories
  FROM enriched e;

  v_weekly_goals := public.compute_tenant_manual_goals(p_tenant_id);

  v_insights := public.build_dashboard_insights(
    v_territories,
    v_kpi,
    v_daily,
    v_weekly_goals,
    v_unassigned
  );

  RETURN json_build_object(
    'metrics', v_metrics,
    'insights', v_insights
  );
END;
$$;
