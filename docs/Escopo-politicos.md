# Strategos CRM — Escopo do Produto (Politicos)

**Documento:** Escopo-politicos  
**Projeto:** strategos-command-center  
**Versão:** 1.0 (estado atual do repositório)  
**Data de referência:** maio/2026  
**Stack:** React 19 · Vite · TanStack Router · React Query · Supabase (Auth, PostgreSQL, RLS)

---

## Sumário

1. [Visão geral do produto](#1-visão-geral-do-produto)
2. [Arquitetura técnica](#2-arquitetura-técnica)
3. [Modelo de dados](#3-modelo-de-dados)
4. [Autenticação e fluxos de login](#4-autenticação-e-fluxos-de-login)
5. [Super Admin — escopo e funcionalidades](#5-super-admin--escopo-e-funcionalidades)
6. [Cliente (campanha) — estrutura do app](#6-cliente-campanha--estrutura-do-app)
7. [Dashboard — central operacional](#7-dashboard--central-operacional)
8. [Demais módulos do cliente](#8-demais-módulos-do-cliente)
9. [UX global](#9-ux-global)
10. [Limitações atuais](#10-limitações-atuais)
11. [Fluxos resumidos](#11-fluxos-resumidos)
12. [Melhorias e adições sugeridas](#12-melhorias-e-adições-sugeridas)
13. [Resumo executivo](#13-resumo-executivo)

---

## 1. Visão geral do produto

O **Strategos CRM** é um SaaS **multi-tenant** para gestão de campanhas políticas. Cada cliente (político/campanha) opera em um **tenant** isolado — workspace com dados próprios de apoiadores, lideranças, demandas, agenda, pesquisas e equipe.

### Perfis de uso

| Perfil | Quem é | Área logada |
|--------|--------|-------------|
| **Cliente (campanha)** | Político, coordenador, equipe | `/dashboard`, `/eleitores`, etc. |
| **Super Admin (plataforma)** | Operador do SaaS Strategos | `/admin/*` |

### Rotas públicas

| Rota | Função |
|------|--------|
| `/login` | Autenticação |
| `/signup` | Cadastro de nova campanha |
| `/p/{slug}` | Landing pública da campanha |
| `/invite/{token}` | Aceite de convite para equipe |

### Princípio de segurança

| Camada | Papel |
|--------|--------|
| Front-end (rotas, contextos, filtros) | **UX** — orientação e experiência |
| PostgreSQL + **RLS** + RPCs | **Verdade absoluta** — isolamento e permissões |

> Toda regra crítica deve existir no backend. Guards de rota não substituem RLS.

---

## 2. Arquitetura técnica

### Estrutura de pastas

| Pasta | Responsabilidade |
|-------|------------------|
| `src/routes/` | Páginas (roteamento por arquivo) |
| `src/services/` | Chamadas Supabase (domínio) |
| `src/hooks/` | React Query (cache por tenant) |
| `src/contexts/` | Sessão, Auth, Tenant, Tema |
| `src/components/` | UI (layout, dashboard, formulários) |
| `supabase/migrations/` | Schema, RLS, funções RPC |

### Multi-tenant

- Cada registro sensível possui `tenant_id`.
- Cache React Query: chaves sempre incluem `tenantId` (`src/lib/query-keys.ts`).
- Nunca confiar apenas em filtro client-side para isolamento de dados.

### Deploy e UI

| Item | Detalhe |
|------|---------|
| Deploy | Vercel (preset Nitro) |
| Temas | Claro / escuro / sistema (`ThemeProvider` + tokens CSS) |
| Tipografia | Inter (Google Fonts) |

### Providers de autenticação (cliente)

| Provider | Função |
|----------|--------|
| `SessionProvider` | Sessão Supabase (token, refresh) |
| `AuthProvider` | Perfil, tenants, status (`loading`, `authenticated`, `onboarding`, `suspended`) |
| `TenantProvider` | Campanha ativa, role, limites de plano (UX) |

---

## 3. Modelo de dados

### Entidades principais

| Entidade | Função |
|----------|--------|
| `tenants` | Campanha/workspace (nome, slug, plano, status) |
| `profiles` | Perfil do usuário (`platform_role`, nome, telefone) |
| `tenant_members` | Vínculo usuário ↔ campanha + `role` |
| `supporters` | Apoiadores / eleitores |
| `leaderships` | Lideranças territoriais |
| `demands` | Demandas comunitárias (Kanban) |
| `agenda_events` | Eventos da agenda |
| `poll_snapshots` | Pesquisas + metas manuais |
| `activities` | Feed de atividades |
| `team_invitations` | Convites de equipe |
| `landing_pages` | Página pública |
| `user_preferences` | Tema e notificações por usuário/tenant |

### Status da campanha (`tenant_status`)

| Status | CRM liberado? | Comportamento |
|--------|:-------------:|---------------|
| `active` | Sim | Operação normal |
| `suspended` | Não | Bloqueio — aguardando ativação / pagamento |
| `pending` | Não | Bloqueio — em análise |
| `cancelled` | Não | Bloqueio — encerrado |

**Fluxo comercial atual:** novo cadastro entra **suspenso**; o Super Admin altera **status** para `active` e ajusta o **plano** (`trial`, `basic`, `pro`…) conforme contrato.

> **Trial** é plano comercial (`tenant_plan`), não status de campanha.

### Planos (`tenant_plan`)

| Plano | Apoiadores (limite UX) | Equipe | Regiões | Export | Pesquisas |
|-------|------------------------|--------|---------|--------|-----------|
| `trial` | 500 | 3 | 5 | Sim | Não |
| `basic` | 2.000 | 5 | 15 | Sim | Sim |
| `pro` | 10.000 | 15 | 50 | Sim | Sim |
| `enterprise` | Ilimitado* | Ilimitado* | Ilimitado* | Sim | Sim |

\*Valores definidos em `PLAN_LIMITS` (`src/types/tenant.ts`). Enforcement completo no front ainda parcial.

### Papéis na campanha (`tenant_role`)

| Role | Uso típico |
|------|------------|
| `owner` | Dono da campanha |
| `coordinator` | Coordenador |
| `advisor` | Assessor |
| `leadership` | Liderança |
| `operator` | Operador |
| `viewer` | Somente leitura (RLS; UI pouco diferenciada) |

### Papel na plataforma (`platform_role`)

| Valor | Acesso |
|-------|--------|
| `user` | CRM da campanha |
| `super_admin` | Painel `/admin/*` + link Super Admin na sidebar |

### Enums operacionais (resumo)

| Domínio | Valores |
|---------|---------|
| Status apoiador | `interessado`, `apoiador`, `lideranca`, `oposicao`, `indeciso` |
| Nível de apoio | `forte`, `medio`, `fraco`, `indeciso` |
| Status demanda | `aberto`, `em_andamento`, `resolvido` |
| Categoria demanda | `saude`, `educacao`, `infraestrutura`, `seguranca`, `iluminacao` |
| Prioridade demanda | `baixa`, `media`, `alta` |
| Tipo evento agenda | `reuniao`, `evento`, `caminhada`, `visita` |
| Snapshot pesquisa | `intencao_voto`, `aprovacao_bairro`, `crescimento_apoiadores`, `custom` |

---

## 4. Autenticação e fluxos de login

### 4.1 Login (`/login`)

| Etapa | Ação |
|-------|------|
| 1 | E-mail + senha → `signInWithPassword` (Supabase Auth) |
| 2 | Carrega perfil, tenants, campanha ativa, membership role |
| 3 | Redireciona conforme perfil (tabela abaixo) |
| 4 | Se tenant não operacional → tela `TenantAccessBlocked` |

**Redirecionamento pós-login**

| Condição | Destino |
|----------|---------|
| `platform_role = super_admin` | `/admin/tenants` |
| Campanha ativa operacional | `/dashboard` |
| Sem tenant / onboarding incompleto | `/signup` |

### 4.2 Cadastro (`/signup`)

| Campo / ação | Detalhe |
|--------------|---------|
| Dados | Nome, e-mail, senha, nome da campanha, slug, slogan |
| Backend | Edge Function de signup e/ou RPC `setup_politician_tenant` |
| Pós-cadastro | Tenant geralmente `suspended`; mensagem de ativação pelo admin |
| Destino | `/dashboard` (com bloqueio se ainda suspenso) |

### 4.3 Logout

- `signOut` + limpeza de cache tenant-scoped + `/login`.

### 4.4 Convite (`/invite/{token}`)

| Etapa | Detalhe |
|-------|---------|
| Pré-requisito | Usuário logado |
| Ação | RPC `accept_team_invitation` |
| Resultado | Tenant ativo salvo localmente → `/dashboard` |

### 4.5 Rota raiz (`/`)

| Estado | Redirecionamento |
|--------|------------------|
| Super admin logado | `/admin/tenants` |
| Cliente com campanha | `/dashboard` |
| Logado sem campanha | `/signup` |
| Anônimo | `/login` |

### Guards de rota (UX)

| Guard | Rota | Regra |
|-------|------|-------|
| `ensureAppAuth` | `/_app/*` | Sessão + tenant (exceto super admin sem campanha) |
| `ensureAdminAuth` | `/_admin/*` | Sessão + `super_admin` |
| `ensurePublicAuthRedirect` | login, signup, index | Evita acesso duplicado se já logado |

---

## 5. Super Admin — escopo e funcionalidades

**Acesso:** `profiles.platform_role = 'super_admin'`  
**Guard:** `ensureAdminAuth` — demais usuários vão para `/dashboard`.

### Menu administrativo

| Item | Rota | Status |
|------|------|--------|
| Clientes | `/admin/tenants` | Implementado |
| Usuários | `/admin/users` | Implementado |
| Métricas | `/admin/metricas` | Implementado |
| Auditoria | — | Placeholder na sidebar (sem página) |

### 5.1 Clientes (`/admin/tenants`)

| Funcionalidade | Detalhe |
|----------------|---------|
| Listagem | Todos os tenants da plataforma |
| Filtros | Status, plano, busca por nome/slug |
| Edição | Alterar **status** e **plano** por cliente |
| Link externo | Abrir landing `/p/{slug}` |
| Processo | Novos cadastros suspensos → ativar após pagamento manual |

### 5.2 Usuários (`/admin/users`)

| Coluna | Conteúdo |
|--------|----------|
| Nome | `full_name` do perfil |
| Campanhas | Quantidade de tenants vinculados |
| Cadastro | Data de criação |
| Edição | Somente leitura |

### 5.3 Métricas (`/admin/metricas`)

| KPI | Descrição |
|-----|-----------|
| Total clientes | Tenants na plataforma |
| Ativos / Trial | Campanhas operacionais |
| Suspensos | Aguardando ativação |
| Pendentes | Em análise |
| Novos (30 dias) | Cadastros recentes |
| Apoiadores (global) | Soma cross-tenant |
| Demandas (global) | Soma cross-tenant |

### O que o Super Admin não faz

- Não substitui o CRM operacional da campanha no painel admin.
- Não possui, hoje, billing automatizado, impersonate ou auditoria completa.

---

## 6. Cliente (campanha) — estrutura do app

**Guard:** `ensureAppAuth`  
**Layout:** Sidebar + Topbar + área de conteúdo

### Menu lateral — Visão Geral

| Item | Rota | Função |
|------|------|--------|
| Dashboard | `/dashboard` | Central operacional estratégica |
| Relatórios | `/relatorios` | Export CSV e visualização |
| Pesquisas | `/pesquisas` | Editar dados de gráficos |

### Menu lateral — Operação

| Item | Rota | Função |
|------|------|--------|
| Eleitores | `/eleitores` | CRUD apoiadores, CSV |
| Lideranças | `/liderancas` | CRUD lideranças |
| Demandas | `/demandas` | Kanban + responsável |
| Agenda | `/agenda` | Eventos e calendário |

### Menu lateral — Administração (campanha)

| Item | Rota | Função |
|------|------|--------|
| Configurações | `/configuracoes` | Perfil, landing, metas, tema |
| Equipe | `/equipe` | Membros e convites |

### Extra na sidebar

| Condição | Item |
|----------|------|
| Usuário é `super_admin` | Link **Super Admin** → `/admin/tenants` |

### Topbar (todas as páginas do app)

| Área | Conteúdo |
|------|----------|
| Esquerda | Ícone da seção, título, subtítulo contextual, nome da campanha (XL) |
| Centro | Busca (visual; sem backend unificado) |
| Direita | Tema, notificações (ícone), card do usuário, logout |

---

## 7. Dashboard — central operacional

Rota: **`/dashboard`**  
Título na topbar: **Dashboard** — *Painel operacional da campanha*

### Ordem das seções (de cima para baixo)

| # | Seção | Descrição |
|---|--------|-----------|
| 1 | Header operacional | Saudação, briefing, pills rápidas |
| 2 | Faixa operacional | Resumo em linha (riscos, demandas, destaques) |
| 3 | Alertas acionáveis | Lista priorizada com sugestão e CTA |
| 4 | Resumo do dia | 4 métricas do dia local |
| 5 | KPIs principais | 4 cards com contexto temporal (7 dias) |
| 6 | Próximas ações | Links derivados por regras |
| 7 | Inteligência territorial | Críticos + promissores |
| 8 | Pipeline da base | Funil por estágio de apoiador |
| 9 | Metas personalizadas | Progresso vs alvo |
| 10 | Gráficos | Crescimento, intenção, aprovação |
| 11 | Atividades recentes | Feed das últimas 10 ações |

### 7.1 Header operacional

| Elemento | Comportamento |
|----------|---------------|
| Saudação | Por horário + primeiro nome do perfil |
| Briefing | Frase dinâmica (alertas + territórios críticos) |
| Pills | Até 4 itens: apoiadores 7d, demandas sem responsável, territórios, destaque positivo |

### 7.2 Alertas — regras automáticas

| Regra | Severidade | CTA típico |
|-------|------------|------------|
| Oposição ≥ 25% no território crítico | Alta | `/eleitores?bairro=` |
| ≥ 8 demandas abertas no bairro | Média | `/demandas?bairro=` |
| Indecisão ≥ 35% no bairro | Média | `/eleitores?bairro=` |
| ≥ 3 demandas abertas sem responsável | Alta | `/demandas?semResponsavel=1` |

> Alertas calculados no **cliente** a partir de apoiadores e demandas (RLS no Supabase). Máximo ~8 alertas na lista.

### 7.3 KPIs (RPC `get_tenant_operational_dashboard`)

| Card | Métrica | Contexto extra |
|------|---------|----------------|
| Apoiadores | `total_supporters` | Δ% 7 dias vs 7 dias anteriores |
| Apoio forte | `strong_support` | Idem |
| Lideranças | `leaderships` | Total na base |
| Demandas abertas | `open_demands` | Novas na semana + total abertas |

### 7.4 Territórios — score

**Fórmula interna (score bruto):**

```
score = forte% − indecisos% − oposição% − (demandas_abertas × 3)
```

| Exibição | Detalhe |
|----------|---------|
| Score 0–100 | Normalizado entre bairros da campanha |
| Badge | Crítico / Atenção / Promissor |
| Top 5 | Críticos (menor score) e promissores (maior score) |

**Sem tendência histórica** (ex.: “↑ oposição”) — não há série temporal por bairro ainda.

### 7.5 Pipeline (funil)

| Estágio fixo | Chave no banco |
|--------------|----------------|
| Interessado | `interessado` |
| Apoiador | `apoiador` |
| Liderança | `lideranca` |

- Tabela com total, % da base, proporção vs etapa anterior.
- Status fora do funil fixo → badges extras.
- **Nota:** proporção entre etapas ≠ conversão causal de funil de vendas.

### 7.6 Metas personalizadas

| Configuração | Onde |
|--------------|------|
| CRUD de metas | Configurações → aba Metas |
| Persistência | `poll_snapshots` (`custom`, title `manual_goals`) |

| Métrica da meta | Cálculo |
|----------------|---------|
| `new_supporters` | Apoiadores criados no período |
| `resolved_demands` | Demandas resolvidas no período |
| `new_strong_supporters` | Novos com `support_level = forte` |

| Status | Condição |
|--------|----------|
| No ritmo | `valor ≥ alvo` |
| Em risco | `valor ≥ 70% do alvo` |
| Atrasado | abaixo de 70% |

### 7.7 Gráficos

| Gráfico | Fonte (`poll_snapshots`) | Narrativa automática |
|---------|--------------------------|----------------------|
| Crescimento de apoiadores | `crescimento_apoiadores` | Sim, se ≥ 2 pontos |
| Intenção de voto | `intencao_voto` | Sim |
| Aprovação por bairro | `aprovacao_bairro` | Sim |

Dados editados em **Pesquisas** (`/pesquisas`).

### 7.8 Atividades

| Campo | Uso |
|-------|-----|
| `message` | Texto exibido |
| `created_at` | Relativo + absoluto (pt-BR) |
| `entity_type` | Ícone (supporter, demand, genérico) |

Limite: **10** registros mais recentes.

### 7.9 Carregamento

| Comportamento | Detalhe |
|---------------|---------|
| Bloqueio inicial | Enquanto RPC de métricas não retorna |
| Insights | Podem carregar em seguida (sem bloquear KPIs após primeira carga) |

---

## 8. Demais módulos do cliente

### 8.1 Eleitores (`/eleitores`)

| Recurso | Detalhe |
|---------|---------|
| CRUD | Criar, editar, excluir apoiadores |
| Campos | Nome, telefone, bairro, cidade, status, nível de apoio, liderança, tags, notas |
| Filtros | Busca, status, bairro, liderança, apoio, tag |
| Deep link | `?bairro=` pré-aplica filtro |
| CSV | Importação em lote + exportação + template |
| Métricas no topo | Totais da campanha (cards) |

### 8.2 Lideranças (`/liderancas`)

| Recurso | Detalhe |
|---------|---------|
| CRUD | Nome, região, votos estimados |
| Modal | Apoiadores vinculados à liderança |
| Exclusão | Desvincula apoiadores (não apaga apoiadores) |

### 8.3 Demandas (`/demandas`)

| Recurso | Detalhe |
|---------|---------|
| Visualização | Kanban: Aberto · Em andamento · Resolvido |
| Interação | Drag-and-drop para mudar status |
| Campos | Título, categoria, prioridade, bairro, descrição, responsável |
| Filtros | Categoria, bairro, responsável, status |
| Deep links | `?bairro=`, `?semResponsavel=1` |

### 8.4 Agenda (`/agenda`)

| Recurso | Detalhe |
|---------|---------|
| CRUD | Eventos com calendário |
| Tipos | Reunião, evento, caminhada, visita |
| Campos | Data, hora, local, descrição |

### 8.5 Pesquisas (`/pesquisas`)

| Tipo | Edição |
|------|--------|
| Intenção de voto | Linhas candidato + % |
| Aprovação por bairro | Bairro + índice |
| Crescimento | Mês + quantidade de apoiadores |
| Persistência | Um snapshot por tipo por tenant |

### 8.6 Relatórios (`/relatorios`)

| Export | Conteúdo |
|--------|----------|
| Apoiadores CSV | Lista completa de apoiadores |
| Relatório consolidado | Apoiadores + demandas |
| Gráfico | Crescimento (dados de pesquisa) |

### 8.7 Configurações (`/configuracoes`)

| Aba | Funcionalidades |
|-----|-----------------|
| Perfil | Nome, telefone, bio |
| Perfil → Aparência | Tema claro / escuro / sistema |
| Landing | Slogan, bio pública, WhatsApp; link `/p/{slug}` |
| Metas | Metas personalizadas do dashboard |
| Notificações | Toggles de preferência (UX) |
| Plano | Exibe plano e status (informativo) |

### 8.8 Equipe (`/equipe`)

| Recurso | Detalhe |
|---------|---------|
| Membros | Lista com role |
| Convites | Pendentes + link `/invite/{token}` |
| Criar convite | E-mail + role (coordenador, assessor, operador, visualizador) |
| Resumo | Cards: membros ativos, convites pendentes |

### 8.9 Landing pública (`/p/{slug}`)

| Recurso | Detalhe |
|---------|---------|
| Acesso | Público, sem login |
| Conteúdo | Headline, bio, propostas |
| Captação | Formulário → apoiador (`source: landing`) |
| WhatsApp | Link se configurado |

---

## 9. UX global

| Aspecto | Implementação |
|---------|----------------|
| Temas | Claro, escuro, sistema; `localStorage` + `user_preferences` |
| Identidade | Verde institucional `#10944A`, azul `#061735`, fundos premium |
| Sidebar | Gradiente institucional; item ativo com destaque verde |
| Topbar | Glass/blur; 3 zonas (contexto, busca, ações) |
| Cards | Sombra suave, raio 24px, gradiente em métricas em destaque |
| Responsivo | Grids 1 → 2 → 4 colunas; faixa operacional com wrap |
| Feedback | Toasts (sonner), empty states, loading states |
| Erros | Error boundary global |
| i18n | Focado em **pt-BR** |

---

## 10. Limitações atuais

| Área | Limitação |
|------|-----------|
| Billing | Sem gateway; ativação manual pelo Super Admin |
| Plano | Limites definidos mas não bloqueiam todas as ações |
| Roles | UI não restringe bem `viewer` / `operator` |
| Busca global | Campo na topbar sem backend |
| Notificações | Apenas toggles; sem e-mail/push real |
| Territórios | Sem histórico para tendências temporais |
| Apoiador | Sem timeline de contatos |
| Multi-tenant UI | Pouca troca de campanha na interface |
| Admin | Auditoria e impersonate inexistentes |
| Atividades | Sem `user_id` rico no feed |
| Pesquisas | Dados manuais; não sincroniza auto com base real |
| Mobile | Kanban/tabelas usáveis mas não otimizados para campo |

---

## 11. Fluxos resumidos

### Cliente — do cadastro à operação

```text
/signup → tenant (suspended)
    ↓
Super Admin → status active + plano trial/basic/pro…
    ↓
/login → /dashboard
    ↓
Operação: Eleitores, Demandas, Lideranças, Agenda, Pesquisas, Equipe, Config
    ↓
Público: /p/{slug} → novos apoiadores em Eleitores
```

### Super Admin

```text
/login → /admin/tenants
    ↓
Gerir status/plano · métricas globais · listar usuários
```

### Convite de equipe

```text
Convite por e-mail → /invite/{token} (logado) → RPC accept → /dashboard
```

---

## 12. Melhorias e adições sugeridas

### Prioridade alta

| # | Item |
|---|------|
| 1 | ~~RPC única de dashboard operacional no servidor~~ *(implementado: `get_tenant_operational_dashboard`)* |
| 2 | ~~Enforcement de limites de plano~~ *(v1: servidor + UX; ver `plan-limits-roadmap.md`)* |
| 3 | Permissões por role na UI |
| 4 | Busca global funcional |
| 5 | Filtros via URL em todas as listagens |
| 6 | Notificações reais (e-mail / in-app) |
| 7 | Billing automatizado + webhook de ativação |

### Prioridade média — produto

| # | Item |
|---|------|
| 8 | Histórico territorial (snapshot diário) |
| 9 | Timeline por apoiador |
| 10 | Alertas/metas com lembretes |
| 11 | Loading por seção no dashboard |
| 12 | Relatórios PDF |
| 13 | Import de pesquisas (planilha) |
| 14 | Integração Google Calendar |
| 15 | Landing: editor visual completo |
| 16 | Seletor de campanha (multi-tenant por usuário) |

### Prioridade média — admin

| # | Item |
|---|------|
| 17 | Página de auditoria (logs) |
| 18 | Impersonate com trilha de auditoria |
| 19 | Gestão de usuários (reset, desvincular) |
| 20 | Dashboard admin (churn, MRR) |

### Prioridade média — UX

| # | Item |
|---|------|
| 21 | Onboarding guiado pós-ativação |
| 22 | Mobile-first para campo |
| 23 | Feed de atividades enriquecido |
| 24 | Gráficos com opção “dados reais” vs manual |
| 25 | Funil: UX clara sobre proporcionalidade vs conversão |

### Futuro / baixa prioridade

| # | Item |
|---|------|
| 26 | Mapa / heatmap territorial |
| 27 | WhatsApp API para segmentos |
| 28 | IA para sugestões (com guardrails) |
| 29 | Feature flags por plano no backend |
| 30 | Testes E2E + smoke RLS automatizado |
| 31 | i18n |
| 32 | PWA offline |

### Débito técnico

| # | Item |
|---|------|
| 33 | Unificar query keys (`queryKeys` vs strings soltas) |
| 34 | Tipagem de rotas `/admin/*` no TanStack Router |
| 35 | Inteligência territorial em Edge Function |
| 36 | Fluxo de confirmação de e-mail no signup |
| 37 | Painel de saúde (migrations, Supabase status) |

---

## 13. Resumo executivo

| Ator | Em uma frase |
|------|----------------|
| **Cliente** | Opera a campanha após ativação; o **Dashboard** concentra alertas, KPIs, territórios, metas e gráficos para decisão de campo. |
| **Super Admin** | Governa o SaaS: ativa clientes, ajusta planos, vê métricas globais — não opera o CRM da campanha no lugar do cliente. |
| **Público** | Capta apoiadores pela landing `/p/{slug}`. |
| **Equipe** | Entra por convite; permissões via `tenant_role` + RLS. |

---

## Referências no repositório

| Documento / pasta | Conteúdo |
|-------------------|----------|
| `docs/architecture.md` | Arquitetura e multi-tenant |
| `docs/setup-local.md` | Setup local |
| `docs/fase-0-checklist.md` | Checklist fase 0 |
| `docs/smoke-test-multitenant.md` | Testes de isolamento |
| `src/routes/_app.dashboard.tsx` | Implementação do dashboard |
| `src/services/dashboard.ts` | RPC operacional + mapeamento do payload |
| `src/services/dashboard-intelligence.ts` | Alertas, briefing (a partir de agregados) |
| `supabase/migrations/20260527120000_operational_dashboard_rpc.sql` | `get_tenant_operational_dashboard` |
| `supabase/migrations/` | Schema e RLS |

---

*Documento interno — Strategos CRM / Politicos-hub. Atualizar conforme novas fases de produto forem entregues.*
