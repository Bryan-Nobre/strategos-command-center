-- P1.2: Trilha de atividade política + recência operacional (sem automações)

-- ========== Enums ==========

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supporter_activity_event_type') THEN
    CREATE TYPE public.supporter_activity_event_type AS ENUM (
      'landing_signup',
      'pledge_added',
      'leadership_linked',
      'demand_created',
      'supporter_updated',
      'imported',
      'manual_created'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supporter_activity_event_source') THEN
    CREATE TYPE public.supporter_activity_event_source AS ENUM (
      'landing',
      'manual',
      'import',
      'system',
      'migration',
      'crm'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supporter_engagement_status') THEN
    CREATE TYPE public.supporter_engagement_status AS ENUM (
      'hot',
      'warm',
      'cold',
      'inactive'
    );
  END IF;
END $$;

-- ========== Timeline de eventos ==========

CREATE TABLE IF NOT EXISTS public.supporter_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES public.supporters(id) ON DELETE CASCADE,
  leadership_id UUID REFERENCES public.leaderships(id) ON DELETE SET NULL,
  event_type public.supporter_activity_event_type NOT NULL,
  event_source public.supporter_activity_event_source NOT NULL DEFAULT 'system',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.supporter_activity_events IS
  'Timeline operacional do apoiador (landing, pledge, vínculo, demanda, CRM).';

CREATE INDEX IF NOT EXISTS idx_sae_tenant_supporter_created
  ON public.supporter_activity_events(tenant_id, supporter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sae_tenant_leadership_created
  ON public.supporter_activity_events(tenant_id, leadership_id, created_at DESC)
  WHERE leadership_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sae_tenant_type_created
  ON public.supporter_activity_events(tenant_id, event_type, created_at DESC);

-- ========== Camada derivada no apoiador ==========

ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activity_score NUMERIC(8, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_status public.supporter_engagement_status NOT NULL DEFAULT 'inactive';

COMMENT ON COLUMN public.supporters.activity_score IS
  'Score heurístico 30d com decaimento linear; ver recompute_supporter_activity_state.';
COMMENT ON COLUMN public.supporters.engagement_status IS
  'Temperatura política: hot/warm/cold/inactive derivada do score e recência.';

-- ========== Pesos por tipo de evento (30 dias, decaimento linear) ==========

CREATE OR REPLACE FUNCTION public.supporter_activity_event_weight(p_type public.supporter_activity_event_type)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_type
    WHEN 'landing_signup' THEN 2
    WHEN 'pledge_added' THEN 4
    WHEN 'leadership_linked' THEN 3
    WHEN 'demand_created' THEN 5
    WHEN 'supporter_updated' THEN 1
    WHEN 'imported' THEN 2
    WHEN 'manual_created' THEN 2
    ELSE 0
  END::numeric;
$$;

CREATE OR REPLACE FUNCTION public.recompute_supporter_activity_state(p_supporter_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.supporters%ROWTYPE;
  v_score NUMERIC := 0;
  v_last TIMESTAMPTZ;
  v_status public.supporter_engagement_status;
  r RECORD;
BEGIN
  IF p_supporter_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_row FROM public.supporters WHERE id = p_supporter_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT MAX(e.created_at) INTO v_last
  FROM public.supporter_activity_events e
  WHERE e.supporter_id = p_supporter_id;

  FOR r IN
    SELECT e.event_type, e.created_at
    FROM public.supporter_activity_events e
    WHERE e.supporter_id = p_supporter_id
      AND e.created_at >= (now() - interval '30 days')
  LOOP
    v_score := v_score + public.supporter_activity_event_weight(r.event_type)
      * GREATEST(0::numeric, 1 - (EXTRACT(EPOCH FROM (now() - r.created_at)) / 86400.0 / 30.0));
  END LOOP;

  v_score := ROUND(v_score, 2);

  IF v_last IS NULL OR v_last < (now() - interval '30 days') THEN
    v_status := 'inactive';
  ELSIF v_last >= (now() - interval '7 days') AND v_score >= 5 THEN
    v_status := 'hot';
  ELSIF v_last >= (now() - interval '30 days') AND v_score >= 3 THEN
    v_status := 'warm';
  ELSIF v_last >= (now() - interval '30 days') AND v_score > 0 THEN
    v_status := 'cold';
  ELSE
    v_status := 'inactive';
  END IF;

  PERFORM set_config('app.recomputing_activity', 'on', true);
  UPDATE public.supporters
  SET
    last_activity_at = v_last,
    activity_score = v_score,
    engagement_status = v_status,
    updated_at = now()
  WHERE id = p_supporter_id
    AND (
      last_activity_at IS DISTINCT FROM v_last
      OR activity_score IS DISTINCT FROM v_score
      OR engagement_status IS DISTINCT FROM v_status
    );
  PERFORM set_config('app.recomputing_activity', 'off', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_supporter_activity_event(
  p_tenant_id UUID,
  p_supporter_id UUID,
  p_event_type public.supporter_activity_event_type,
  p_event_source public.supporter_activity_event_source,
  p_leadership_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_created_at TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_supporter_tenant UUID;
BEGIN
  IF p_supporter_id IS NULL OR p_event_type IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT tenant_id INTO v_supporter_tenant FROM public.supporters WHERE id = p_supporter_id;
  IF v_supporter_tenant IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_tenant_id IS NULL THEN
    p_tenant_id := v_supporter_tenant;
  ELSIF p_tenant_id <> v_supporter_tenant THEN
    RAISE EXCEPTION 'Tenant inconsistente para evento de atividade';
  END IF;

  INSERT INTO public.supporter_activity_events (
    tenant_id, supporter_id, leadership_id, event_type, event_source, metadata, created_at
  ) VALUES (
    p_tenant_id,
    p_supporter_id,
    p_leadership_id,
    p_event_type,
    COALESCE(p_event_source, 'system'::public.supporter_activity_event_source),
    COALESCE(p_metadata, '{}'::jsonb),
    COALESCE(p_created_at, now())
  )
  RETURNING id INTO v_id;

  PERFORM public.recompute_supporter_activity_state(p_supporter_id);
  RETURN v_id;
END;
$$;

-- ========== Triggers automáticos ==========

CREATE OR REPLACE FUNCTION public.trg_supporters_log_activity_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type public.supporter_activity_event_type;
  v_source public.supporter_activity_event_source;
BEGIN
  IF current_setting('app.recomputing_activity', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_type := CASE NEW.source
      WHEN 'landing' THEN 'landing_signup'::public.supporter_activity_event_type
      WHEN 'import' THEN 'imported'::public.supporter_activity_event_type
      ELSE 'manual_created'::public.supporter_activity_event_type
    END;
    v_source := CASE NEW.source
      WHEN 'landing' THEN 'landing'::public.supporter_activity_event_source
      WHEN 'import' THEN 'import'::public.supporter_activity_event_source
      ELSE 'crm'::public.supporter_activity_event_source
    END;
    PERFORM public.log_supporter_activity_event(
      NEW.tenant_id, NEW.id, v_type, v_source, NEW.leadership_id,
      jsonb_build_object('source', NEW.source::text),
      NEW.created_at
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
  IF (
    OLD.name IS NOT DISTINCT FROM NEW.name
    AND OLD.phone IS NOT DISTINCT FROM NEW.phone
    AND OLD.email IS NOT DISTINCT FROM NEW.email
    AND OLD.neighborhood IS NOT DISTINCT FROM NEW.neighborhood
    AND OLD.city IS NOT DISTINCT FROM NEW.city
    AND OLD.status IS NOT DISTINCT FROM NEW.status
    AND OLD.support_level IS NOT DISTINCT FROM NEW.support_level
    AND OLD.notes IS NOT DISTINCT FROM NEW.notes
    AND OLD.interest IS NOT DISTINCT FROM NEW.interest
    AND OLD.leadership_id IS NOT DISTINCT FROM NEW.leadership_id
  ) THEN
    RETURN NEW;
  END IF;

    PERFORM public.log_supporter_activity_event(
      NEW.tenant_id,
      NEW.id,
      'supporter_updated',
      CASE NEW.source
        WHEN 'landing' THEN 'landing'::public.supporter_activity_event_source
        WHEN 'import' THEN 'import'::public.supporter_activity_event_source
        ELSE 'crm'::public.supporter_activity_event_source
      END,
      NEW.leadership_id,
      jsonb_build_object('updated_fields', true)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supporters_activity_events ON public.supporters;
CREATE TRIGGER supporters_activity_events
  AFTER INSERT OR UPDATE ON public.supporters
  FOR EACH ROW EXECUTE FUNCTION public.trg_supporters_log_activity_event();

CREATE OR REPLACE FUNCTION public.trg_pledge_log_activity_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leadership_id UUID;
BEGIN
  SELECT c.leadership_id INTO v_leadership_id
  FROM public.leadership_chapas c
  WHERE c.id = NEW.chapa_id;

  PERFORM public.log_supporter_activity_event(
    NEW.tenant_id,
    NEW.supporter_id,
    'pledge_added',
    'system',
    v_leadership_id,
    jsonb_build_object('chapa_id', NEW.chapa_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pledge_activity_events ON public.supporter_chapa_pledges;
CREATE TRIGGER pledge_activity_events
  AFTER INSERT ON public.supporter_chapa_pledges
  FOR EACH ROW EXECUTE FUNCTION public.trg_pledge_log_activity_event();

CREATE OR REPLACE FUNCTION public.trg_sll_log_activity_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_supporter_activity_event(
    NEW.tenant_id,
    NEW.supporter_id,
    'leadership_linked',
    CASE NEW.source
      WHEN 'landing' THEN 'landing'::public.supporter_activity_event_source
      WHEN 'import' THEN 'import'::public.supporter_activity_event_source
      WHEN 'manual' THEN 'crm'::public.supporter_activity_event_source
      ELSE 'system'::public.supporter_activity_event_source
    END,
    NEW.leadership_id,
    jsonb_build_object(
      'relationship_type', NEW.relationship_type::text,
      'is_primary', NEW.is_primary
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sll_activity_events ON public.supporter_leadership_links;
CREATE TRIGGER sll_activity_events
  AFTER INSERT ON public.supporter_leadership_links
  FOR EACH ROW EXECUTE FUNCTION public.trg_sll_log_activity_event();

CREATE OR REPLACE FUNCTION public.trg_demand_log_activity_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.supporter_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.log_supporter_activity_event(
    NEW.tenant_id,
    NEW.supporter_id,
    'demand_created',
    CASE NEW.source
      WHEN 'landing' THEN 'landing'::public.supporter_activity_event_source
      ELSE 'crm'::public.supporter_activity_event_source
    END,
    NULL,
    jsonb_build_object('demand_id', NEW.id, 'title', NEW.title)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS demand_activity_events ON public.demands;
CREATE TRIGGER demand_activity_events
  AFTER INSERT ON public.demands
  FOR EACH ROW EXECUTE FUNCTION public.trg_demand_log_activity_event();

-- ========== Backfill histórico (sem duplicar se já houver eventos) ==========

INSERT INTO public.supporter_activity_events (tenant_id, supporter_id, leadership_id, event_type, event_source, metadata, created_at)
SELECT
  s.tenant_id,
  s.id,
  s.leadership_id,
  CASE s.source
    WHEN 'landing' THEN 'landing_signup'::public.supporter_activity_event_type
    WHEN 'import' THEN 'imported'::public.supporter_activity_event_type
    ELSE 'manual_created'::public.supporter_activity_event_type
  END,
  CASE s.source
    WHEN 'landing' THEN 'landing'::public.supporter_activity_event_source
    WHEN 'import' THEN 'import'::public.supporter_activity_event_source
    ELSE 'crm'::public.supporter_activity_event_source
  END,
  jsonb_build_object('backfill', true),
  s.created_at
FROM public.supporters s
WHERE NOT EXISTS (
  SELECT 1 FROM public.supporter_activity_events e
  WHERE e.supporter_id = s.id
    AND e.event_type IN ('landing_signup', 'manual_created', 'imported')
);

INSERT INTO public.supporter_activity_events (tenant_id, supporter_id, leadership_id, event_type, event_source, metadata, created_at)
SELECT
  p.tenant_id,
  p.supporter_id,
  c.leadership_id,
  'pledge_added'::public.supporter_activity_event_type,
  'system'::public.supporter_activity_event_source,
  jsonb_build_object('chapa_id', p.chapa_id, 'backfill', true),
  p.created_at
FROM public.supporter_chapa_pledges p
JOIN public.leadership_chapas c ON c.id = p.chapa_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.supporter_activity_events e
  WHERE e.supporter_id = p.supporter_id
    AND e.event_type = 'pledge_added'
    AND e.metadata->>'chapa_id' = p.chapa_id::text
);

INSERT INTO public.supporter_activity_events (tenant_id, supporter_id, leadership_id, event_type, event_source, metadata, created_at)
SELECT
  sll.tenant_id,
  sll.supporter_id,
  sll.leadership_id,
  'leadership_linked'::public.supporter_activity_event_type,
  CASE sll.source
    WHEN 'landing' THEN 'landing'::public.supporter_activity_event_source
    WHEN 'import' THEN 'import'::public.supporter_activity_event_source
    WHEN 'manual' THEN 'crm'::public.supporter_activity_event_source
    ELSE 'system'::public.supporter_activity_event_source
  END,
  jsonb_build_object('backfill', true),
  sll.created_at
FROM public.supporter_leadership_links sll
WHERE NOT EXISTS (
  SELECT 1 FROM public.supporter_activity_events e
  WHERE e.supporter_id = sll.supporter_id
    AND e.event_type = 'leadership_linked'
    AND e.leadership_id = sll.leadership_id
);

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.supporters LOOP
    PERFORM public.recompute_supporter_activity_state(r.id);
  END LOOP;
END $$;

-- ========== RLS ==========

ALTER TABLE public.supporter_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sae_select ON public.supporter_activity_events;
CREATE POLICY sae_select ON public.supporter_activity_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

DROP POLICY IF EXISTS sae_insert ON public.supporter_activity_events;
CREATE POLICY sae_insert ON public.supporter_activity_events
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_tenant(tenant_id) OR public.is_super_admin());

GRANT SELECT ON public.supporter_activity_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_supporter_activity_state(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_supporter_activity_event(uuid, uuid, public.supporter_activity_event_type, public.supporter_activity_event_source, uuid, jsonb, timestamptz) TO authenticated;

-- ========== leadership_operational_summary_v + RPC detalhe ==========

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
  (
    (b.primary_supporters * 5)
    + (b.secondary_supporters * 2)
    + b.pledged_votes
    + (b.weekly_growth * 3)
  )::int AS political_strength_score
FROM base b
LEFT JOIN activity a ON a.leadership_id = b.leadership_id
LEFT JOIN top_neighborhood tn ON tn.leadership_id = b.leadership_id;
