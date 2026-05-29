import { omitEmpty, trimParam } from "@/lib/list-search/utils";

const TABS = ["perfil", "landing", "metas", "notificacoes", "plano"] as const;

export type ConfigTab = (typeof TABS)[number];

export type ConfiguracoesSearch = {
  tab?: ConfigTab;
};

export function parseConfiguracoesSearch(raw: Record<string, unknown>): ConfiguracoesSearch {
  const tab = trimParam(raw.tab);
  if (tab && (TABS as readonly string[]).includes(tab)) {
    return { tab: tab as ConfigTab };
  }
  return {};
}

export function serializeConfiguracoesSearch(search: ConfiguracoesSearch): ConfiguracoesSearch {
  return omitEmpty({ tab: search.tab }) as ConfiguracoesSearch;
}

export function resolveDefaultConfigTab(perms: {
  canEditProfile: boolean;
  canEditLanding: boolean;
  canEditGoals: boolean;
  canEditNotifications: boolean;
}): ConfigTab {
  if (perms.canEditProfile) return "perfil";
  if (perms.canEditLanding) return "landing";
  if (perms.canEditGoals) return "metas";
  if (perms.canEditNotifications) return "notificacoes";
  return "plano";
}
