-- P0: vínculo político apoiador ↔ liderança (fonte de verdade relacional)
-- Mantém supporters.leadership_id como espelho de compatibilidade (liderança primária)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supporter_leadership_relationship') THEN
    CREATE TYPE public.supporter_leadership_relationship AS ENUM (
      'pledge',    -- derivado de apoio a chapa(s) na landing
      'assigned',  -- atribuição manual no CRM
      'imported',  -- importação em massa
      'legacy'     -- backfill da coluna supporters.leadership_id
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supporter_leadership_link_source') THEN
    CREATE TYPE public.supporter_leadership_link_source AS ENUM (
      'landing',
      'manual',
      'import',
      'migration',
      'system'
    );
  END IF;
END $$;

CREATE TABLE public.supporter_leadership_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES public.supporters(id) ON DELETE CASCADE,
  leadership_id UUID NOT NULL REFERENCES public.leaderships(id) ON DELETE CASCADE,
  relationship_type public.supporter_leadership_relationship NOT NULL DEFAULT 'assigned',
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  source public.supporter_leadership_link_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT supporter_leadership_links_unique_pair UNIQUE (supporter_id, leadership_id),
  CONSTRAINT supporter_leadership_links_tenant_consistency CHECK (tenant_id IS NOT NULL)
);

COMMENT ON TABLE public.supporter_leadership_links IS
  'Vínculos políticos apoiador↔liderança. Fonte de verdade para afiliação; supporters.leadership_id espelha is_primary.';
COMMENT ON COLUMN public.supporter_leadership_links.weight IS
  'Peso relativo (ex.: soma vote_weight das chapas apoiadas nesta liderança). Usado para escolher liderança primária.';
COMMENT ON COLUMN public.supporter_leadership_links.is_primary IS
  'Uma única liderança primária por apoiador; sincronizada em supporters.leadership_id.';

CREATE INDEX idx_sll_tenant ON public.supporter_leadership_links(tenant_id);
CREATE INDEX idx_sll_leadership ON public.supporter_leadership_links(tenant_id, leadership_id);
CREATE INDEX idx_sll_supporter ON public.supporter_leadership_links(tenant_id, supporter_id);
CREATE UNIQUE INDEX idx_sll_one_primary_per_supporter
  ON public.supporter_leadership_links(supporter_id)
  WHERE is_primary = true;

CREATE TRIGGER supporter_leadership_links_updated_at
  BEFORE UPDATE ON public.supporter_leadership_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Garante tenant_id alinhado a supporter + leadership
CREATE OR REPLACE FUNCTION public.trg_sll_enforce_tenant_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_supporter_tenant UUID;
  v_leadership_tenant UUID;
BEGIN
  SELECT tenant_id INTO v_supporter_tenant FROM public.supporters WHERE id = NEW.supporter_id;
  SELECT tenant_id INTO v_leadership_tenant FROM public.leaderships WHERE id = NEW.leadership_id;

  IF v_supporter_tenant IS NULL OR v_leadership_tenant IS NULL THEN
    RAISE EXCEPTION 'Apoiador ou liderança inválidos';
  END IF;

  IF v_supporter_tenant <> v_leadership_tenant THEN
    RAISE EXCEPTION 'Apoiador e liderança pertencem a campanhas diferentes';
  END IF;

  NEW.tenant_id := v_supporter_tenant;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sll_enforce_tenant
  BEFORE INSERT OR UPDATE ON public.supporter_leadership_links
  FOR EACH ROW EXECUTE FUNCTION public.trg_sll_enforce_tenant_consistency();

-- Evita loop supporters ↔ links durante sincronização automática
CREATE OR REPLACE FUNCTION public.is_syncing_leadership_mirror()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.syncing_leadership_mirror', true), '') = 'on';
$$;

