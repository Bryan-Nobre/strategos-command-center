-- Permite listar nomes de colegas do mesmo tenant (tela Configurações → Equipe)
DROP POLICY IF EXISTS profiles_select ON public.profiles;

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR id IN (
      SELECT tm_peer.user_id
      FROM public.tenant_members tm_self
      JOIN public.tenant_members tm_peer ON tm_peer.tenant_id = tm_self.tenant_id
      WHERE tm_self.user_id = auth.uid()
    )
  );

-- FK explícita para embed PostgREST (tenant_members → profiles)
ALTER TABLE public.tenant_members
  DROP CONSTRAINT IF EXISTS tenant_members_user_id_fkey;

ALTER TABLE public.tenant_members
  ADD CONSTRAINT tenant_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
