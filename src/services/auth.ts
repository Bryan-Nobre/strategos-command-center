import { createClient } from "@/lib/supabase/client";

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpPolitician(payload: {
  email: string;
  password: string;
  fullName: string;
  tenantName: string;
  slug: string;
  headline?: string;
}) {
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: { full_name: payload.fullName },
    },
  });
  if (authError) throw authError;
  if (!authData.user) throw new Error("Falha ao criar usuário");

  const { data: tenantId, error: tenantError } = await supabase.rpc("setup_politician_tenant", {
    p_tenant_name: payload.tenantName,
    p_slug: payload.slug,
    p_headline: payload.headline ?? null,
  });
  if (tenantError) throw tenantError;
  return { user: authData.user, tenantId: tenantId as string };
}
