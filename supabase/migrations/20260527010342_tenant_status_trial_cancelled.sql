-- Fase 0: status SaaS (trial, cancelled) + índices operacionais

ALTER TYPE public.tenant_status ADD VALUE IF NOT EXISTS 'trial';
ALTER TYPE public.tenant_status ADD VALUE IF NOT EXISTS 'cancelled';

CREATE INDEX IF NOT EXISTS idx_tenants_status_plan ON public.tenants (status, plan);

COMMENT ON TYPE public.tenant_status IS
  'active/trial = CRM operacional; suspended = aguardando pagamento; pending = análise; cancelled = encerrado';
