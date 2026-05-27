# Configuração Supabase — Strategos CRM

## Variáveis de ambiente

Copie `env.example` para `.env.local`:

```
VITE_SUPABASE_URL=https://ifefpxvmkyikqlnpcbxw.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

**Importante:** `VITE_SUPABASE_URL` é a **Project URL** (`https://xxx.supabase.co`), **sem** `/rest/v1`. Se incluir `/rest/v1`, o signup/login retorna 404 em `/rest/v1/auth/v1/...`.

No deploy **Vercel**, configure as mesmas variáveis `VITE_*` no painel do projeto. Ver [deploy-vercel.md](deploy-vercel.md).

## Cadastro (Edge Function)

O signup de campanha usa a Edge Function **`signup-politician`**. Ver [edge-signup.md](edge-signup.md) para deploy.

## Auth — Confirmação de e-mail (legado no signUp direto)

Se **Confirm email** estiver ativo (padrão em projetos novos), o usuário é criado no Auth mas **não recebe sessão** até clicar no link do e-mail. A RPC `setup_politician_tenant` exige usuário autenticado — o app mostra erro mesmo com o usuário já no Supabase.

**Desenvolvimento / MVP:** Supabase → **Authentication → Providers → Email** → desmarque **Confirm email**.

**Produção com confirmação:** após confirmar o e-mail, o usuário faz login; se a campanha não foi criada, cadastre de novo com outro slug ou conclua via suporte (fluxo de “retomar cadastro” pode ser evoluído).

## Auth — Redirect URLs

No dashboard Supabase → Authentication → URL Configuration:

- Site URL: `http://localhost:3080`
- Redirect URLs: `http://localhost:3080/auth/callback`, URL de produção equivalente

## Super Admin (conta de plataforma)

Conta criada para gestão SaaS:

| Campo | Valor |
|-------|--------|
| E-mail | `admin_supremo@strategos.app` |
| Senha | `Strategos@Admin2026!` |
| Papel | `super_admin` |

Login em `/login` → redireciona para `/admin/tenants`.

**Altere a senha** no primeiro acesso (Supabase Dashboard → Authentication → Users).

Para promover outro usuário manualmente:

```sql
UPDATE public.profiles
SET platform_role = 'super_admin'
WHERE id = '<uuid-do-usuario>';
```

## Fluxo principal

1. `/signup` — cria usuário + tenant + landing via RPC `setup_politician_tenant`
2. `/dashboard` — CRM com RLS por `tenant_id`
3. `/p/:slug` — captação pública via RPC `register_supporter_from_landing`
4. `/invite/:token` — aceitar convite de equipe

## Migrations

Arquivos em `supabase/migrations/` (padrão `<timestamp>_nome.sql`). As migrations iniciais **já estão aplicadas** no remoto `politicos-hub`; pode haver pendente `20260527120000_operational_dashboard_rpc`.

Execute `supabase db push` para aplicar pendentes ou em **projeto Supabase novo**. Detalhes em [supabase-migrations.md](./supabase-migrations.md).
