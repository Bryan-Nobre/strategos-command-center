# Migrations — Strategos CRM

Execute **nesta ordem** (o prefixo `01`, `02`… define a sequência):

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 01 | `01 - initial_schema.sql` | Enums, tabelas, triggers, perfil automático |
| 02 | `02 - rls_and_helpers.sql` | Funções auxiliares + políticas RLS |
| 03 | `03 - rpc_onboarding.sql` | RPCs (landing, tenant, dashboard, convites) |
| 04 | `04 - harden_function_grants.sql` | Restrição de `EXECUTE` em funções sensíveis |

## Preciso rodar todas no meu projeto?

### Projeto remoto `politicos-hub` (já linkado)

**Não.** Essas migrations **já foram aplicadas** no Supabase em nuvem durante o setup inicial. Rodar de novo pode falhar (tipos/tabelas já existem).

Para conferir no dashboard: **Database → Migrations**.

### Banco novo (outro projeto Supabase ou `supabase start` local)

**Sim.** Aplique todas em ordem:

```powershell
# Na raiz do repo, com Supabase CLI instalado e logado
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

Ou, no SQL Editor do Supabase, cole e execute cada arquivo **01 → 04** na ordem.

## Comandos úteis

```powershell
supabase migration list    # lista status local vs remoto
supabase db push           # aplica pendentes no projeto linkado
supabase db reset          # CUIDADO: apaga dados locais e reaplica tudo
```

## Histórico no remoto (referência)

Versões já registradas em `politicos-hub`:

- `initial_schema`
- `rls_and_helpers`
- `rpc_onboarding`
- `harden_function_grants`

Os nomes dos arquivos locais foram renomeados para leitura humana; o conteúdo SQL é o mesmo.
