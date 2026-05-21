Documento de Requisitos do Produto (PRD) – Strategos CRM
Versão: 1.0 (SaaS Político Multi-Tenant)

1. Visão Geral (Overview)

O projeto consiste no desenvolvimento do Strategos CRM, uma plataforma SaaS de gestão política e eleitoral voltada para:
- vereadores
- deputados
- prefeitos
- pré-candidatos
- equipes de campanha
- gabinetes políticos

O sistema permitirá que cada político tenha sua própria área administrativa, contendo:
- gestão de apoiadores
- lideranças
- demandas da população
- agenda política
- métricas eleitorais
- landing page pública de captação

A plataforma seguirá arquitetura Multi-Tenant, onde cada cliente possui isolamento completo dos dados.

O objetivo do produto é centralizar:
- captação de apoiadores
- organização política
- inteligência eleitoral
- gestão de relacionamento político (CRM)

Tudo isso utilizando uma interface moderna, responsiva e profissional.

==================================================
2. METAS DO PROJETO
==================================================

- Estrutura SaaS Multi-Tenant
- Dashboard moderna e escalável
- Gestão política centralizada
- Landing pages públicas para captação
- Arquitetura preparada para crescimento
- Interface premium estilo SaaS
- Organização modular e reutilizável
- Escalabilidade para múltiplos políticos e equipes

==================================================
3. STACK TECNOLÓGICA
==================================================

Frontend:
- React
- Vite
- TypeScript

UI:
- Tailwind CSS
- Shadcn/UI
- Lucide React

Gerenciamento de Estado:
- TanStack Query (React Query)

Roteamento:
- React Router DOM

Formulários:
- React Hook Form
- Zod

Gráficos:
- Recharts

Futuro Backend:
- Supabase (não implementar agora)

Banco Futuro:
- PostgreSQL

IMPORTANTE:
Neste momento o projeto deve conter SOMENTE:
- estrutura front-end
- páginas
- componentes
- navegação
- layouts
- UI/UX

NÃO implementar:
- backend
- autenticação real
- banco de dados
- APIs
- Supabase
- Firebase
- persistência de dados

==================================================
4. ESTRUTURA DE USUÁRIOS
==================================================

NÍVEL 1 — SUPER ADMIN
Responsável pela plataforma SaaS.

Funções:
- gerenciar clientes
- ativar/desativar contas
- controlar planos
- visualizar métricas gerais
- administrar usuários

NÍVEL 2 — POLÍTICO
Cliente principal da plataforma.

Funções:
- gerenciar apoiadores
- cadastrar lideranças
- acompanhar métricas
- criar landing page
- organizar agenda
- registrar demandas

NÍVEL 3 — EQUIPE
Usuários internos do político.

Permissões futuras:
- coordenador
- assessor
- liderança
- operador

==================================================
5. ESTRUTURA DE PÁGINAS
==================================================

A. DASHBOARD

Criar dashboard moderna contendo:
- métricas políticas
- crescimento de apoiadores
- estimativa de votos
- regiões fortes
- lideranças ativas
- atividades recentes
- gráficos fictícios
- cards analíticos

B. APOIADORES

Tela de gerenciamento contendo:
- tabela moderna
- filtros
- busca
- badges
- paginação visual
- modal de cadastro

Campos:
- nome
- telefone
- bairro
- cidade
- zona eleitoral
- seção
- grau de apoio
- observações
- tags políticas

Status:
- interessado
- apoiador
- liderança
- oposição
- indeciso

C. LIDERANÇAS

Criar:
- ranking visual
- quantidade de apoiadores
- votos estimados
- desempenho
- crescimento
- métricas de influência

D. DEMANDAS DA POPULAÇÃO

Sistema visual estilo Kanban.

Categorias:
- saúde
- educação
- infraestrutura
- segurança
- iluminação

Status:
- aberto
- em andamento
- resolvido

E. AGENDA

Criar:
- calendário político
- reuniões
- eventos
- caminhadas
- visitas

F. PESQUISAS

