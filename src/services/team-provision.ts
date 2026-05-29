import { createClient } from "@/lib/supabase/client";

export type TeamMemberEnriched = {
  id: string;
  user_id: string;
  role: string;
  status: "active" | "suspended";
  customRoleId: string | null;
  customRoleName: string | null;
  createdAt: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  email: string | null;
};

async function getSessionToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Não autenticado");
  return session.access_token;
}

function functionsUrl(path: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  if (!base) throw new Error("VITE_SUPABASE_URL não configurada");
  return `${base.replace(/\/$/, "")}/functions/v1/${path}`;
}

export async function listTeamMembersEnriched(tenantId: string): Promise<TeamMemberEnriched[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_team_members_enriched", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return (data ?? []) as TeamMemberEnriched[];
}

export async function provisionTeamMember(payload: {
  tenantId: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  customRoleId: string;
}): Promise<{ memberId: string; userId: string }> {
  const token = await getSessionToken();
  const res = await fetch(functionsUrl("provision-team-member"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tenantId: payload.tenantId,
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
      phone: payload.phone,
      customRoleId: payload.customRoleId,
    }),
  });

  const json = (await res.json()) as { error?: string; memberId?: string; userId?: string; code?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Falha ao criar acesso");
  }
  if (!json.memberId || !json.userId) {
    throw new Error("Resposta inválida do servidor");
  }
  return { memberId: json.memberId, userId: json.userId };
}

export async function updateTeamMemberDetails(
  memberId: string,
  payload: { fullName?: string; phone?: string; customRoleId?: string },
) {
  const supabase = createClient();
  const { error } = await supabase.rpc("update_team_member_details", {
    p_member_id: memberId,
    p_full_name: payload.fullName ?? null,
    p_phone: payload.phone ?? null,
    p_custom_role_id: payload.customRoleId ?? null,
  });
  if (error) throw error;
}

export async function setTeamMemberStatus(
  memberId: string,
  status: "active" | "suspended",
) {
  if (status === "suspended") {
    await teamMemberAction(memberId, "suspend");
    return;
  }
  await teamMemberAction(memberId, "activate");
}

export async function resetTeamMemberPassword(memberId: string, newPassword: string) {
  await teamMemberAction(memberId, "reset_password", newPassword);
}

export async function removeTeamMember(memberId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("remove_team_member", { p_member_id: memberId });
  if (error) throw error;
}

async function teamMemberAction(
  memberId: string,
  action: "suspend" | "activate" | "reset_password",
  newPassword?: string,
) {
  const token = await getSessionToken();
  const res = await fetch(functionsUrl("team-member-actions"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ memberId, action, newPassword }),
  });

  const json = (await res.json()) as { error?: string; code?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Operação falhou");
  }
}
