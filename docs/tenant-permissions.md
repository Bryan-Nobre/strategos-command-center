# Permissões por cargo — Strategos CRM

## Modelo

| Camada | Responsabilidade |
|--------|------------------|
| **PostgreSQL** | `tenant_roles.permissions` (JSON) + RLS por ação |
| **Front-end** | Menu, botões e rotas (UX — não substitui RLS) |

## Cargos

- Tabela `tenant_roles` — **por campanha** (nome, descrição, permissões).
- **Administrador** (`is_full_access`): criado no signup; acesso total; não editável.
- Presets seed: Coordenador, Assessor, Operador, Visualizador (podem ser editados ou servir de base).
- Novos cargos: **Equipe → Cargos → Novo cargo**.

## Módulos

`dashboard`, `reports`, `polls`, `supporters`, `leaderships`, `demands`, `agenda`, `team`, `settings`

Cada módulo tem ações documentadas em `src/lib/permission-field-meta.ts`.

### Grupos na UI de cargos

1. **Visão geral** — Dashboard, Relatórios, Pesquisas  
2. **Dados da campanha** — Eleitores, Lideranças, Demandas, Agenda (CRUD + import/export)  
3. **Administração** — Equipe, Configurações  

Atalhos por módulo: **Somente leitura**, **Operação completa**, **Sem acesso**.

### Ações por módulo de dados

| Módulo | Opções configuráveis |
|--------|----------------------|
| Eleitores | Ver, Cadastrar, Editar, Excluir, Importar CSV, Exportar CSV |
| Lideranças | Ver, Cadastrar, Editar, Excluir |
| Demandas | Ver, Cadastrar, Editar/mover (Kanban), Excluir |
| Agenda | Ver, Cadastrar, Editar, Excluir |
| Pesquisas | Ver, Criar, Editar, Excluir snapshots |
| Relatórios | Ver, Exportar CSV |
| Configurações | Perfil, Landing, Metas, Notificações (abas separadas) |
| Equipe | Ver, Convidar, Gerenciar cargos |

## Fluxo

1. Dono cria campanha → cargo **Administrador** automático.
2. Em **Cargos**, define permissões (ver aba, CRUD, convites, landing…).
3. Em **Membros**, convida ou altera cargo do membro.
4. Sidebar e telas refletem `get_my_tenant_permissions`.

## RPCs

- `get_my_tenant_permissions(tenant_id)`
- `list_tenant_roles` / `upsert_tenant_role` / `delete_tenant_role`
- `update_member_custom_role`

## Próximos passos (opcional)

- Gates CRUD nas demais rotas (demandas, agenda, config…)
- Revogar convites
- Auditoria de alterações de cargo
