-- RPC: public landing registration
CREATE OR REPLACE FUNCTION public.register_supporter_from_landing(
  p_slug TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_interest TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_supporter_id UUID;
BEGIN
  IF p_slug IS NULL OR trim(p_slug) = '' OR p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.landing_pages lp
  JOIN public.tenants t ON t.id = lp.tenant_id
  WHERE lp.slug = trim(p_slug)
    AND lp.is_published = true
    AND t.status = 'active'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Landing não encontrada';
  END IF;

  INSERT INTO public.supporters (
    tenant_id, name, phone, neighborhood, city,
    status, support_level, notes, interest, source
  ) VALUES (
    v_tenant_id,
    trim(p_name),
    NULLIF(trim(p_phone), ''),
    NULLIF(trim(p_neighborhood), ''),
    NULLIF(trim(p_city), ''),
    'interessado',
    'indeciso',
    NULLIF(trim(p_notes), ''),
    NULLIF(trim(p_interest), ''),
    'landing'
  )
  RETURNING id INTO v_supporter_id;

  PERFORM public.log_activity(
    v_tenant_id,
    'Novo apoiador via landing: ' || trim(p_name),
    'supporter',
    v_supporter_id
  );

  RETURN v_supporter_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_supporter_from_landing TO anon, authenticated;

-- RPC: complete politician onboarding after signup
CREATE OR REPLACE FUNCTION public.setup_politician_tenant(
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  v_slug := lower(regexp_replace(trim(p_slug), '[^a-z0-9-]', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  IF v_slug = '' OR length(v_slug) < 3 THEN
    RAISE EXCEPTION 'Slug inválido';
  END IF;

  INSERT INTO public.tenants (slug, name, owner_user_id, plan, status)
  VALUES (v_slug, trim(p_tenant_name), auth.uid(), 'trial', 'active')
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, auth.uid(), 'owner');

  INSERT INTO public.landing_pages (tenant_id, slug, headline, bio, proposals, is_published)
  VALUES (
    v_tenant_id,
    v_slug,
    COALESCE(p_headline, 'Juntos por uma cidade melhor'),
    '',
    '[]'::jsonb,
    true
  );

  INSERT INTO public.user_preferences (user_id, tenant_id)
  VALUES (auth.uid(), v_tenant_id);

  -- Default poll snapshots for dashboard
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

  PERFORM public.log_activity(v_tenant_id, 'Campanha criada com sucesso', 'tenant', v_tenant_id);

  RETURN v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_politician_tenant TO authenticated;

-- RPC: accept team invitation
CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.team_invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_inv FROM public.team_invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now()
  LIMIT 1;

  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_inv.tenant_id, auth.uid(), v_inv.role)
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.team_invitations SET status = 'accepted' WHERE id = v_inv.id;

  INSERT INTO public.user_preferences (user_id, tenant_id)
  VALUES (auth.uid(), v_inv.tenant_id)
  ON CONFLICT (user_id, tenant_id) DO NOTHING;

  RETURN v_inv.tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invitation TO authenticated;

-- Public landing view (minimal fields)
CREATE OR REPLACE FUNCTION public.get_public_landing(p_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'slug', lp.slug,
    'headline', lp.headline,
    'bio', lp.bio,
    'photo_url', lp.photo_url,
    'video_url', lp.video_url,
    'proposals', lp.proposals,
    'social_links', lp.social_links,
    'whatsapp', lp.whatsapp,
    'tenant_name', t.name
  ) INTO v_result
  FROM public.landing_pages lp
  JOIN public.tenants t ON t.id = lp.tenant_id
  WHERE lp.slug = trim(p_slug) AND lp.is_published = true AND t.status = 'active'
  LIMIT 1;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_landing TO anon, authenticated;

-- Dashboard metrics view helper
CREATE OR REPLACE FUNCTION public.get_tenant_dashboard_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT (p_tenant_id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT json_build_object(
    'total_supporters', (SELECT count(*) FROM public.supporters WHERE tenant_id = p_tenant_id),
    'strong_support', (SELECT count(*) FROM public.supporters WHERE tenant_id = p_tenant_id AND support_level = 'forte'),
    'undecided', (SELECT count(*) FROM public.supporters WHERE tenant_id = p_tenant_id AND status = 'indeciso'),
    'leaderships', (SELECT count(*) FROM public.leaderships WHERE tenant_id = p_tenant_id),
    'open_demands', (SELECT count(*) FROM public.demands WHERE tenant_id = p_tenant_id AND status = 'aberto'),
    'funnel', (
      SELECT json_object_agg(status::text, cnt)
      FROM (
        SELECT status, count(*) AS cnt
        FROM public.supporters WHERE tenant_id = p_tenant_id
        GROUP BY status
      ) s
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_dashboard_metrics TO authenticated;
