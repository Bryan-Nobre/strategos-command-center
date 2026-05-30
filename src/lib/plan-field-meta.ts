import type { TenantPlan } from "@/types/tenant";

/** Metadados dos campos de limite — o que cada valor afeta no sistema. */
export const PLAN_FIELD_META = {
  maxSupporters: {
    label: "Máximo de apoiadores",
    description:
      "Limite total de registros na base de Eleitores (cadastro manual, landing e importação CSV). " +
      "Ao atingir o teto, o PostgreSQL bloqueia novos cadastros — importações respeitam apenas as vagas restantes.",
    enforcement: "Servidor (trigger em supporters)",
    modules: ["Eleitores", "Landing pública", "Importação CSV"],
  },
  maxTeamMembers: {
    label: "Máximo de vagas na equipe",
    description:
      "Conta apenas membros ativos da equipe. " +
      "Bloqueia novo acesso quando não houver vaga disponível.",
    enforcement: "Servidor (triggers em tenant_members)",
    modules: ["Configurações → Equipe"],
  },
  maxRegions: {
    label: "Máximo de regiões (bairros)",
    description:
      "Referência comercial por bairros distintos cadastrados nos apoiadores. " +
      "Ainda não bloqueia cadastros — valor fica salvo para uso futuro e exibição no painel.",
    enforcement: "Apenas informativo (enforcement adiado)",
    modules: ["Eleitores (campo bairro)", "Dashboard (métrica futura)"],
  },
  exportsEnabled: {
    label: "Exportação CSV permitida",
    description:
      "Quando desligado, a interface desabilita botões de exportar em Eleitores e Relatórios. " +
      "Na v1 a restrição é só no front-end; dados continuam protegidos pelo RLS.",
    enforcement: "Front-end (usePlanGate) — servidor adiado",
    modules: ["Eleitores → Exportar", "Relatórios → Exportações"],
  },
  pollsEnabled: {
    label: "Pesquisas internas permitidas",
    description:
      "Controla edição de snapshots de pesquisa (intenção de voto, aprovação por bairro, crescimento). " +
      "Snapshots do tipo personalizado (custom) não são afetados. Desligado = bloqueio no banco ao salvar.",
    enforcement: "Servidor (trigger em poll_snapshots)",
    modules: ["Pesquisas"],
  },
} as const;

export const PLAN_ORDER: TenantPlan[] = ["start", "basic", "pro", "enterprise"];

export const PLAN_ADMIN_INTRO =
  "Estes limites definem o que cada plano comercial permite. Alterações entram em vigor imediatamente para todas as campanhas vinculadas ao plano. " +
  "Status da campanha (Ativo/Suspenso) continua sendo alterado em Clientes — não confundir com plano.";
