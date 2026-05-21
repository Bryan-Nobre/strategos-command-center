-- RLS helper functions (public schema for Supabase)

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND platform_role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.tenant_role(p_tenant_id UUID)
RETURNS public.tenant_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.tenant_members
  WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_write_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR public.tenant_role(p_tenant_id) IN ('owner', 'coordinator', 'advisor', 'leadership', 'operator');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR public.tenant_role(p_tenant_id) IN ('owner', 'coordinator');
$$;

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- TENANTS
CREATE POLICY tenants_select ON public.tenants FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY tenants_insert ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY tenants_update ON public.tenants FOR UPDATE TO authenticated
  USING (public.can_manage_tenant(id) OR public.is_super_admin())
  WITH CHECK (public.can_manage_tenant(id) OR public.is_super_admin());

CREATE POLICY tenants_delete ON public.tenants FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- PROFILES
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin());

CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- TENANT MEMBERS
CREATE POLICY tenant_members_select ON public.tenant_members FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY tenant_members_insert ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_tenant(tenant_id) OR public.is_super_admin());

CREATE POLICY tenant_members_update ON public.tenant_members FOR UPDATE TO authenticated
  USING (public.can_manage_tenant(tenant_id) OR public.is_super_admin());

CREATE POLICY tenant_members_delete ON public.tenant_members FOR DELETE TO authenticated
  USING (public.can_manage_tenant(tenant_id) OR public.is_super_admin());

-- LANDING PAGES (public read for published)
CREATE POLICY landing_pages_select_auth ON public.landing_pages FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY landing_pages_select_anon ON public.landing_pages FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY landing_pages_write ON public.landing_pages FOR ALL TO authenticated
  USING (public.can_manage_tenant(tenant_id) OR public.is_super_admin())
  WITH CHECK (public.can_manage_tenant(tenant_id) OR public.is_super_admin());

-- LEADERSHIPS
CREATE POLICY leaderships_select ON public.leaderships FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY leaderships_write ON public.leaderships FOR ALL TO authenticated
  USING (public.can_write_tenant(tenant_id) OR public.is_super_admin())
  WITH CHECK (public.can_write_tenant(tenant_id) OR public.is_super_admin());

-- SUPPORTERS
CREATE POLICY supporters_select ON public.supporters FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY supporters_insert ON public.supporters FOR INSERT TO authenticated
  WITH CHECK (public.can_write_tenant(tenant_id) OR public.is_super_admin());

CREATE POLICY supporters_update ON public.supporters FOR UPDATE TO authenticated
  USING (public.can_write_tenant(tenant_id) OR public.is_super_admin());

CREATE POLICY supporters_delete ON public.supporters FOR DELETE TO authenticated
  USING (public.can_manage_tenant(tenant_id) OR public.is_super_admin());

-- DEMANDS
CREATE POLICY demands_select ON public.demands FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY demands_write ON public.demands FOR ALL TO authenticated
  USING (public.can_write_tenant(tenant_id) OR public.is_super_admin())
  WITH CHECK (public.can_write_tenant(tenant_id) OR public.is_super_admin());

-- AGENDA
CREATE POLICY agenda_select ON public.agenda_events FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY agenda_write ON public.agenda_events FOR ALL TO authenticated
  USING (public.can_write_tenant(tenant_id) OR public.is_super_admin())
  WITH CHECK (public.can_write_tenant(tenant_id) OR public.is_super_admin());

-- POLL SNAPSHOTS
CREATE POLICY poll_select ON public.poll_snapshots FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY poll_write ON public.poll_snapshots FOR ALL TO authenticated
  USING (public.can_manage_tenant(tenant_id) OR public.is_super_admin())
  WITH CHECK (public.can_manage_tenant(tenant_id) OR public.is_super_admin());

-- ACTIVITIES
CREATE POLICY activities_select ON public.activities FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY activities_insert ON public.activities FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

-- TEAM INVITATIONS
CREATE POLICY invitations_select ON public.team_invitations FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());

CREATE POLICY invitations_write ON public.team_invitations FOR ALL TO authenticated
  USING (public.can_manage_tenant(tenant_id) OR public.is_super_admin())
  WITH CHECK (public.can_manage_tenant(tenant_id) OR public.is_super_admin());

-- USER PREFERENCES
CREATE POLICY preferences_select ON public.user_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY preferences_write ON public.user_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admin read all for metrics (via is_super_admin on each policy above)
