/** Mensagens de limite de plano (UX). Segurança real: triggers/RPC no PostgreSQL. */

export type PlanLimitResource = "supporters" | "team" | "polls" | "exports";

const DEFAULT_MESSAGES: Record<PlanLimitResource, string> = {
  supporters: "Limite de apoiadores do seu plano foi atingido. Reduza a base ou solicite upgrade.",
  team: "Limite de vagas na equipe (membros + convites pendentes) foi atingido.",
  polls: "Pesquisas não estão disponíveis no seu plano atual.",
  exports: "Exportação não está disponível no seu plano atual.",
};

export function parsePlanLimitError(message: string): PlanLimitResource | null {
  if (!message.startsWith("PLAN_LIMIT:")) return null;
  const resource = message.split(":")[1];
  if (resource === "supporters" || resource === "team" || resource === "polls" || resource === "exports") {
    return resource;
  }
  return null;
}

export function planLimitUserMessage(error: unknown, fallback = "Limite do plano atingido."): string {
  const msg = error instanceof Error ? error.message : String(error);
  const resource = parsePlanLimitError(msg);
  if (resource) return DEFAULT_MESSAGES[resource];
  if (msg.includes("PLAN_LIMIT")) return fallback;
  return msg;
}

export function isPlanLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.startsWith("PLAN_LIMIT:");
}
