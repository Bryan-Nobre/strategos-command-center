import { createClient } from "@/lib/supabase/client";
import {
  emptyPermissions,
  parsePermissions,
  permissionsToJson,
  type TenantPermissionsMap,
  type TenantRoleRow,
} from "@/types/permissions";

type RawRoleRow = {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_full_access: boolean;
  permissions: Record<string, unknown>;
  member_count: number;
};

function mapRole(raw: RawRoleRow): TenantRoleRow {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    isSystem: raw.is_system,
    isFullAccess: raw.is_full_access,
    permissions: parsePermissions(raw.permissions),
    memberCount: raw.member_count,
  };
}

export async function fetchMyTenantPermissions(tenantId: string): Promise<TenantPermissionsMap> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_my_tenant_permissions", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return parsePermissions(data);
}

export async function listTenantRoles(tenantId: string): Promise<TenantRoleRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_tenant_roles", { p_tenant_id: tenantId });
  if (error) throw error;
  return ((data ?? []) as RawRoleRow[]).map(mapRole);
}

export async function upsertTenantRole(
  tenantId: string,
  payload: {
    roleId?: string | null;
    name: string;
    description?: string;
    permissions: TenantPermissionsMap;
  },
): Promise<TenantRoleRow> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("upsert_tenant_role", {
    p_tenant_id: tenantId,
    p_role_id: payload.roleId ?? null,
    p_name: payload.name,
    p_description: payload.description ?? "",
    p_permissions: permissionsToJson(payload.permissions),
  });
  if (error) throw error;

  const raw = data as Omit<RawRoleRow, "member_count">;
  return mapRole({ ...raw, member_count: 0 });
}

export async function deleteTenantRole(roleId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("delete_tenant_role", { p_role_id: roleId });
  if (error) throw error;
}

export async function updateMemberCustomRole(memberId: string, customRoleId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("update_member_custom_role", {
    p_member_id: memberId,
    p_custom_role_id: customRoleId,
  });
  if (error) throw error;
}

export { emptyPermissions };
