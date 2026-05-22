-- Novas campanhas iniciam suspensas até o admin liberar após pagamento
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
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id obrigatório';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND platform_role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Super administradores não podem criar campanhas de cliente';
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
  VALUES (v_slug, trim(p_tenant_name), p_user_id, 'trial', 'suspended')
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, p_user_id, 'owner');

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

  INSERT INTO public.poll_snapshots (tenant_id, snapshot_type, title, data) VALUES
    (v_tenant_id, 'intencao_voto', 'Intenção de voto', '[
      {"candidato":"Você","valor":38},
      {"candidato":"Cand. B","valor":26},
      {"candidato":"Cand. C","valor":18},
      {"candidato":"Cand. D","valor":11},
      {"candidato":"Indecisos","valor":7}
    ]'::jsonb),
    (v_tenant_id, 'aprovacao_bairro', 'Aprovação por bairro', '[
      {"bairro":"Centro","aprovacao":72},
      {"bairro":"Sul","aprovacao":64},
      {"bairro":"Norte","aprovacao":58},
      {"bairro":"Leste","aprovacao":81},
      {"bairro":"Oeste","aprovacao":49}
    ]'::jsonb),
    (v_tenant_id, 'crescimento_apoiadores', 'Crescimento', '[
      {"mes":"Jan","apoiadores":0},{"mes":"Fev","apoiadores":0},
      {"mes":"Mar","apoiadores":0},{"mes":"Abr","apoiadores":0},
      {"mes":"Mai","apoiadores":0},{"mes":"Jun","apoiadores":0}
    ]'::jsonb);

  PERFORM public.log_activity(v_tenant_id, 'Campanha criada — aguardando ativação', 'tenant', v_tenant_id);

  RETURN v_tenant_id;
END;
$$;

-- Ao ativar o cliente, publicar landing automaticamente
CREATE OR REPLACE FUNCTION public.sync_landing_on_tenant_activate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    UPDATE public.landing_pages
    SET is_published = true
    WHERE tenant_id = NEW.id;
  ELSIF NEW.status <> 'active' AND OLD.status = 'active' THEN
    UPDATE public.landing_pages
    SET is_published = false
    WHERE tenant_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_sync_landing_publish ON public.tenants;
CREATE TRIGGER tenants_sync_landing_publish
  AFTER UPDATE OF status ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_landing_on_tenant_activate();
