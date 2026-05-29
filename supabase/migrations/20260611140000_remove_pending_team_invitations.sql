-- Remove convites pendentes (fluxo por link descontinuado) e conta só membros ativos no plano

DELETE FROM public.team_invitations
WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.get_tenant_team_slots_used(p_tenant_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.tenant_members
  WHERE tenant_id = p_tenant_id
    AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.delete_tenant_role(p_role_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.tenant_roles%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.tenant_roles WHERE id = p_role_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Cargo não encontrado';
  END IF;

  IF NOT public.tenant_has_permission(v_row.tenant_id, 'team', 'manage_roles')
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF v_row.is_system THEN
    RAISE EXCEPTION 'Cargo do sistema não pode ser excluído';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenant_members WHERE custom_role_id = p_role_id) THEN
    RAISE EXCEPTION 'Cargo em uso por membros da equipe';
  END IF;

  DELETE FROM public.tenant_roles WHERE id = p_role_id;
END;
$$;
