-- Strategos CRM: multi-tenant schema

-- Enums
CREATE TYPE public.platform_role AS ENUM ('user', 'super_admin');
CREATE TYPE public.tenant_role AS ENUM ('owner', 'coordinator', 'advisor', 'leadership', 'operator', 'viewer');
CREATE TYPE public.tenant_plan AS ENUM ('trial', 'basic', 'pro', 'enterprise');
CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE public.supporter_status AS ENUM ('interessado', 'apoiador', 'lideranca', 'oposicao', 'indeciso');
CREATE TYPE public.support_level AS ENUM ('forte', 'medio', 'fraco', 'indeciso');
CREATE TYPE public.supporter_source AS ENUM ('manual', 'landing', 'import');
CREATE TYPE public.demand_category AS ENUM ('saude', 'educacao', 'infraestrutura', 'seguranca', 'iluminacao');
CREATE TYPE public.demand_status AS ENUM ('aberto', 'em_andamento', 'resolvido');
CREATE TYPE public.demand_priority AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE public.agenda_event_type AS ENUM ('reuniao', 'evento', 'caminhada', 'visita');
CREATE TYPE public.poll_snapshot_type AS ENUM ('intencao_voto', 'aprovacao_bairro', 'crescimento_apoiadores', 'custom');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- Tenants (workspace per politician)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan public.tenant_plan NOT NULL DEFAULT 'trial',
  status public.tenant_status NOT NULL DEFAULT 'active',
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_status ON public.tenants(status);

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  platform_role public.platform_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant membership
CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.tenant_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);

-- Landing pages
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  headline TEXT,
  bio TEXT,
  photo_url TEXT,
  video_url TEXT,
  proposals JSONB NOT NULL DEFAULT '[]'::jsonb,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  whatsapp TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);

-- Leaderships
CREATE TABLE public.leaderships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT,
  estimated_votes INTEGER NOT NULL DEFAULT 0,
  supporter_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leaderships_tenant ON public.leaderships(tenant_id);

-- Supporters (apoiadores/eleitores)
CREATE TABLE public.supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  neighborhood TEXT,
  city TEXT,
  electoral_zone TEXT,
  electoral_section TEXT,
  status public.supporter_status NOT NULL DEFAULT 'interessado',
  support_level public.support_level NOT NULL DEFAULT 'indeciso',
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  leadership_id UUID REFERENCES public.leaderships(id) ON DELETE SET NULL,
  source public.supporter_source NOT NULL DEFAULT 'manual',
  interest TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supporters_tenant ON public.supporters(tenant_id);
CREATE INDEX idx_supporters_status ON public.supporters(tenant_id, status);
CREATE INDEX idx_supporters_leadership ON public.supporters(leadership_id);

ALTER TABLE public.leaderships
  ADD CONSTRAINT leaderships_supporter_id_fkey
  FOREIGN KEY (supporter_id) REFERENCES public.supporters(id) ON DELETE SET NULL;

-- Demands (kanban)
CREATE TABLE public.demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category public.demand_category NOT NULL DEFAULT 'infraestrutura',
  status public.demand_status NOT NULL DEFAULT 'aberto',
  priority public.demand_priority NOT NULL DEFAULT 'media',
  neighborhood TEXT,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_demands_tenant_status ON public.demands(tenant_id, status);

-- Agenda events
CREATE TABLE public.agenda_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  event_type public.agenda_event_type NOT NULL DEFAULT 'reuniao',
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agenda_events_tenant_date ON public.agenda_events(tenant_id, event_date);

-- Poll snapshots
CREATE TABLE public.poll_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  snapshot_type public.poll_snapshot_type NOT NULL,
  title TEXT,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_poll_snapshots_tenant ON public.poll_snapshots(tenant_id, snapshot_type);

-- Activities feed
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_tenant_created ON public.activities(tenant_id, created_at DESC);

-- Team invitations
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.tenant_role NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_invitations_tenant ON public.team_invitations(tenant_id);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);

-- User preferences per tenant
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light',
  notifications JSONB NOT NULL DEFAULT '{"demands":true,"polls":true,"agenda":true,"weekly_email":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER landing_pages_updated_at BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER leaderships_updated_at BEFORE UPDATE ON public.leaderships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER supporters_updated_at BEFORE UPDATE ON public.supporters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER demands_updated_at BEFORE UPDATE ON public.demands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER agenda_events_updated_at BEFORE UPDATE ON public.agenda_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Activity logger
CREATE OR REPLACE FUNCTION public.log_activity(
  p_tenant_id UUID,
  p_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activities (tenant_id, message, entity_type, entity_id)
  VALUES (p_tenant_id, p_message, p_entity_type, p_entity_id);
END;
$$;
