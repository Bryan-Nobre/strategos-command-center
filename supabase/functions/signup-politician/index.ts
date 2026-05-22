import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signup-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SignupBody = {
  email?: string;
  password?: string;
  fullName?: string;
  tenantName?: string;
  slug?: string;
  headline?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

  const signupSecret = Deno.env.get("SIGNUP_FUNCTION_SECRET");
  if (signupSecret) {
    const provided = req.headers.get("x-signup-secret");
    if (provided !== signupSecret) {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: "Configuração do servidor incompleta" }, 500);
  }

  let body: SignupBody;
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return jsonResponse({ error: "JSON inválido" }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const fullName = body.fullName?.trim();
  const tenantName = body.tenantName?.trim();
  const slug = body.slug ? normalizeSlug(body.slug) : "";
  const headline = body.headline?.trim() || null;

  if (!email || !password || !fullName || !tenantName || !slug) {
    return jsonResponse({ error: "Campos obrigatórios ausentes" }, 400);
  }

  if (password.length < 8) {
    return jsonResponse({ error: "Senha deve ter pelo menos 8 caracteres" }, 400);
  }

  if (slug.length < 3) {
    return jsonResponse({ error: "Slug inválido (mínimo 3 caracteres)" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId: string;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    if (!isAlreadyRegistered(createError.message)) {
      return jsonResponse({ error: createError.message }, 400);
    }

    const { data: signInExisting, error: signInExistingError } =
      await anon.auth.signInWithPassword({ email, password });

    if (signInExistingError || !signInExisting.user) {
      return jsonResponse(
        {
          error:
            "E-mail já cadastrado. Use a senha correta para concluir ou faça login.",
        },
        409,
      );
    }
    userId = signInExisting.user.id;
  } else if (!created.user) {
    return jsonResponse({ error: "Falha ao criar usuário" }, 500);
  } else {
    userId = created.user.id;
  }

  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", userId)
    .maybeSingle();

  if (ownerProfile?.platform_role === "super_admin") {
    return jsonResponse(
      {
        error:
          "Contas de super administrador não podem criar campanha. Use o painel /admin.",
      },
      403,
    );
  }

  const { data: tenantId, error: tenantError } = await admin.rpc(
    "setup_politician_tenant_for_user",
    {
      p_user_id: userId,
      p_tenant_name: tenantName,
      p_slug: slug,
      p_headline: headline,
    },
  );

  if (tenantError) {
    return jsonResponse({ error: tenantError.message }, 400);
  }

  const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    return jsonResponse(
      {
        error:
          "Campanha criada, mas não foi possível iniciar a sessão. Faça login manualmente.",
        tenantId,
        userId,
      },
      200,
    );
  }

  return jsonResponse({
    tenantId,
    userId,
    session: signInData.session,
  });
});
