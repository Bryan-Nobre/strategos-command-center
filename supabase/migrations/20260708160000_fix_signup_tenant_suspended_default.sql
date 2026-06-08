-- Novas campanhas devem iniciar suspensas até o admin ativar (fluxo de pagamento).
CREATE OR REPLACE FUNCTION public.setup_politician_tenant_for_user(
  p_user_id UUID,
  p_tenant_name TEXT,
  p_slug TEXT,
  p_headline TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_slug TEXT;
  v_role TEXT;
  v_admin_role_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id obrigatório';
  END IF;

  v_role := COALESCE(auth.jwt() ->> 'role', '');
  IF v_role <> 'service_role' AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  SELECT tm.tenant_id INTO v_tenant_id
  FROM public.tenant_members tm
  WHERE tm.user_id = p_user_id
  LIMIT 1;

  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id;
  END IF;

  v_slug := lower(regexp_replace(trim(p_slug), '[^a-z0-9-]', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  IF v_slug = '' OR length(v_slug) < 3 THEN
    RAISE EXCEPTION 'Slug inválido';
  END IF;

  INSERT INTO public.tenants (slug, name, owner_user_id, plan, status)
  VALUES (v_slug, trim(p_tenant_name), p_user_id, 'start', 'suspended')
  RETURNING id INTO v_tenant_id;

  v_admin_role_id := public.seed_tenant_default_roles(v_tenant_id);

  INSERT INTO public.tenant_members (tenant_id, user_id, role, custom_role_id)
  VALUES (v_tenant_id, p_user_id, 'owner', v_admin_role_id);

  INSERT INTO public.landing_pages (tenant_id, slug, headline, bio, proposals, is_published)
  VALUES (
    v_tenant_id,
    v_slug,
    COALESCE(p_headline, 'Juntos por uma cidade melhor'),
    '',
    '[]'::jsonb,
    false
  );

  INSERT INTO public.user_preferences (user_id, tenant_id)
  VALUES (p_user_id, v_tenant_id);

  PERFORM public.log_activity(v_tenant_id, 'Campanha criada — aguardando ativação', 'tenant', v_tenant_id);

  RETURN v_tenant_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
