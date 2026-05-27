/** Módulos e ações de permissão — espelho do JSON em tenant_roles.permissions */

export const PERMISSION_MODULES = [
  "dashboard",
  "reports",
  "polls",
  "supporters",
  "leaderships",
  "demands",
  "agenda",
  "team",
  "settings",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export type ModulePermissions = Record<string, boolean>;

export type TenantPermissionsMap = Record<PermissionModule, ModulePermissions> & {
  is_full_access?: boolean;
  role_name?: string;
};

export type TenantRoleRow = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isFullAccess: boolean;
  permissions: TenantPermissionsMap;
  memberCount: number;
};

export const ROUTE_MODULE_MAP: Record<string, PermissionModule> = {
  "/dashboard": "dashboard",
  "/relatorios": "reports",
  "/pesquisas": "polls",
  "/eleitores": "supporters",
  "/liderancas": "leaderships",
  "/demandas": "demands",
  "/agenda": "agenda",
  "/equipe": "team",
  "/configuracoes": "settings",
};

export function emptyPermissions(): TenantPermissionsMap {
  return {
    dashboard: { read: false },
    reports: { read: false, export: false },
    polls: { read: false, create: false, update: false, delete: false },
    supporters: { read: false, create: false, update: false, delete: false, import: false, export: false },
    leaderships: { read: false, create: false, update: false, delete: false },
    demands: { read: false, create: false, update: false, delete: false },
    agenda: { read: false, create: false, update: false, delete: false },
    team: { read: false, invite: false, manage_roles: false },
    settings: { read: false, profile: false, landing: false, goals: false, notifications: false },
  };
}

export function parsePermissions(raw: unknown): TenantPermissionsMap {
  const base = emptyPermissions();
  if (!raw || typeof raw !== "object") return base;

  const obj = raw as Record<string, unknown>;
  for (const mod of PERMISSION_MODULES) {
    const modVal = obj[mod];
    if (!modVal || typeof modVal !== "object") continue;
    for (const [action, val] of Object.entries(modVal as Record<string, unknown>)) {
      base[mod][action] = val === true;
    }
  }

  if (obj.is_full_access === true) base.is_full_access = true;
  if (typeof obj.role_name === "string") base.role_name = obj.role_name;

  return base;
}

export function canAccessModule(permissions: TenantPermissionsMap | null | undefined, module: PermissionModule): boolean {
  if (!permissions) return true;
  if (permissions.is_full_access) return true;
  return permissions[module]?.read === true;
}

export function canPerform(
  permissions: TenantPermissionsMap | null | undefined,
  module: PermissionModule,
  action: string,
): boolean {
  if (!permissions) return true;
  if (permissions.is_full_access) return true;
  return permissions[module]?.[action] === true;
}

export function canWriteModule(permissions: TenantPermissionsMap | null | undefined, module: PermissionModule): boolean {
  return (
    canPerform(permissions, module, "create") ||
    canPerform(permissions, module, "update") ||
    canPerform(permissions, module, "delete")
  );
}

export function permissionsToJson(permissions: TenantPermissionsMap): Record<string, Record<string, boolean>> {
  const out: Record<string, Record<string, boolean>> = {};
  for (const mod of PERMISSION_MODULES) {
    out[mod] = { ...permissions[mod] };
  }
  return out;
}