CREATE OR REPLACE FUNCTION public.set_syncing_leadership_mirror(p_on BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.syncing_leadership_mirror', CASE WHEN p_on THEN 'on' ELSE 'off' END, true);
END;
$$;

-- Recalcula is_primary (maior weight; desempate: created_at, leadership_id) e espelha em supporters
CREATE OR REPLACE FUNCTION public.is_recomputing_leadership_primary()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.recomputing_leadership_primary', true), '') = 'on';
$$;

CREATE OR REPLACE FUNCTION public.recompute_supporter_leadership_primary(p_supporter_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_primary_leadership UUID;
BEGIN
  IF p_supporter_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF public.is_recomputing_leadership_primary() THEN
    RETURN (SELECT leadership_id FROM public.supporters WHERE id = p_supporter_id);
  END IF;

  PERFORM set_config('app.recomputing_leadership_primary', 'on', true);
  BEGIN
    UPDATE public.supporter_leadership_links
    SET is_primary = false, updated_at = now()
    WHERE supporter_id = p_supporter_id;

    SELECT l.leadership_id INTO v_primary_leadership
    FROM public.supporter_leadership_links l
    WHERE l.supporter_id = p_supporter_id
    ORDER BY l.weight DESC, l.created_at ASC, l.leadership_id ASC
    LIMIT 1;

    IF v_primary_leadership IS NOT NULL THEN
      UPDATE public.supporter_leadership_links
      SET is_primary = true, updated_at = now()
      WHERE supporter_id = p_supporter_id AND leadership_id = v_primary_leadership;
    END IF;

    PERFORM public.set_syncing_leadership_mirror(true);
    UPDATE public.supporters
    SET leadership_id = v_primary_leadership, updated_at = now()
    WHERE id = p_supporter_id;
    PERFORM public.set_syncing_leadership_mirror(false);
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM set_config('app.recomputing_leadership_primary', 'off', true);
      RAISE;
  END;
  PERFORM set_config('app.recomputing_leadership_primary', 'off', true);

  RETURN v_primary_leadership;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sll_after_change_sync_primary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supporter_id UUID;
BEGIN
  IF COALESCE(current_setting('app.bulk_leadership_link_sync', true), '') = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF public.is_recomputing_leadership_primary() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_supporter_id := COALESCE(NEW.supporter_id, OLD.supporter_id);
  PERFORM public.recompute_supporter_leadership_primary(v_supporter_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sll_after_change_sync_primary
  AFTER INSERT OR UPDATE OF weight, leadership_id OR DELETE
  ON public.supporter_leadership_links
  FOR EACH ROW EXECUTE FUNCTION public.trg_sll_after_change_sync_primary();

-- Escrita legada em supporters.leadership_id → upsert de link primário
CREATE OR REPLACE FUNCTION public.trg_supporters_leadership_id_mirror_to_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_syncing_leadership_mirror() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.leadership_id IS NOT DISTINCT FROM OLD.leadership_id THEN
    RETURN NEW;
  END IF;

  IF NEW.leadership_id IS NULL THEN
    UPDATE public.supporter_leadership_links
    SET is_primary = false, updated_at = now()
    WHERE supporter_id = NEW.id AND is_primary = true;

    PERFORM public.recompute_supporter_leadership_primary(NEW.id);
    RETURN NEW;
  END IF;

  INSERT INTO public.supporter_leadership_links (
    tenant_id,
    supporter_id,
    leadership_id,
    relationship_type,
    weight,
    is_primary,
    source
  ) VALUES (
    NEW.tenant_id,
    NEW.id,
    NEW.leadership_id,
    'assigned',
    1,
    true,
    'manual'
  )
  ON CONFLICT (supporter_id, leadership_id) DO UPDATE SET
    relationship_type = CASE
      WHEN public.supporter_leadership_links.relationship_type = 'pledge'
        THEN public.supporter_leadership_links.relationship_type
      ELSE 'assigned'
    END,
    weight = GREATEST(public.supporter_leadership_links.weight, 1),
    is_primary = true,
    source = CASE
      WHEN public.supporter_leadership_links.source = 'migration' THEN public.supporter_leadership_links.source
      ELSE 'manual'
    END,
    updated_at = now();

  UPDATE public.supporter_leadership_links
  SET is_primary = false, updated_at = now()
  WHERE supporter_id = NEW.id AND leadership_id <> NEW.leadership_id;

  PERFORM public.set_syncing_leadership_mirror(true);
  UPDATE public.supporters
  SET leadership_id = NEW.leadership_id
  WHERE id = NEW.id;
  PERFORM public.set_syncing_leadership_mirror(false);

  RETURN NEW;
END;
$$;

CREATE TRIGGER supporters_leadership_id_mirror_to_links
  AFTER INSERT OR UPDATE OF leadership_id ON public.supporters
  FOR EACH ROW EXECUTE FUNCTION public.trg_supporters_leadership_id_mirror_to_links();

-- Upsert vínculos a partir das chapas selecionadas (soma vote_weight por liderança)
CREATE OR REPLACE FUNCTION public.upsert_supporter_leadership_links_from_chapas(
  p_supporter_id UUID,
  p_tenant_id UUID,
  p_chapa_ids UUID[],
  p_source public.supporter_leadership_link_source DEFAULT 'landing'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_chapa_ids IS NULL OR array_length(p_chapa_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.supporter_leadership_links (
    tenant_id,
    supporter_id,
    leadership_id,
    relationship_type,
    weight,
    is_primary,
    source
  )
  SELECT
    p_tenant_id,
    p_supporter_id,
    c.leadership_id,
    'pledge'::public.supporter_leadership_relationship,
    SUM(c.vote_weight)::int,
    false,
    p_source
  FROM public.leadership_chapas c
  WHERE c.id = ANY (p_chapa_ids)
    AND c.tenant_id = p_tenant_id
    AND c.is_published = true
  GROUP BY c.leadership_id
  ON CONFLICT (supporter_id, leadership_id) DO UPDATE SET
    relationship_type = 'pledge',
    weight = GREATEST(public.supporter_leadership_links.weight, EXCLUDED.weight),
    source = EXCLUDED.source,
    updated_at = now();
END;
$$;

-- RPC landing: pledges + links + primária determinística
CREATE OR REPLACE FUNCTION public.register_supporter_from_landing(
  p_slug TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_interest TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_chapa_ids UUID[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_supporter_id UUID;
  v_chapa_id UUID;
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

  PERFORM public.assert_tenant_supporter_capacity(v_tenant_id, 1);

  PERFORM public.set_syncing_leadership_mirror(true);
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
  PERFORM public.set_syncing_leadership_mirror(false);

  IF p_chapa_ids IS NOT NULL THEN
    FOREACH v_chapa_id IN ARRAY p_chapa_ids
    LOOP
      IF EXISTS (
        SELECT 1 FROM public.leadership_chapas c
        WHERE c.id = v_chapa_id
          AND c.tenant_id = v_tenant_id
          AND c.is_published = true
      ) THEN
        INSERT INTO public.supporter_chapa_pledges (tenant_id, supporter_id, chapa_id)
        VALUES (v_tenant_id, v_supporter_id, v_chapa_id)
        ON CONFLICT (supporter_id, chapa_id) DO NOTHING;
      END IF;
    END LOOP;

    PERFORM public.upsert_supporter_leadership_links_from_chapas(
      v_supporter_id,
      v_tenant_id,
      p_chapa_ids,
      'landing'
    );
  END IF;

  PERFORM public.recompute_supporter_leadership_primary(v_supporter_id);

  PERFORM public.log_activity(
    v_tenant_id,
    'Novo apoiador via landing: ' || trim(p_name),
    'supporter',
    v_supporter_id
  );

  RETURN v_supporter_id;
END;
$$;

-- ========== BACKFILL (idempotente) ==========
SELECT set_config('app.bulk_leadership_link_sync', 'on', true);

-- 1) Vínculos a partir de supporters.leadership_id legado
INSERT INTO public.supporter_leadership_links (
  tenant_id,
  supporter_id,
  leadership_id,
  relationship_type,
  weight,
  is_primary,
  source
)
SELECT
  s.tenant_id,
  s.id,
  s.leadership_id,
  'legacy'::public.supporter_leadership_relationship,
  1,
  true,
  'migration'::public.supporter_leadership_link_source
FROM public.supporters s
WHERE s.leadership_id IS NOT NULL
ON CONFLICT (supporter_id, leadership_id) DO NOTHING;

-- 2) Vínculos derivados de pledges existentes (peso = soma vote_weight por liderança)
INSERT INTO public.supporter_leadership_links (
  tenant_id,
  supporter_id,
  leadership_id,
  relationship_type,
  weight,
  is_primary,
  source
)
SELECT
  s.tenant_id,
  p.supporter_id,
  c.leadership_id,
  'pledge'::public.supporter_leadership_relationship,
  SUM(c.vote_weight)::int,
  false,
  'migration'::public.supporter_leadership_link_source
FROM public.supporter_chapa_pledges p
JOIN public.supporters s ON s.id = p.supporter_id
JOIN public.leadership_chapas c ON c.id = p.chapa_id
GROUP BY s.tenant_id, p.supporter_id, c.leadership_id
ON CONFLICT (supporter_id, leadership_id) DO UPDATE SET
  relationship_type = CASE
    WHEN public.supporter_leadership_links.relationship_type IN ('assigned', 'legacy')
      AND EXCLUDED.weight > public.supporter_leadership_links.weight
    THEN 'pledge'
    WHEN public.supporter_leadership_links.relationship_type = 'pledge'
    THEN 'pledge'
    ELSE public.supporter_leadership_links.relationship_type
  END,
  weight = GREATEST(public.supporter_leadership_links.weight, EXCLUDED.weight),
  updated_at = now();

SELECT set_config('app.bulk_leadership_link_sync', 'off', true);

-- 3) Recalcular primária e espelho para todos os apoiadores com vínculos
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT supporter_id FROM public.supporter_leadership_links
  LOOP
    PERFORM public.recompute_supporter_leadership_primary(r.supporter_id);
  END LOOP;
END $$;

-- ========== RLS ==========
ALTER TABLE public.supporter_leadership_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY sll_select ON public.supporter_leadership_links FOR SELECT TO authenticated
  USING (public.is_super_admin() OR tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY sll_insert ON public.supporter_leadership_links FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR public.tenant_has_any_write(tenant_id, 'supporters')
    OR public.tenant_has_any_write(tenant_id, 'leaderships')
  );

CREATE POLICY sll_update ON public.supporter_leadership_links FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR public.tenant_has_any_write(tenant_id, 'supporters')
    OR public.tenant_has_any_write(tenant_id, 'leaderships')
  )
  WITH CHECK (
    public.is_super_admin()
    OR public.tenant_has_any_write(tenant_id, 'supporters')
    OR public.tenant_has_any_write(tenant_id, 'leaderships')
  );

CREATE POLICY sll_delete ON public.supporter_leadership_links FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR public.tenant_has_permission(tenant_id, 'supporters', 'delete')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supporter_leadership_links TO authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_supporter_leadership_primary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_supporter_leadership_links_from_chapas(uuid, uuid, uuid[], public.supporter_leadership_link_source) TO service_role;

REVOKE ALL ON FUNCTION public.set_syncing_leadership_mirror(boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_recomputing_leadership_primary() FROM PUBLIC, anon, authenticated;
