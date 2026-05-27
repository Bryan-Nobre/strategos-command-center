import { createClient } from "@/lib/supabase/client";
import { invokeSignupPoliticianEdge } from "@/lib/supabase/signup-edge";

/** Completa tenant/landing se o usuário já existe mas não tem campanha (cadastro interrompido). */
export async function completePoliticianOnboarding(payload: {
  tenantName: string;
  slug: string;
  headline?: string;
}) {
  const supabase = createClient();
  const { data: tenantId, error } = await supabase.rpc("setup_politician_tenant", {
    p_tenant_name: payload.tenantName,
    p_slug: payload.slug,
    p_headline: payload.headline ?? undefined,
  });
  if (error) throw error;
  return { tenantId: tenantId as string };
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Cadastro via Edge Function (service_role no servidor).
 * Contorna limites do signUp público e cria tenant sem depender de sessão imediata no cliente.
 * Segurança real: RPC + RLS; opcional SIGNUP_FUNCTION_SECRET na função.
 */
export async function signUpPolitician(payload: {
  email: string;
  password: string;
  fullName: string;
  tenantName: string;
  slug: string;
  headline?: string;
}) {
  const supabase = createClient();
  const result = await invokeSignupPoliticianEdge(payload);

  if (result.session) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
    if (sessionError) throw sessionError;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) {
    throw new Error(
      "Campanha criada. Faça login com seu e-mail e senha para continuar.",
    );
  }

  return { user, tenantId: result.tenantId };
}
