-- Hotfix: poll_snapshots não possui updated_at; expõe recorded_at como updated_at no JSON.

DO $do$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'get_tenant_reports_summary';

  IF def IS NULL THEN
    RAISE EXCEPTION 'get_tenant_reports_summary não encontrada';
  END IF;

  IF def NOT LIKE '%ps.updated_at%' THEN
    RETURN;
  END IF;

  def := replace(
    def,
    'json_agg(json_build_object(''type'', ps.snapshot_type, ''title'', ps.title, ''updated_at'', ps.updated_at)',
    'json_agg(json_build_object(''type'', ps.snapshot_type, ''title'', ps.title, ''updated_at'', ps.recorded_at)'
  );

  EXECUTE def;
END;
$do$;
