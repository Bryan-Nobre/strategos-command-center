import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ProvisionBody = {
  tenantId?: string;
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  customRoleId?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isAlreadyRegistered(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("user already registered")
  );
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

  let body: ProvisionBody;
  try {
    body = (await req.json()) as ProvisionBody;
  } catch {
    return jsonResponse({ error: "JSON inválido" }, 400);
  }

  const tenantId = body.tenantId?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const fullName = body.fullName?.trim();
  const phone = body.phone?.trim() || null;
  const customRoleId = body.customRoleId?.trim();

  if (!tenantId || !email || !password || !fullName || !customRoleId) {
    return jsonResponse({ error: "Preencha nome, e-mail, senha e cargo" }, 400);
  }

  if (password.length < 8) {
    return jsonResponse({ error: "Senha deve ter pelo menos 8 caracteres" }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: validateError } = await userClient.rpc("validate_team_provision_request", {
    p_tenant_id: tenantId,
    p_email: email,
  });

  if (validateError) {
    const msg = validateError.message;
    if (msg.includes("PLAN_LIMIT:team")) {
      return jsonResponse(
        { error: "Limite de vagas na equipe do seu plano foi atingido.", code: "PLAN_LIMIT" },
        403,
      );
    }
    return jsonResponse({ error: msg }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    if (isAlreadyRegistered(createError.message)) {
      return jsonResponse({ error: "Este e-mail já está em uso na plataforma" }, 400);
    }
    return jsonResponse({ error: createError.message }, 400);
  }

  const userId = created.user?.id;
  if (!userId) {
    return jsonResponse({ error: "Falha ao criar usuário" }, 500);
  }

  const { data: memberId, error: registerError } = await admin.rpc(
    "register_team_member_provision",
    {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_custom_role_id: customRoleId,
      p_full_name: fullName,
      p_phone: phone,
    },
  );

  if (registerError) {
    await admin.auth.admin.deleteUser(userId);
    return jsonResponse({ error: registerError.message }, 400);
  }

  return jsonResponse({ memberId, userId });
});
