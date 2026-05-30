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

export type ConfigTabPermissions = {
  canEditProfile: boolean;
  canEditLanding: boolean;
  canEditGoals: boolean;
  canEditNotifications: boolean;
};

/** Primeira aba que o usuário pode abrir (sempre inclui plano). */
export function resolveDefaultConfigTab(perms: ConfigTabPermissions): ConfigTab {
  return resolveAllowedConfigTab(undefined, perms);
}

/** Garante que a aba ativa existe nas permissões atuais (evita Tabs controlado órfão). */
export function resolveAllowedConfigTab(
  requested: ConfigTab | undefined,
  perms: ConfigTabPermissions,
): ConfigTab {
  const allowed: ConfigTab[] = [];
  if (perms.canEditProfile) allowed.push("perfil");
  if (perms.canEditLanding) allowed.push("landing");
  if (perms.canEditGoals) allowed.push("metas");
  if (perms.canEditNotifications) allowed.push("notificacoes");
  allowed.push("plano");

  if (requested && allowed.includes(requested)) return requested;
  return allowed[0] ?? "plano";
}
