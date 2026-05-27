# Arquitetura — Strategos CRM

## Visão geral

SaaS multi-tenant para campanhas políticas:

- **Frontend:** React 19 + Vite + TanStack Start (SSR) + TanStack Router + React Query
- **Backend:** Supabase (Auth, PostgreSQL, RLS, Edge Functions)
- **Deploy:** Vercel (Nitro preset)

## Camadas

```
src/routes/          → páginas (file-based routing)
src/services/        → chamadas Supabase (domínio)
src/hooks/           → React Query (cache por tenant)
src/contexts/        → Session, Auth, Tenant (UX)
src/lib/supabase/    → client, session, guards de rota
supabase/migrations/ → schema + RLS (fonte de verdade)
```

## Multi-tenant

- Cada **tenant** = uma campanha/workspace
- Isolamento via **RLS** (`tenant_id` + `auth.uid()`)
- Cache React Query: chaves em `src/lib/query-keys.ts` **sempre com tenantId**
- Nunca filtrar dados sensíveis só no client — comentário padrão:

```ts
// Segurança real deve ser validada no backend/API.
```

## Auth (Fase 0)

| Provider | Responsabilidade |
|----------|------------------|
| `SessionProvider` | Sessão Supabase (token, refresh) |
| `AuthProvider` | Perfil, tenants, status (`loading` / `authenticated` / `onboarding` / `suspended`) |
| `TenantProvider` | Campanha ativa, role, limites de plano (UX) |

Guards de rota: `beforeLoad` + `ensureAppAuth` / `ensureAdminAuth` (SSR com cookies).

## Status do tenant

| Status | CRM |
|--------|-----|
| `active` | Liberado |
| `trial` | Liberado (limites futuros) |
| `suspended` | Bloqueado — aguardando pagamento |
| `pending` | Bloqueado — análise |
| `cancelled` | Bloqueado — encerrado |

## Super admin

- `platform_role = super_admin` no perfil
- Painel `/admin/*` — não cria tenant de campanha
- Ativa clientes após pagamento manual (billing futuro)

## Estrutura preparada para

- Billing (planos + `PLAN_LIMITS` em `src/types/tenant.ts`)
- Feature flags por plano
- Auditoria LGPD (Fase 2)
- `campaign_id` futuro (hoje tenant = campanha)
