-- Enforcement de limites por plano (fonte de verdade no PostgreSQL).
-- max_regions armazenado para uso futuro; não aplicado na v1.

CREATE TABLE IF NOT EXISTS public.plan_limit_definitions (
  plan public.tenant_plan PRIMARY KEY,
  max_supporters INT,
  max_team_members INT,
  max_regions INT,
  exports_enabled BOOLEAN NOT NULL DEFAULT true,
  polls_enabled BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.plan_limit_definitions (
  plan, max_supporters, max_team_members, max_regions, exports_enabled, polls_enabled
) VALUES
  ('trial', 500, 3, 5, true, false),
  ('basic', 2000, 5, 15, true, true),
  ('pro', 10000, 15, 50, true, true),
  ('enterprise', NULL, NULL, NULL, true, true)
ON CONFLICT (plan) DO UPDATE SET
  max_supporters = EXCLUDED.max_supporters,
  max_team_members = EXCLUDED.max_team_members,
  max_regions = EXCLUDED.max_regions,
  exports_enabled = EXCLUDED.exports_enabled,
  polls_enabled = EXCLUDED.polls_enabled;

CREATE OR REPLACE FUNCTION public.get_plan_limits_for_plan(p_plan public.tenant_plan)
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'max_supporters', pld.max_supporters,
    'max_team_members', pld.max_team_members,
    'max_regions', pld.max_regions,
    'exports_enabled', pld.exports_enabled,
    'polls_enabled', pld.polls_enabled
  )
  FROM public.plan_limit_definitions pld
  WHERE pld.plan = p_plan;
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_team_slots_used(p_tenant_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT (
    (SELECT count(*)::int FROM public.tenant_members WHERE tenant_id = p_tenant_id)
    + (SELECT count(*)::int FROM public.team_invitations
       WHERE tenant_id = p_tenant_id AND status = 'pending')
  );
$$;

CREATE OR REPLACE FUNCTION public.assert_tenant_supporter_capacity(
  p_tenant_id UUID,
  p_additional INT DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_plan public.tenant_plan;
  v_max INT;
  v_current INT;
BEGIN
  IF p_additional < 1 THEN
    RETURN;
  END IF;

  SELECT t.plan INTO v_plan FROM public.tenants t WHERE t.id = p_tenant_id;
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Campanha não encontrada';
  END IF;

  SELECT pld.max_supporters INTO v_max
  FROM public.plan_limit_definitions pld
  WHERE pld.plan = v_plan;

  IF v_max IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*)::int INTO v_current
  FROM public.supporters s
  WHERE s.tenant_id = p_tenant_id;

  IF v_current + p_additional > v_max THEN
    RAISE EXCEPTION 'PLAN_LIMIT:supporters:%:%', v_current, v_max
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_tenant_team_capacity(
  p_tenant_id UUID,
  p_additional INT DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_plan public.tenant_plan;
  v_max INT;
  v_used INT;
BEGIN
  IF p_additional < 1 THEN
    RETURN;
  END IF;

  SELECT t.plan INTO v_plan FROM public.tenants t WHERE t.id = p_tenant_id;
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Campanha não encontrada';
  END IF;

  SELECT pld.max_team_members INTO v_max
  FROM public.plan_limit_definitions pld
  WHERE pld.plan = v_plan;

  IF v_max IS NULL THEN
    RETURN;
  END IF;

  v_used := public.get_tenant_team_slots_used(p_tenant_id);

  IF v_used + p_additional > v_max THEN
    RAISE EXCEPTION 'PLAN_LIMIT:team:%:%', v_used, v_max
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_tenant_polls_write(
  p_tenant_id UUID,
  p_snapshot_type public.poll_snapshot_type
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_plan public.tenant_plan;
  v_enabled BOOLEAN;
BEGIN
  IF p_snapshot_type = 'custom' THEN
    RETURN;
  END IF;

  SELECT t.plan INTO v_plan FROM public.tenants t WHERE t.id = p_tenant_id;
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Campanha não encontrada';
  END IF;

  SELECT pld.polls_enabled INTO v_enabled
  FROM public.plan_limit_definitions pld
  WHERE pld.plan = v_plan;

  IF NOT COALESCE(v_enabled, false) THEN
    RAISE EXCEPTION 'PLAN_LIMIT:polls'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_plan_usage(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.tenant_plan;
  v_limits JSON;
  v_supporters INT;
  v_team_slots INT;
  v_regions INT;
  v_max_supporters INT;
  v_max_team INT;
BEGIN
  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT t.plan INTO v_plan FROM public.tenants t WHERE t.id = p_tenant_id;
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Campanha não encontrada';
  END IF;

  v_limits := public.get_plan_limits_for_plan(v_plan);

  SELECT count(*)::int INTO v_supporters FROM public.supporters WHERE tenant_id = p_tenant_id;
  v_team_slots := public.get_tenant_team_slots_used(p_tenant_id);

  SELECT count(DISTINCT NULLIF(trim(neighborhood), ''))::int INTO v_regions
  FROM public.supporters
  WHERE tenant_id = p_tenant_id;

  v_max_supporters := (v_limits->>'max_supporters')::int;
  v_max_team := (v_limits->>'max_team_members')::int;

  RETURN json_build_object(
    'plan', v_plan,
    'limits', v_limits,
    'usage', json_build_object(
      'supporters', v_supporters,
      'team_slots', v_team_slots,
      'regions', v_regions
    ),
    'remaining', json_build_object(
      'supporters', CASE
        WHEN v_max_supporters IS NULL THEN NULL
        ELSE greatest(v_max_supporters - v_supporters, 0)
      END,
      'team_slots', CASE
        WHEN v_max_team IS NULL THEN NULL
        ELSE greatest(v_max_team - v_team_slots, 0)
      END
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_supporters_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_tenant_supporter_capacity(NEW.tenant_id, 1);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_team_invitations_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_tenant_team_capacity(NEW.tenant_id, 1);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_tenant_members_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = NEW.tenant_id AND tm.user_id = NEW.user_id
  ) THEN
    RETURN NEW;
  END IF;
  PERFORM public.assert_tenant_team_capacity(NEW.tenant_id, 1);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_poll_snapshots_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_tenant_polls_write(NEW.tenant_id, NEW.snapshot_type);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supporters_plan_limit ON public.supporters;
CREATE TRIGGER supporters_plan_limit
  BEFORE INSERT ON public.supporters
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_supporters_plan_limit();

DROP TRIGGER IF EXISTS team_invitations_plan_limit ON public.team_invitations;
CREATE TRIGGER team_invitations_plan_limit
  BEFORE INSERT ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_team_invitations_plan_limit();

DROP TRIGGER IF EXISTS tenant_members_plan_limit ON public.tenant_members;
CREATE TRIGGER tenant_members_plan_limit
  BEFORE INSERT ON public.tenant_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_tenant_members_plan_limit();

DROP TRIGGER IF EXISTS poll_snapshots_plan_limit ON public.poll_snapshots;
CREATE TRIGGER poll_snapshots_plan_limit
  BEFORE INSERT OR UPDATE ON public.poll_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_poll_snapshots_plan_limit();

REVOKE ALL ON TABLE public.plan_limit_definitions FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.plan_limit_definitions TO authenticated;

REVOKE ALL ON FUNCTION public.get_plan_limits_for_plan(public.tenant_plan) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_tenant_team_slots_used(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assert_tenant_supporter_capacity(uuid, int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assert_tenant_team_capacity(uuid, int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assert_tenant_polls_write(uuid, public.poll_snapshot_type) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_tenant_plan_usage(uuid) TO authenticated;
