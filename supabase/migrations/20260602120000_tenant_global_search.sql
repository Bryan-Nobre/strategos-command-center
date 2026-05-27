-- Busca global por campanha — resultados filtrados por permissão read de cada módulo.
-- Segurança real: RPC só consulta tabelas cujo módulo o usuário pode ler.

CREATE OR REPLACE FUNCTION public.escape_ilike_pattern(p TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT replace(replace(replace(COALESCE(p, ''), '\', '\\'), '%', '\%'), '_', '\_');
$$;

CREATE OR REPLACE FUNCTION public.normalize_search_query(p_query TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(trim(both from regexp_replace(trim(COALESCE(p_query, '')), '\s+', ' ', 'g')), '');
$$;

CREATE OR REPLACE FUNCTION public.search_tenant(
  p_tenant_id UUID,
  p_query TEXT,
  p_limit_per_module INT DEFAULT 5
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query TEXT;
  v_pattern TEXT;
  v_limit INT;
  v_groups JSONB := '[]'::jsonb;
  v_items JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  v_query := public.normalize_search_query(p_query);
  IF v_query IS NULL OR length(v_query) < 2 THEN
    RETURN json_build_object('query', COALESCE(v_query, ''), 'groups', '[]'::json);
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit_per_module, 5), 1), 20);
  v_pattern := '%' || public.escape_ilike_pattern(v_query) || '%';

  -- Eleitores
  IF public.tenant_has_permission(p_tenant_id, 'supporters', 'read') THEN
    SELECT COALESCE(jsonb_agg(row ORDER BY sort_name), '[]'::jsonb) INTO v_items
    FROM (
      SELECT jsonb_build_object(
        'id', s.id,
        'title', s.name,
        'subtitle', trim(both from concat_ws(' · ',
          NULLIF(trim(s.neighborhood), ''),
          s.status::text
        )),
        'route', '/eleitores',
        'search', jsonb_build_object('busca', v_query, 'id', s.id::text)
      ) AS row,
      lower(s.name) AS sort_name
      FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND (
          s.name ILIKE v_pattern ESCAPE '\'
          OR COALESCE(s.phone, '') ILIKE v_pattern ESCAPE '\'
          OR COALESCE(s.neighborhood, '') ILIKE v_pattern ESCAPE '\'
          OR COALESCE(s.city, '') ILIKE v_pattern ESCAPE '\'
          OR COALESCE(array_to_string(s.tags, ' '), '') ILIKE v_pattern ESCAPE '\'
        )
      ORDER BY lower(s.name)
      LIMIT v_limit
    ) sub;

    IF jsonb_array_length(v_items) > 0 THEN
      v_groups := v_groups || jsonb_build_array(jsonb_build_object(
        'module', 'supporters',
        'label', 'Eleitores',
        'items', v_items
      ));
    END IF;
  END IF;

  -- Lideranças
  IF public.tenant_has_permission(p_tenant_id, 'leaderships', 'read') THEN
    SELECT COALESCE(jsonb_agg(row ORDER BY sort_name), '[]'::jsonb) INTO v_items
    FROM (
      SELECT jsonb_build_object(
        'id', l.id,
        'title', l.name,
        'subtitle', COALESCE(NULLIF(trim(l.region), ''), 'Sem região'),
        'route', '/liderancas',
        'search', jsonb_build_object('busca', v_query, 'id', l.id::text)
      ) AS row,
      lower(l.name) AS sort_name
      FROM public.leaderships l
      WHERE l.tenant_id = p_tenant_id
        AND (
          l.name ILIKE v_pattern ESCAPE '\'
          OR COALESCE(l.region, '') ILIKE v_pattern ESCAPE '\'
        )
      ORDER BY lower(l.name)
      LIMIT v_limit
    ) sub;

    IF jsonb_array_length(v_items) > 0 THEN
      v_groups := v_groups || jsonb_build_array(jsonb_build_object(
        'module', 'leaderships',
        'label', 'Lideranças',
        'items', v_items
      ));
    END IF;
  END IF;

  -- Demandas
  IF public.tenant_has_permission(p_tenant_id, 'demands', 'read') THEN
    SELECT COALESCE(jsonb_agg(row ORDER BY sort_title), '[]'::jsonb) INTO v_items
    FROM (
      SELECT jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'subtitle', trim(both from concat_ws(' · ',
          NULLIF(trim(d.neighborhood), ''),
          d.status::text
        )),
        'route', '/demandas',
        'search', jsonb_build_object('busca', v_query, 'id', d.id::text)
      ) AS row,
      lower(d.title) AS sort_title
      FROM public.demands d
      WHERE d.tenant_id = p_tenant_id
        AND (
          d.title ILIKE v_pattern ESCAPE '\'
          OR COALESCE(d.neighborhood, '') ILIKE v_pattern ESCAPE '\'
          OR COALESCE(d.description, '') ILIKE v_pattern ESCAPE '\'
        )
      ORDER BY lower(d.title)
      LIMIT v_limit
    ) sub;

    IF jsonb_array_length(v_items) > 0 THEN
      v_groups := v_groups || jsonb_build_array(jsonb_build_object(
        'module', 'demands',
        'label', 'Demandas',
        'items', v_items
      ));
    END IF;
  END IF;

  -- Agenda
  IF public.tenant_has_permission(p_tenant_id, 'agenda', 'read') THEN
    SELECT COALESCE(jsonb_agg(row ORDER BY sort_date DESC, sort_title), '[]'::jsonb) INTO v_items
    FROM (
      SELECT jsonb_build_object(
        'id', e.id,
        'title', e.title,
        'subtitle', trim(both from concat_ws(' · ',
          to_char(e.event_date, 'DD/MM/YYYY'),
          NULLIF(trim(e.location), '')
        )),
        'route', '/agenda',
        'search', jsonb_build_object('busca', v_query, 'id', e.id::text)
      ) AS row,
      e.event_date AS sort_date,
      lower(e.title) AS sort_title
      FROM public.agenda_events e
      WHERE e.tenant_id = p_tenant_id
        AND (
          e.title ILIKE v_pattern ESCAPE '\'
          OR COALESCE(e.location, '') ILIKE v_pattern ESCAPE '\'
          OR COALESCE(e.description, '') ILIKE v_pattern ESCAPE '\'
        )
      ORDER BY e.event_date DESC, lower(e.title)
      LIMIT v_limit
    ) sub;

    IF jsonb_array_length(v_items) > 0 THEN
      v_groups := v_groups || jsonb_build_array(jsonb_build_object(
        'module', 'agenda',
        'label', 'Agenda',
        'items', v_items
      ));
    END IF;
  END IF;

  RETURN json_build_object(
    'query', v_query,
    'groups', COALESCE(v_groups, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.search_tenant(uuid, text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_tenant(uuid, text, int) TO authenticated;
