-- Corrige ORDER BY: coluna no subselect é "createdAt", não created_at
CREATE OR REPLACE FUNCTION public.list_team_members_enriched(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR p_tenant_id IN (SELECT public.user_tenant_ids())
    OR EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = p_tenant_id AND tm.user_id = v_uid
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN COALESCE(
    (
      SELECT json_agg(row_to_json(x) ORDER BY x."createdAt" DESC)
      FROM (
        SELECT
          tm.id,
          tm.user_id,
          tm.role,
          tm.status,
          tm.custom_role_id AS "customRoleId",
          tr.name AS "customRoleName",
          tm.created_at AS "createdAt",
          p.full_name AS "fullName",
          p.phone,
          p.avatar_url AS "avatarUrl",
          u.email
        FROM public.tenant_members tm
        JOIN public.profiles p ON p.id = tm.user_id
        LEFT JOIN public.tenant_roles tr ON tr.id = tm.custom_role_id
        LEFT JOIN auth.users u ON u.id = tm.user_id
        WHERE tm.tenant_id = p_tenant_id
      ) x
    ),
    '[]'::json
  );
END;
$$;
