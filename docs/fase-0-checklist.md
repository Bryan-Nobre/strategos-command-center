# Fase 0 — Checklist de saída

## P0 Auth e fluxo

- [x] SessionProvider + AuthProvider + TenantProvider
- [x] Estados: loading, authenticated, unauthenticated, onboarding, suspended
- [x] Router context serializável (sem QueryClient)
- [x] Login/logout com refresh de auth e limpeza de cache
- [x] Tratamento base 401/403 (`src/lib/api-errors.ts`)
- [x] ErrorBoundary global

## P0 Tenant e onboarding

- [x] Signup → tenant suspended (migration 08)
- [x] Status: active, suspended, pending, cancelled (plano trial em `tenant_plan`)
- [x] Tela conta suspensa / cancelada
- [x] Plan limits preparados (`src/types/tenant.ts`)
- [x] membershipRole no contexto

## P0 Multi-tenant

- [x] Query keys centralizadas com tenantId
- [x] clearTenantScopedCache no logout/troca tenant
- [x] Documento smoke test

## P1 Super admin

- [x] Listar tenants com filtros e métricas por cliente
- [x] Ativar/suspender/plano
- [x] Listar usuários (`/admin/users`)
- [x] Métricas: ativos, suspensos, novos 30d

## P1 Documentação

- [x] setup-local.md
- [x] architecture.md
- [x] smoke-test-multitenant.md
- [x] env.example atualizado

## Manual (você)

- [x] Aplicar migrations operacionais (`20260527120000`, `20260528120000`)
- [ ] Rodar smoke test com 2 campanhas
- [ ] Reiniciar `pnpm dev` após pull

## Próximo: Fase 1

CRUD completo, filtros reais, histórico de contato.
