-- Demandas da população via landing + origem (equipe vs cidadão)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'demand_source') THEN
    CREATE TYPE public.demand_source AS ENUM ('manual', 'landing');
  END IF;
END $$;

ALTER TYPE public.demand_category ADD VALUE IF NOT EXISTS 'melhorias';
ALTER TYPE public.demand_category ADD VALUE IF NOT EXISTS 'outros';

ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS source public.demand_source NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS requester_name TEXT,
  ADD COLUMN IF NOT EXISTS requester_phone TEXT,
  ADD COLUMN IF NOT EXISTS requester_city TEXT,
  ADD COLUMN IF NOT EXISTS supporter_id UUID REFERENCES public.supporters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_demands_tenant_source ON public.demands(tenant_id, source);
CREATE INDEX IF NOT EXISTS idx_demands_supporter ON public.demands(supporter_id);

COMMENT ON COLUMN public.demands.source IS 'manual = equipe; landing = cidadão na página pública.';
COMMENT ON COLUMN public.demands.requester_name IS 'Nome informado na landing quando não há cadastro de apoiador.';

CREATE OR REPLACE FUNCTION public.register_demand_from_landing(
  p_slug TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_category public.demand_category DEFAULT 'infraestrutura',
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_requester_name TEXT DEFAULT NULL,
  p_requester_phone TEXT DEFAULT NULL,
  p_priority public.demand_priority DEFAULT 'media'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_demand_id UUID;
  v_title TEXT;
  v_requester TEXT;
BEGIN
  v_title := trim(COALESCE(p_title, ''));
  IF p_slug IS NULL OR trim(p_slug) = '' OR v_title = '' THEN
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

  v_requester := NULLIF(trim(COALESCE(p_requester_name, '')), '');

  INSERT INTO public.demands (
    tenant_id,
    title,
    description,
    category,
    status,
    priority,
    neighborhood,
    source,
    requester_name,
    requester_phone,
    requester_city
  ) VALUES (
    v_tenant_id,
    v_title,
    NULLIF(trim(COALESCE(p_description, '')), ''),
    COALESCE(p_category, 'infraestrutura'::public.demand_category),
    'aberto',
    COALESCE(p_priority, 'media'),
    NULLIF(trim(COALESCE(p_neighborhood, '')), ''),
    'landing',
    v_requester,
    NULLIF(trim(COALESCE(p_requester_phone, '')), ''),
    NULLIF(trim(COALESCE(p_city, '')), '')
  )
  RETURNING id INTO v_demand_id;

  PERFORM public.log_activity(
    v_tenant_id,
    'Nova demanda via landing: ' || v_title,
    'demand',
    v_demand_id
  );

  RETURN v_demand_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_demand_from_landing TO anon, authenticated;
