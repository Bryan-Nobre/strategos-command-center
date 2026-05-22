import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export type SignupEdgePayload = {
  email: string;
  password: string;
  fullName: string;
  tenantName: string;
  slug: string;
  headline?: string;
};

export type SignupEdgeResult = {
  tenantId: string;
  userId: string;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: { id: string; email?: string };
  } | null;
};

export async function invokeSignupPoliticianEdge(
  payload: SignupEdgePayload,
): Promise<SignupEdgeResult> {
  const baseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const signupSecret = import.meta.env.VITE_SIGNUP_FUNCTION_SECRET?.trim();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };
  if (signupSecret) {
    headers["x-signup-secret"] = signupSecret;
  }

  const res = await fetch(`${baseUrl}/functions/v1/signup-politician`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as SignupEdgeResult & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? `Erro no cadastro (${res.status})`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.tenantId) {
    throw new Error("Resposta inválida do servidor de cadastro");
  }

  return data;
}
