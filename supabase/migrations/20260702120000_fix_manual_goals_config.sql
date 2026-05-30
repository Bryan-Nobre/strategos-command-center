-- Corrige permissão na RPC de metas, garante 1 registro por tenant e expõe leitura segura.

CREATE UNIQUE INDEX IF NOT EXISTS poll_snapshots_manual_goals_one_per_tenant
  ON public.poll_snapshots (tenant_id)
  WHERE snapshot_type = 'custom' AND title = 'manual_goals';

CREATE OR REPLACE FUNCTION public.upsert_manual_goals_config(
  p_tenant_id UUID,
  p_goals JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_id UUID;
  v_payload JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR public.tenant_has_permission(p_tenant_id, 'settings', 'goals')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para editar metas';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
      AND tm.user_id = v_user_id
      AND tm.status = 'active'
  ) AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Campanha inválida';
  END IF;

  v_payload := jsonb_build_object('goals', COALESCE(p_goals, '[]'::jsonb));

  SELECT ps.id INTO v_existing_id
  FROM public.poll_snapshots ps
  WHERE ps.tenant_id = p_tenant_id
    AND ps.snapshot_type = 'custom'
    AND ps.title = 'manual_goals'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.poll_snapshots
    SET data = v_payload, recorded_at = now()
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.poll_snapshots (tenant_id, snapshot_type, title, data, created_by)
    VALUES (p_tenant_id, 'custom', 'manual_goals', v_payload, v_user_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_manual_goals_config(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_data JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR (
      EXISTS (
        SELECT 1 FROM public.tenant_members tm
        WHERE tm.tenant_id = p_tenant_id
          AND tm.user_id = v_user_id
          AND tm.status = 'active'
      )
      AND (
        public.tenant_has_permission(p_tenant_id, 'settings', 'goals')
        OR public.tenant_has_permission(p_tenant_id, 'settings', 'read')
        OR public.tenant_has_permission(p_tenant_id, 'dashboard', 'read')
      )
    )
  ) THEN
    RAISE EXCEPTION 'Sem permissão para visualizar metas';
  END IF;

  SELECT ps.data INTO v_data
  FROM public.poll_snapshots ps
  WHERE ps.tenant_id = p_tenant_id
    AND ps.snapshot_type = 'custom'
    AND ps.title = 'manual_goals'
  ORDER BY ps.recorded_at DESC
  LIMIT 1;

  RETURN COALESCE(v_data, '{"goals":[]}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_manual_goals_config(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_manual_goals_config(UUID) TO authenticated;
