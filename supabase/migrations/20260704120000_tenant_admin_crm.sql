-- CRM interno da plataforma: data de acompanhamento e comentário por cliente (somente super_admin).

CREATE TABLE public.tenant_admin_crm (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  follow_up_date DATE,
  comment TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.tenant_admin_crm IS
  'Notas internas do super admin sobre cada campanha cliente. Não visível para o tenant.';
COMMENT ON COLUMN public.tenant_admin_crm.follow_up_date IS 'Data de retorno / próximo contato comercial.';
COMMENT ON COLUMN public.tenant_admin_crm.comment IS 'Comentário livre da equipe da plataforma.';

ALTER TABLE public.tenant_admin_crm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_admin_crm_super_admin ON public.tenant_admin_crm;
CREATE POLICY tenant_admin_crm_super_admin ON public.tenant_admin_crm
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE OR REPLACE FUNCTION public.upsert_tenant_admin_crm(
  p_tenant_id UUID,
  p_follow_up_date DATE DEFAULT NULL,
  p_comment TEXT DEFAULT NULL,
  p_clear_follow_up_date BOOLEAN DEFAULT false,
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
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = p_tenant_id) THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;

  v_comment := NULLIF(trim(COALESCE(p_comment, '')), '');

  INSERT INTO public.tenant_admin_crm (tenant_id, follow_up_date, comment, updated_by)
  VALUES (
    p_tenant_id,
    CASE WHEN p_clear_follow_up_date THEN NULL ELSE p_follow_up_date END,
    CASE WHEN p_clear_comment THEN NULL ELSE v_comment END,
    v_uid
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    follow_up_date = CASE
      WHEN p_clear_follow_up_date THEN NULL
      WHEN p_follow_up_date IS NOT NULL THEN p_follow_up_date
      ELSE public.tenant_admin_crm.follow_up_date
    END,
    comment = CASE
      WHEN p_clear_comment THEN NULL
      WHEN p_comment IS NOT NULL THEN v_comment
      ELSE public.tenant_admin_crm.comment
    END,
    updated_at = now(),
    updated_by = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_tenant_admin_crm(UUID, DATE, TEXT, BOOLEAN, BOOLEAN) TO authenticated;

REVOKE ALL ON TABLE public.tenant_admin_crm FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenant_admin_crm TO authenticated;
