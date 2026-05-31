import type { AuthError, PostgrestError } from "@supabase/supabase-js";

export class SignupPendingEmailError extends Error {
  constructor() {
    super(
      "Conta criada! Confirme o e-mail pelo link enviado e depois faça login para concluir a campanha.",
    );
    this.name = "SignupPendingEmailError";
  }
}

function isAuthError(err: unknown): err is AuthError {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as AuthError).message === "string"
  );
}

function isPostgrestError(err: unknown): err is PostgrestError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "message" in err &&
    typeof (err as PostgrestError).message === "string"
  );
}

/** Mensagem amigável para toast / UI (segurança real continua no backend). */
export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof SignupPendingEmailError) return err.message;

  if (isPostgrestError(err)) {
    const msg = err.message;
    if (/não autenticado|not authenticated|jwt/i.test(msg)) {
      return "Sessão não iniciada. Confirme seu e-mail ou desative 'Confirm email' no Supabase Auth (desenvolvimento).";
    }
    if (err.code === "23505" || /duplicate|unique|slug/i.test(msg)) {
      return "Este slug de landing já está em uso. Escolha outro (ex.: joao-silva-2026).";
    }
    if (/slug inválido/i.test(msg)) {
      return "Slug inválido. Use pelo menos 3 caracteres (letras, números e hífens).";
    }
    if (
      err.code === "PGRST204" ||
      /Could not find the .* column/i.test(msg) ||
      /schema cache/i.test(msg)
    ) {
      return "O banco de dados está desatualizado em relação ao app. Aplique as migrations pendentes no Supabase e tente novamente.";
    }
    return msg;
  }

  if (isAuthError(err)) {
    const msg = err.message;
    if (/not found|404/i.test(msg)) {
      return "Serviço de autenticação indisponível. Confira VITE_SUPABASE_URL (sem /rest/v1) no .env.local e na Vercel.";
    }
    if (/already registered|already exists|user already registered/i.test(msg)) {
      return "Este e-mail já está cadastrado. Faça login para continuar.";
    }
    if (/invalid login credentials/i.test(msg)) {
      return "E-mail ou senha incorretos.";
    }
    if (/email not confirmed|confirm/i.test(msg)) {
      return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada.";
    }
    if (/password/i.test(msg) && /short|least|weak/i.test(msg)) {
      return "Senha muito fraca. Use pelo menos 6 caracteres.";
    }
    if (/email.*invalid|invalid.*email/i.test(msg)) {
      return "E-mail inválido.";
    }
    return msg;
  }

  if (err instanceof Error) return err.message;
  return "Ocorreu um erro. Tente novamente.";
}
