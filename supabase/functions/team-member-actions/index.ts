import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ActionBody = {
  action?: "suspend" | "activate" | "reset_password";
  memberId?: string;
  newPassword?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Não autenticado" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: "Configuração do servidor incompleta" }, 500);
  }

  let body: ActionBody;
  try {
    body = (await req.json()) as ActionBody;
  } catch {
    return jsonResponse({ error: "JSON inválido" }, 400);
  }

  const memberId = body.memberId?.trim();
  const action = body.action;

  if (!memberId || !action) {
    return jsonResponse({ error: "Dados inválidos" }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: ctxRaw, error: ctxError } = await userClient.rpc("assert_can_manage_team_member", {
    p_member_id: memberId,
  });

  if (ctxError) {
    const msg = ctxError.message;
    if (msg.includes("PLAN_LIMIT:team")) {
      return jsonResponse({ error: "Limite de vagas do plano atingido.", code: "PLAN_LIMIT" }, 403);
    }
    return jsonResponse({ error: msg }, 403);
  }

  const ctx = ctxRaw as { user_id?: string; member_role?: string } | null;
  if (!ctx?.user_id) {
    return jsonResponse({ error: "Membro não encontrado" }, 404);
  }

  if (ctx.member_role === "owner" && action !== "reset_password") {
    return jsonResponse({ error: "Não é possível alterar o administrador principal" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (action === "reset_password") {
    const pwd = body.newPassword;
    if (!pwd || pwd.length < 8) {
      return jsonResponse({ error: "Senha deve ter pelo menos 8 caracteres" }, 400);
    }
    const { error } = await admin.auth.admin.updateUserById(ctx.user_id, { password: pwd });
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse({ ok: true });
  }

  if (action === "suspend") {
    const { error: statusError } = await userClient.rpc("set_team_member_status", {
      p_member_id: memberId,
      p_status: "suspended",
    });
    if (statusError) return jsonResponse({ error: statusError.message }, 400);

    await admin.auth.admin.updateUserById(ctx.user_id, {
      ban_duration: "876000h",
    });
    return jsonResponse({ ok: true });
  }

  if (action === "activate") {
    const { error: statusError } = await userClient.rpc("set_team_member_status", {
      p_member_id: memberId,
      p_status: "active",
    });
    if (statusError) return jsonResponse({ error: statusError.message }, 400);

    await admin.auth.admin.updateUserById(ctx.user_id, { ban_duration: "none" });
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "Ação inválida" }, 400);
});