Dashboard visual contendo:
- intenção de voto
- aprovação
- crescimento
- bairros
- desempenho eleitoral

Tudo visual/fictício.

G. RELATÓRIOS

Criar:
- gráficos
- métricas
- exportações fictícias
- relatórios visuais

H. CONFIGURAÇÕES

Criar:
- perfil
- equipe
- aparência
- notificações
- permissões
- plano

==================================================
6. LANDING PAGE PÚBLICA
==================================================

Cada político poderá possuir uma landing page pública.

Exemplo:
- sistema.com/joao-silva
- joaosilva.sistema.com

Objetivo:
- captar apoiadores
- divulgar propostas
- divulgar agenda
- fortalecer presença política

A landing page deve conter:
- foto
- nome
- slogan
- propostas
- vídeo
- redes sociais
- botão WhatsApp
- formulário de apoio

==================================================
7. CAPTAÇÃO DE APOIADORES
==================================================

O formulário da landing page deverá possuir:

Campos:
- nome
- telefone
- bairro
- cidade
- interesse
- observações

Ao enviar:
- os dados deverão futuramente cair automaticamente no CRM do político.

Por enquanto:
- implementar apenas interface e fluxo visual.

==================================================
8. FUNIL POLÍTICO
==================================================

Criar conceito visual de funil político:

Visitante
↓
Interessado
↓
Apoiador
↓
Liderança
↓
Mobilizador

Isso deverá aparecer visualmente em dashboards e métricas.

==================================================
9. COMPONENTES IMPORTANTES
==================================================

Criar componentes reutilizáveis:

- Sidebar
- Navbar
- DataTable
- MetricCard
- ChartCard
- Modal
- Form
- Input
- Select
- Badge
- KanbanBoard
- KanbanCard
- PageHeader
- EmptyState
- LoadingState

==================================================
10. RESPONSIVIDADE
==================================================

O sistema deve funcionar perfeitamente em:
- desktop
- tablet
- mobile

Criar:
- sidebar colapsável
- menu mobile
- adaptação responsiva completa

==================================================
11. UI/UX GUIDELINES
==================================================

Tema:
- moderno
- institucional
- premium
- elegante
- tecnológico

Visual inspirado em:
- dashboards SaaS premium
- plataformas corporativas
- sistemas analíticos modernos

Paleta:
- azul marinho
- azul petróleo
- branco
- grafite
- cinza claro

O sistema deve transmitir:
- autoridade
- credibilidade
- sofisticação
- organização política profissional
- tecnologia de alto nível

Estilo visual:
- cards modernos
- bordas suaves
- sombras elegantes
- gráficos profissionais
- layout espaçado
- aparência premium

Evitar:
- aparência genérica
- excesso de efeitos
- excesso de cores
- visual infantil

==================================================
12. ESTRUTURA DE PASTAS
==================================================

src/
 ├── components/
 ├── pages/
 ├── layouts/
 ├── routes/
 ├── hooks/
 ├── services/
 ├── contexts/
 ├── types/
 ├── utils/
 ├── styles/

==================================================
13. PREPARAÇÃO FUTURA PARA BACKEND
==================================================

A estrutura deve nascer preparada para:
- Supabase
- PostgreSQL
- autenticação
- multi-tenant
- Row Level Security (RLS)
- permissões
- planos SaaS

IMPORTANTE:
Mesmo sem backend implementado, toda arquitetura front-end deve ser pensada para futura escalabilidade.

==================================================
14. INSTRUÇÕES IMPORTANTES PARA O LOVABLE/CURSOR
==================================================

- NÃO implementar backend.
- NÃO implementar Supabase.
- NÃO implementar banco de dados.
- NÃO implementar autenticação real.
- NÃO criar APIs.
- NÃO adicionar lógica complexa desnecessária.

Criar SOMENTE:
- estrutura visual
- componentes
- páginas
- layouts
- responsividade
- organização escalável

O projeto deve parecer:
- um SaaS político real
- moderno
- profissional
- pronto para produção
- preparado para expansão futura