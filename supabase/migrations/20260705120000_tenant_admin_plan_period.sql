-- Período do plano comercial (início/fim) no CRM admin, em vez de data única de follow-up.

ALTER TABLE public.tenant_admin_crm
  RENAME COLUMN follow_up_date TO plan_period_start;

ALTER TABLE public.tenant_admin_crm
  ADD COLUMN IF NOT EXISTS plan_period_end DATE;

COMMENT ON COLUMN public.tenant_admin_crm.plan_period_start IS
  'Início da vigência do plano contratado (controle interno super admin).';
COMMENT ON COLUMN public.tenant_admin_crm.plan_period_end IS
  'Fim da vigência do plano contratado (controle interno super admin).';

DROP FUNCTION IF EXISTS public.upsert_tenant_admin_crm(UUID, DATE, TEXT, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION public.upsert_tenant_admin_crm(
  p_tenant_id UUID,
  p_plan_period_start DATE DEFAULT NULL,
  p_plan_period_end DATE DEFAULT NULL,
  p_comment TEXT DEFAULT NULL,
  p_clear_plan_period_start BOOLEAN DEFAULT false,
  p_clear_plan_period_end BOOLEAN DEFAULT false,
  p_clear_comment BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_comment TEXT;
  v_start DATE;
  v_end DATE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = p_tenant_id) THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;

  v_comment := NULLIF(trim(COALESCE(p_comment, '')), '');

  v_start := CASE
    WHEN p_clear_plan_period_start THEN NULL
    WHEN p_plan_period_start IS NOT NULL THEN p_plan_period_start
    ELSE (SELECT c.plan_period_start FROM public.tenant_admin_crm c WHERE c.tenant_id = p_tenant_id)
  END;

  v_end := CASE
    WHEN p_clear_plan_period_end THEN NULL
    WHEN p_plan_period_end IS NOT NULL THEN p_plan_period_end
    ELSE (SELECT c.plan_period_end FROM public.tenant_admin_crm c WHERE c.tenant_id = p_tenant_id)
  END;

  IF v_start IS NOT NULL AND v_end IS NOT NULL AND v_start > v_end THEN
    RAISE EXCEPTION 'Início do período deve ser anterior ou igual ao fim';
  END IF;

  INSERT INTO public.tenant_admin_crm (
    tenant_id,
    plan_period_start,
    plan_period_end,
    comment,
    updated_by
  )
  VALUES (
    p_tenant_id,
    v_start,
    v_end,
    CASE WHEN p_clear_comment THEN NULL WHEN p_comment IS NOT NULL THEN v_comment ELSE NULL END,
    v_uid
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    plan_period_start = v_start,
    plan_period_end = v_end,
    comment = CASE
      WHEN p_clear_comment THEN NULL
      WHEN p_comment IS NOT NULL THEN v_comment
      ELSE public.tenant_admin_crm.comment
    END,
    updated_at = now(),
    updated_by = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_tenant_admin_crm(UUID, DATE, DATE, TEXT, BOOLEAN, BOOLEAN, BOOLEAN)
  TO authenticated;
