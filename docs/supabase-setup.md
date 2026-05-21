# Configuração Supabase — Strategos CRM

## Variáveis de ambiente

Copie `env.example` para `.env.local`:

```
VITE_SUPABASE_URL=https://ifefpxvmkyikqlnpcbxw.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

No deploy Cloudflare, configure as mesmas variáveis `VITE_*` no painel do Worker.

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

Arquivos em `supabase/migrations/` (ordem `01` → `04`). **Já aplicadas** no projeto remoto `politicos-hub` — não é necessário rodar de novo nesse banco.

Só execute `supabase db push` se for um **projeto Supabase novo** ou banco local vazio. Detalhes em [supabase/migrations/README.md](../supabase/migrations/README.md).
