import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/supabase";
import type { Enums } from "@/types/supabase";

export type TeamMemberWithProfile = {
  id: string;
  role: Enums<"tenant_role">;
  customRoleId: string | null;
  customRoleName: string | null;
  user_id: string;
  profiles: { id: string; full_name: string | null };
};

function legacyRoleFromCustomName(name: string): Enums<"tenant_role"> {
  if (name === "Coordenador") return "coordinator";
  if (name === "Assessor") return "advisor";
  if (name === "Visualizador") return "viewer";
  return "operator";
}

export async function listTeamMembers(tenantId: string): Promise<TeamMemberWithProfile[]> {
  const supabase = createClient();

  const { data: members, error: membersError } = await supabase
    .from("tenant_members")
    .select("id, role, user_id, custom_role_id, tenant_roles(name)")
    .eq("tenant_id", tenantId);

  if (membersError) throw membersError;
  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => {
    const roleJoin = m.tenant_roles as { name: string } | null;
    return {
      id: m.id,
      role: m.role,
      customRoleId: m.custom_role_id,
      customRoleName: roleJoin?.name ?? null,
      user_id: m.user_id,
      profiles: profileById.get(m.user_id) ?? { id: m.user_id, full_name: null },
    };
  });
}

export async function createInvitation(
  tenantId: string,
  email: string,
  customRoleId: string,
  customRoleName: string,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const legacyRole = legacyRoleFromCustomName(customRoleName);

  const { data, error } = await supabase
    .from("team_invitations")
    .insert({
      tenant_id: tenantId,
      email,
      role: legacyRole,
      custom_role_id: customRoleId,
      invited_by: user?.id ?? null,
    })
    .select("id, email, role, token, expires_at")
    .single();
  if (error) throw error;
  return data;
}

export async function listInvitations(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_invitations")
    .select("id, email, role, status, expires_at, created_at, token, custom_role_id, tenant_roles(name)")
    .eq("tenant_id", tenantId)
    .eq("status", "pending");
  if (error) throw error;

  return (data ?? []).map((inv) => {
    const roleJoin = inv.tenant_roles as { name: string } | null;
    return {
      ...inv,
      customRoleName: roleJoin?.name ?? null,
    };
  });
}

export async function updateMemberRole(memberId: string, customRoleId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("update_member_custom_role", {
    p_member_id: memberId,
    p_custom_role_id: customRoleId,
  });
  if (error) throw error;
}

export async function acceptInvitation(token: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("accept_team_invitation", { p_token: token });
  if (error) throw error;
  return data as string;
}

export async function updateProfile(payload: {
  full_name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
  if (error) throw error;
}

export async function getUserPreferences(tenantId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertUserPreferences(
  tenantId: string,
  payload: { theme?: string; notifications?: Json },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    tenant_id: tenantId,
    ...payload,
  });
  if (error) throw error;
}
