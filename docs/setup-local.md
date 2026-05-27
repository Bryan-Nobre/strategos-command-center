# Setup local — Strategos CRM

## Pré-requisitos

- Node.js ≥ 20.19
- pnpm 11+
- Conta Supabase (projeto remoto ou `supabase start` local)

## Passos

1. Clone o repositório e instale dependências:

```bash
pnpm install
```

2. Copie variáveis de ambiente:

```bash
cp env.example .env.local
```

Preencha `VITE_SUPABASE_URL` (sem `/rest/v1`) e `VITE_SUPABASE_ANON_KEY`.

3. Aplique migrations no Supabase (SQL Editor ou CLI):

```bash
supabase db push
```

Lista completa: [supabase-migrations.md](./supabase-migrations.md). No remoto `politicos-hub`, use `supabase db push` para aplicar apenas migrations pendentes.

4. Configure Auth redirect URLs no Supabase (Authentication → URL Configuration):

- Site URL: `http://localhost:3080`
- Redirect: `http://localhost:3080/auth/callback`

5. Inicie o dev server:

```bash
pnpm dev
```

App em `http://localhost:3080`.

## Super admin (seed)

Ver `docs/supabase-setup.md` — e-mail `admin_supremo@strategos.app`.

## Fluxo de teste rápido

1. Signup de campanha → tenant **suspended**
2. Login → tela de conta suspensa
3. Super admin → `/admin/tenants` → status **Ativo**
4. Cliente → CRM liberado

## Troubleshooting

| Problema | Ação |
|----------|------|
| Erro de hidratação | Hard refresh; apague `node_modules/.vite`; reinicie `pnpm dev` |
| 401 / sessão perdida | Verifique cookies; confirme redirect URLs |
| Dados de outro tenant | Bug crítico — ver `docs/smoke-test-multitenant.md` |
