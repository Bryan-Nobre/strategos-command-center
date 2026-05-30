export type LandingRegisterResult = {
  supporter_id: string;
  merged: boolean;
  supporter_name: string | null;
  primary_leadership_name: string | null;
};

export function parseLandingRegisterResult(data: unknown): LandingRegisterResult {
  if (typeof data === "string" && data.trim()) {
    return {
      supporter_id: data.trim(),
      merged: false,
      supporter_name: null,
      primary_leadership_name: null,
    };
  }

  if (data && typeof data === "object") {
    const row = data as Record<string, unknown>;
    const supporterId = row.supporter_id;
    if (typeof supporterId !== "string" || !supporterId.trim()) {
      throw new Error("Resposta inválida do cadastro na landing.");
    }
    return {
      supporter_id: supporterId.trim(),
      merged: row.merged === true,
      supporter_name: typeof row.supporter_name === "string" ? row.supporter_name : null,
      primary_leadership_name:
        typeof row.primary_leadership_name === "string" ? row.primary_leadership_name : null,
    };
  }

  throw new Error("Resposta inválida do cadastro na landing.");
}

export function buildLandingSuccessMessage(result: LandingRegisterResult): string {
  const name = result.supporter_name?.trim() || "Apoiador";
  const leadership = result.primary_leadership_name?.trim();

  if (result.merged) {
    const leadershipLine = leadership ? ` Liderança primária: ${leadership}.` : "";
    return `Cadastro atualizado em ${name} (telefone já existia na campanha).${leadershipLine} Confira na aba Eleitores.`;
  }

  const leadershipLine = leadership ? ` Vínculo com ${leadership}.` : "";
  return `Cadastro confirmado! ${name} entrou na aba Eleitores.${leadershipLine}`;
}
