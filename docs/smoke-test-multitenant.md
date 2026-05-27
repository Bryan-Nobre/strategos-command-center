# Smoke test multi-tenant

Objetivo: garantir **isolamento absoluto** entre campanhas.

## Pré-requisitos

- Migration `09` aplicada
- Dois usuários de teste (ou signup duas campanhas)
- Super admin para ativar tenants

## Cenário

### Tenant A

1. Signup: `campanha-a@test.local` / slug `campanha-a`
2. Admin ativa status **active**
3. Cadastre apoiador **João Silva** (bairro Centro)

### Tenant B

1. Signup: `campanha-b@test.local` / slug `campanha-b`
2. Admin ativa status **active**
3. Cadastre apoiador **Maria Souza** (bairro Norte)

## Validações

| # | Teste | Resultado esperado |
|---|--------|-------------------|
| 1 | Login A → Eleitores | Só **João Silva** |
| 2 | Login B → Eleitores | Só **Maria Souza** |
| 3 | A → Dashboard métricas | Contagens só da campanha A |
| 4 | Logout A → Login B | Sem flash de dados de A |
| 5 | DevTools → Application → localStorage | `strategos_active_tenant_id` muda ao trocar conta |
| 6 | Super admin → Clientes | A e B listados; super admin não aparece como cliente |

## Cache React Query

Após logout, queries tenant-scoped devem ser removidas (`clearTenantScopedCache`).

Se ao logar em B aparecer dado de A por 1 frame:

1. Verifique `queryKeys.*(tenantId)` nos hooks
2. Confirme RLS no Supabase (`02 - rls_and_helpers.sql`)

## SQL de verificação (Supabase SQL Editor)

```sql
-- Como super_admin ou service_role — NUNCA no front
SELECT tenant_id, name FROM supporters ORDER BY tenant_id;
```

Cada linha deve ter um único `tenant_id` coerente com a campanha do dono.

## Critério de aprovação

- [ ] Nenhum vazamento visual entre tenants
- [ ] RLS bloqueia SELECT cross-tenant (testar via API com token de A tentando id de B — futuro)
- [ ] Suspended bloqueia CRM até ativação
- [ ] Signup → suspended → admin active → CRM OK
