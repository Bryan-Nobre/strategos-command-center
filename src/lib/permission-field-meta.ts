import type { PermissionModule } from "@/types/permissions";

type ActionMeta = {
  label: string;
  description: string;
};

type ModuleMeta = {
  label: string;
  route: string;
  description: string;
  enforcement: string;
  actions: Record<string, ActionMeta>;
};

/** Textos para admins entenderem o impacto de cada permissão na UI e no backend. */
export const PERMISSION_FIELD_META: Record<PermissionModule, ModuleMeta> = {
  dashboard: {
    label: "Dashboard",
    route: "/dashboard",
    description: "Painel principal com métricas, metas e insights da campanha.",
    enforcement: "Front-end (menu e rota)",
    actions: {
      read: {
        label: "Ver dashboard",
        description: "Exibe a aba Dashboard na sidebar e permite abrir a página.",
      },
    },
  },
  reports: {
    label: "Relatórios",
    route: "/relatorios",
    description: "Exportações consolidadas de apoiadores, demandas e agenda.",
    enforcement: "Export: front-end · Leitura: menu",
    actions: {
      read: {
        label: "Ver relatórios",
        description: "Exibe a aba e permite visualizar a tela de exportações.",
      },
      export: {
        label: "Exportar CSV",
        description: "Habilita botões de download (respeita também limites do plano comercial).",
      },
    },
  },
  polls: {
    label: "Pesquisas",
    route: "/pesquisas",
    description: "Gráficos editáveis de intenção de voto, aprovação e crescimento.",
    enforcement: "Escrita: servidor (RLS em poll_snapshots)",
    actions: {
      read: { label: "Ver pesquisas", description: "Acesso à tela de pesquisas." },
      create: { label: "Criar snapshots", description: "Permite novos registros de pesquisa." },
      update: { label: "Editar snapshots", description: "Salvar alterações nos gráficos." },
      delete: { label: "Excluir snapshots", description: "Remover registros de pesquisa." },
    },
  },
  supporters: {
    label: "Eleitores (base de apoiadores)",
    route: "/eleitores",
    description:
      "Controle total sobre a base de dados de apoiadores: visualizar listas, cadastrar, editar, excluir, importar e exportar.",
    enforcement: "Servidor (RLS) + botões na tela Eleitores",
    actions: {
      read: {
        label: "Ver lista e detalhes",
        description: "Exibe a aba Eleitores, filtros, métricas e permite consultar registros.",
      },
      create: {
        label: "Cadastrar novos",
        description: "Botão “Novo eleitor” e registros vindos da landing (se landing estiver ativa).",
      },
      update: {
        label: "Editar existentes",
        description: "Alterar nome, telefone, bairro, status, tags e liderança vinculada.",
      },
      delete: {
        label: "Excluir registros",
        description: "Remove apoiadores permanentemente da base (ação irreversível).",
      },
      import: {
        label: "Importar CSV",
        description: "Upload em lote de apoiadores. Respeita também o limite do plano comercial.",
      },
      export: {
        label: "Exportar CSV desta base",
        description: "Download da lista de eleitores direto na tela Eleitores.",
      },
    },
  },
  leaderships: {
    label: "Lideranças",
    route: "/liderancas",
    description: "Cadastro de lideranças políticas e consulta de apoiadores vinculados a cada uma.",
    enforcement: "Servidor (RLS) + botões na tela Lideranças",
    actions: {
      read: { label: "Ver lideranças", description: "Lista, detalhes e apoiadores vinculados (somente consulta)." },
      create: { label: "Cadastrar novas", description: "Botão “Nova liderança”." },
      update: { label: "Editar existentes", description: "Alterar nome, região e estimativa de votos." },
      delete: { label: "Excluir registros", description: "Remove lideranças da campanha." },
    },
  },
  demands: {
    label: "Demandas",
    route: "/demandas",
    description: "Demandas da comunidade no quadro Kanban — status, responsável, prioridade e bairro.",
    enforcement: "Servidor (RLS) + arrastar cartões exige “Editar”",
    actions: {
      read: { label: "Ver demandas", description: "Visualizar o quadro e abrir detalhes." },
      create: { label: "Cadastrar novas", description: "Botão “Nova demanda”." },
      update: {
        label: "Editar e mover",
        description: "Alterar campos, responsável e arrastar entre colunas (Aberto → Em andamento → Resolvido).",
      },
      delete: { label: "Excluir registros", description: "Remove demandas permanentemente." },
    },
  },
  agenda: {
    label: "Agenda",
    route: "/agenda",
    description: "Eventos de campanha: reuniões, caminhadas, visitas e compromissos.",
    enforcement: "Servidor (RLS) + botões na tela Agenda",
    actions: {
      read: { label: "Ver agenda", description: "Calendário e lista de eventos." },
      create: { label: "Cadastrar eventos", description: "Botão “Novo evento”." },
      update: { label: "Editar eventos", description: "Alterar data, tipo, local e descrição." },
      delete: { label: "Excluir eventos", description: "Remove compromissos da agenda." },
    },
  },
  team: {
    label: "Equipe",
    route: "/equipe",
    description: "Membros com login, cargos e permissões da campanha.",
    enforcement: "Provisionamento/cargos: servidor (RLS + Edge)",
    actions: {
      read: { label: "Ver equipe", description: "Lista de membros da campanha." },
      invite: { label: "Adicionar membros", description: "Criar login e senha para novos assessores." },
      manage_roles: {
        label: "Gerenciar cargos",
        description: "Criar, editar e excluir cargos; alterar cargo de membros.",
      },
    },
  },
  settings: {
    label: "Configurações",
    route: "/configuracoes",
    description: "Perfil pessoal, landing pública, metas do dashboard e notificações.",
    enforcement: "Landing/metas: servidor · Perfil: próprio usuário",
    actions: {
      read: { label: "Abrir configurações", description: "Acesso à página de configurações." },
      profile: { label: "Editar perfil", description: "Nome, telefone e bio do próprio usuário." },
      landing: { label: "Editar landing", description: "Headline, bio e propostas da página pública." },
      goals: { label: "Editar metas", description: "Metas semanais exibidas no dashboard." },
      notifications: { label: "Notificações", description: "Preferências de alertas do usuário." },
    },
  },
};

export const PERMISSIONS_ADMIN_INTRO =
  "Monte o cargo bloco a bloco: escolha quais telas aparecem e, em cada base de dados, se a pessoa pode só consultar ou também incluir, alterar e excluir. " +
  "Use os atalhos “Somente leitura”, “Operação” ou “Sem acesso” para configurar rápido. O criador da campanha já recebe o cargo Administrador com tudo liberado.";
