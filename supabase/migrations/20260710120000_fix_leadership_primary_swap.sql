-- Corrige 409 ao trocar liderança primária do apoiador no CRM.
-- Causa: upsert marcava is_primary=true antes de limpar o vínculo primário anterior,
-- violando idx_sll_one_primary_per_supporter (apenas um is_primary por apoiador).

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

  -- Limpa primária atual antes de promover a nova (evita violação de índice único).
  UPDATE public.supporter_leadership_links
  SET is_primary = false, updated_at = now()
  WHERE supporter_id = NEW.id;

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
      WHEN public.supporter_leadership_links.source = 'migration'
        THEN public.supporter_leadership_links.source
      ELSE 'manual'
    END,
    updated_at = now();

  PERFORM public.set_syncing_leadership_mirror(true);
  UPDATE public.supporters
  SET leadership_id = NEW.leadership_id
  WHERE id = NEW.id;
  PERFORM public.set_syncing_leadership_mirror(false);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trg_supporters_leadership_id_mirror_to_links IS
  'Espelha supporters.leadership_id em supporter_leadership_links. Limpa is_primary antes de promover nova liderança.';
