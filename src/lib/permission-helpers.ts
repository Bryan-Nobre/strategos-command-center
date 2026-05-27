import { PERMISSION_FIELD_META } from "@/lib/permission-field-meta";
import {
  PERMISSION_MODULES,
  emptyPermissions,
  type PermissionModule,
  type TenantPermissionsMap,
} from "@/types/permissions";

export type PermissionModuleGroup = {
  id: string;
  label: string;
  description: string;
  modules: PermissionModule[];
};

export const PERMISSION_MODULE_GROUPS: PermissionModuleGroup[] = [
  {
    id: "overview",
    label: "Visão geral",
    description: "Painéis, relatórios e pesquisas estratégicas.",
    modules: ["dashboard", "reports", "polls"],
  },
  {
    id: "data",
    label: "Dados da campanha",
    description: "Cadastros operacionais — quem pode ver, incluir, alterar ou excluir registros.",
    modules: ["supporters", "leaderships", "demands", "agenda"],
  },
  {
    id: "admin",
    label: "Administração",
    description: "Equipe, convites, cargos e configurações da campanha.",
    modules: ["team", "settings"],
  },
];

const DATA_WRITE_ACTIONS = ["create", "update"] as const;
const DATA_DELETE_ACTIONS = ["delete"] as const;

export function getModuleActionKeys(module: PermissionModule): string[] {
  return Object.keys(PERMISSION_FIELD_META[module].actions);
}

/** Marca só leitura no módulo (ver dados, sem alterar). */
export function setModuleReadOnly(
  permissions: TenantPermissionsMap,
  module: PermissionModule,
): TenantPermissionsMap {
  const next = { ...permissions, [module]: { ...permissions[module] } };
  for (const action of getModuleActionKeys(module)) {
    next[module][action] = action === "read" || action === "profile";
  }
  return next;
}

/** Marca todas as ações do módulo como permitidas. */
export function setModuleFull(
  permissions: TenantPermissionsMap,
  module: PermissionModule,
): TenantPermissionsMap {
  const next = { ...permissions, [module]: { ...permissions[module] } };
  for (const action of getModuleActionKeys(module)) {
    next[module][action] = true;
  }
  return next;
}

/** Remove acesso ao módulo (nenhuma ação). */
export function clearModule(
  permissions: TenantPermissionsMap,
  module: PermissionModule,
): TenantPermissionsMap {
  const next = { ...permissions, [module]: { ...permissions[module] } };
  for (const action of getModuleActionKeys(module)) {
    next[module][action] = false;
  }
  return next;
}

export function setModuleAction(
  permissions: TenantPermissionsMap,
  module: PermissionModule,
  action: string,
  value: boolean,
): TenantPermissionsMap {
  const next = {
    ...permissions,
    [module]: { ...permissions[module], [action]: value },
  };

  if (value && action !== "read" && "read" in PERMISSION_FIELD_META[module].actions) {
    next[module].read = true;
  }

  if (!value && action === "read") {
    for (const key of getModuleActionKeys(module)) {
      if (key !== "read") next[module][key] = false;
    }
  }

  return next;
}

export function countEnabledActions(
  permissions: TenantPermissionsMap,
  module: PermissionModule,
): { enabled: number; total: number } {
  const keys = getModuleActionKeys(module);
  const enabled = keys.filter((k) => permissions[module]?.[k] === true).length;
  return { enabled, total: keys.length };
}

export function moduleAccessLabel(permissions: TenantPermissionsMap, module: PermissionModule): string {
  const { enabled, total } = countEnabledActions(permissions, module);
  if (enabled === 0) return "Sem acesso";
  if (!permissions[module]?.read) return "Parcial";
  const canWrite =
    DATA_WRITE_ACTIONS.some((a) => permissions[module]?.[a]) ||
    DATA_DELETE_ACTIONS.some((a) => permissions[module]?.[a]) ||
    getModuleActionKeys(module).some(
      (a) => !["read", "create", "update", "delete"].includes(a) && permissions[module]?.[a],
    );
  if (enabled === total) return "Acesso total";
  if (!canWrite) return "Somente leitura";
  return "Parcial";
}

export function cloneEmptyPermissions(): TenantPermissionsMap {
  return emptyPermissions();
}
