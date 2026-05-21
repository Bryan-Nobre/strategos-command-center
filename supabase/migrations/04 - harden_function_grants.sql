REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_tenant_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tenant_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_write_tenant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_tenant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_activity(uuid, text, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_tenant_dashboard_metrics(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.setup_politician_tenant(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_team_invitation(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.setup_politician_tenant(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_dashboard_metrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity(uuid, text, text, uuid) TO authenticated;

ALTER FUNCTION public.set_updated_at() SET search_path = public;
