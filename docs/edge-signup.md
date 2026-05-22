# Edge Function: `signup-politician`

Cadastro de campanha **sem depender** do `auth.signUp` no browser (evita bloqueio por confirmação de e-mail, rate limit do Auth público e RPC sem JWT).

## Fluxo

1. Front chama `POST /functions/v1/signup-politician`
2. Edge usa **service_role** → `auth.admin.createUser` (e-mail já confirmado)
3. Edge chama RPC `setup_politician_tenant_for_user`
4. Edge devolve `session` + `tenantId` → front faz `setSession`

## Deploy

### 1. Migration (banco)

```powershell
supabase db push
```

Ou aplique `05 - signup_edge_rpc.sql` no SQL Editor se já usa migrations remotas.

### 2. Edge Function

```powershell
supabase functions deploy signup-politician --no-verify-jwt
```

Secrets opcionais (recomendado em produção):

```powershell
supabase secrets set SIGNUP_FUNCTION_SECRET=sua-chave-forte-aqui
```

No front (`.env.local` / Vercel), **mesmo valor**:

```
VITE_SIGNUP_FUNCTION_SECRET=sua-chave-forte-aqui
```

Sem o secret, a função aceita qualquer POST (útil só em dev).

## Variáveis automáticas na Edge

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

Nunca coloque `service_role` em variáveis `VITE_*`.

## CORS

A função responde a `OPTIONS` e permite origem `*` para SPA. Em produção restrita, ajuste `Access-Control-Allow-Origin` no `index.ts`.
