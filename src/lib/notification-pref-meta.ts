import type { NotificationPrefCategory } from "@/types/notification-preferences";

export type NotificationPrefFieldMeta = {
  key: string;
  label: string;
  description: string;
};

export type NotificationPrefGroupMeta = {
  category: NotificationPrefCategory;
  title: string;
  description: string;
  fields: NotificationPrefFieldMeta[];
};

export const NOTIFICATION_PREF_GROUPS: NotificationPrefGroupMeta[] = [
  {
    category: "demands",
    title: "Demandas",
    description: "Alertas do quadro Kanban e atribuições.",
    fields: [
      {
        key: "assigned_to_me",
        label: "Atribuídas a mim",
        description: "Quando uma demanda for atribuída ou reatribuída para você.",
      },
      {
        key: "status_on_mine",
        label: "Status das minhas demandas",
        description: "Mudanças de status em demandas sob sua responsabilidade.",
      },
      {
        key: "high_priority",
        label: "Nova demanda de alta prioridade",
        description: "Solicitações urgentes abertas na campanha.",
      },
      {
        key: "unassigned_digest",
        label: "Demandas sem responsável",
        description: "Resumo quando houver várias demandas abertas sem encarregado.",
      },
      {
        key: "new_open",
        label: "Todas as novas demandas",
        description: "Qualquer demanda nova (pode gerar muitos alertas).",
      },
    ],
  },
  {
    category: "supporters",
    title: "Eleitores",
    description: "Captação e base de apoiadores.",
    fields: [
      {
        key: "landing_new",
        label: "Cadastro na landing pública",
        description: "Novo interessado via página /p/{slug}.",
      },
      {
        key: "import_done",
        label: "Importação CSV concluída",
        description: "Confirmação após importar apoiadores (somente para quem importou).",
      },
    ],
  },
  {
    category: "agenda",
    title: "Agenda",
    description: "Lembretes de eventos (quando o job diário estiver ativo).",
    fields: [
      {
        key: "event_today",
        label: "Eventos de hoje",
        description: "Lembrete no dia do evento.",
      },
      {
        key: "event_tomorrow",
        label: "Eventos de amanhã",
        description: "Lembrete um dia antes.",
      },
    ],
  },
  {
    category: "team",
    title: "Equipe",
    description: "Convites e novos membros.",
    fields: [
      {
        key: "invite_accepted",
        label: "Convite aceito",
        description: "Quando alguém aceitar um convite que você enviou.",
      },
      {
        key: "member_joined",
        label: "Novo membro",
        description: "Quando um novo integrante entrar na campanha (coordenação).",
      },
    ],
  },
];
