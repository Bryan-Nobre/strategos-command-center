import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/supabase";

export type TeamMemberWithProfile = {
  id: string;
  role: Enums<"tenant_role">;
  user_id: string;
  profiles: { id: string; full_name: string | null };
};

export async function listTeamMembers(tenantId: string): Promise<TeamMemberWithProfile[]> {
  const supabase = createClient();

  const { data: members, error: membersError } = await supabase
    .from("tenant_members")
    .select("id, role, user_id")
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

  return members.map((m) => ({
    id: m.id,
    role: m.role,
    user_id: m.user_id,
    profiles: profileById.get(m.user_id) ?? { id: m.user_id, full_name: null },
  }));
}

export async function createInvitation(
  tenantId: string,
  email: string,
  role: Enums<"tenant_role">,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("team_invitations")
    .insert({ tenant_id: tenantId, email, role, invited_by: user?.id ?? null })
    .select("id, email, role, token, expires_at")
    .single();
  if (error) throw error;
  return data;
}

export async function listInvitations(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_invitations")
    .select("id, email, role, status, expires_at, created_at, token")
    .eq("tenant_id", tenantId)
    .eq("status", "pending");
  if (error) throw error;
  return data;
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
  avatar_url?: string;
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
  payload: { theme?: string; notifications?: Record<string, boolean> },
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
