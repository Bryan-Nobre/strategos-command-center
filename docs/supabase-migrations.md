# Migrations — Strategos CRM

Arquivos em `supabase/migrations/` no padrão Supabase CLI: `<timestamp>_nome.sql`.

| Timestamp (UTC) | Arquivo | Conteúdo |
|-----------------|---------|----------|
| `20260521005843` | `initial_schema` | Enums, tabelas, triggers, perfil automático |
| `20260521005925` | `rls_and_helpers` | Funções auxiliares + políticas RLS |
| `20260521005947` | `rpc_onboarding` | RPCs (landing, tenant, dashboard legado, convites) |
| `20260521010743` | `harden_function_grants` | Restrição de `EXECUTE` em funções sensíveis |
| `20260522021452` | `signup_edge_rpc` | RPC `setup_politician_tenant_for_user` (Edge signup) |
| `20260522021955` | `tenant_team_profiles` | RLS equipe + FK `tenant_members` → `profiles` |
| `20260522023014` | `exclude_super_admin_tenants` | Bloqueia campanha para `super_admin` |
| `20260522023424` | `tenant_default_suspended` | Novos clientes `suspended` + landing ao ativar |
| `20260527010342` | `tenant_status_trial_cancelled` | Enum `tenant_status`: trial, cancelled |
| `20260527120000` | `operational_dashboard_rpc` | RPC `get_tenant_operational_dashboard` |
| `20260528120000` | `operational_dashboard_phase2` | Insights no servidor + wrapper legado |
| `20260529120000` | `plan_limits_enforcement` | `plan_limit_definitions`, triggers de limite, RPC `get_tenant_plan_usage` |
| `20260530120000` | `remove_tenant_status_trial` | Remove `trial` de `tenant_status` (fica só em `tenant_plan`) |
| `20260531120000` | `admin_plan_limits_rpc` | RPC admin list/update + RLS em `plan_limit_definitions` |
| `20260601120000` | `tenant_custom_roles` | Cargos customizados + permissões granulares + RLS |

## Projeto remoto `politicos-hub`

As migrations `20260521005843` … `20260527010342` **já estão aplicadas** no remoto.

Pendente no remoto (após alinhar nomes locais):

- `20260527120000_operational_dashboard_rpc.sql`

```powershell
supabase migration list   # conferir Local | Remote
supabase db push          # aplica só a pendente
```

## Banco novo (outro projeto ou `supabase start` local)

```powershell
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

Ou `supabase db reset` em ambiente local (apaga dados).

## Comandos úteis

```powershell
supabase migration list
supabase db push
supabase migration repair <version> --status applied   # só se histórico divergir
supabase db reset                                    # CUIDADO: só local / descartável
```

## Edge Function `signup-politician`

Deploy e uso: [edge-signup.md](./edge-signup.md).
