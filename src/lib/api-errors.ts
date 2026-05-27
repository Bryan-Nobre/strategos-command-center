/**
 * Tratamento padronizado de erros de API (Supabase/fetch futuro).
 * Segurança real deve ser validada no backend/API.
 */
export class ApiAuthError extends Error {
  readonly status = 401;
  constructor(message = "Sessão expirada. Faça login novamente.") {
    super(message);
    this.name = "ApiAuthError";
  }
}

export class ApiForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Você não tem permissão para esta ação.") {
    super(message);
    this.name = "ApiForbiddenError";
  }
}

export class ApiTenantError extends Error {
  readonly status = 403;
  constructor(message = "Campanha inválida ou inacessível.") {
    super(message);
    this.name = "ApiTenantError";
  }
}

export class ApiPlanLimitError extends Error {
  readonly status = 403;
  constructor(message = "Limite do plano atingido.") {
    super(message);
    this.name = "ApiPlanLimitError";
  }
}

export function mapSupabaseErrorToApiError(error: { message?: string; code?: string; status?: number }): Error {
  const msg = error.message ?? "Erro inesperado";
  if (msg.startsWith("PLAN_LIMIT:")) {
    return new ApiPlanLimitError(msg);
  }
  if (error.code === "PGRST301" || error.status === 401) {
    return new ApiAuthError(msg);
  }
  if (error.code === "42501" || error.status === 403) {
    return new ApiForbiddenError(msg);
  }
  return new Error(msg);
}

export function isAuthError(error: unknown): error is ApiAuthError {
  return error instanceof ApiAuthError;
}

export function isForbiddenError(error: unknown): error is ApiForbiddenError {
  return error instanceof ApiForbiddenError || error instanceof ApiTenantError;
}
