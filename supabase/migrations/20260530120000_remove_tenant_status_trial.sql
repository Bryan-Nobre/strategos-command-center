-- Remove trial de tenant_status (período trial comercial = tenants.plan, não status).

UPDATE public.tenants
SET status = 'active'
WHERE status = 'trial';

DROP TRIGGER IF EXISTS tenants_sync_landing_publish ON public.tenants;

ALTER TYPE public.tenant_status RENAME TO tenant_status_old;

CREATE TYPE public.tenant_status AS ENUM (
  'active',
  'suspended',
  'pending',
  'cancelled'
);

ALTER TABLE public.tenants
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.tenants
  ALTER COLUMN status TYPE public.tenant_status
  USING status::text::public.tenant_status;

ALTER TABLE public.tenants
  ALTER COLUMN status SET DEFAULT 'active';

DROP TYPE public.tenant_status_old;

CREATE TRIGGER tenants_sync_landing_publish
  AFTER UPDATE OF status ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_landing_on_tenant_activate();

COMMENT ON TYPE public.tenant_status IS
  'active = CRM operacional; suspended = aguardando pagamento; pending = análise; cancelled = encerrado. Plano comercial (trial/basic/pro) em tenants.plan.';
