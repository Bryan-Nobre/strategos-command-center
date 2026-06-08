export type LandingProposalItem = {
  title: string;
  text: string;
};

export const MAX_LANDING_PROPOSALS = 12;

function normalizeProposal(raw: unknown): LandingProposalItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const text =
    (typeof row.text === "string" ? row.text : typeof row.description === "string" ? row.description : "")
      .trim();
  if (!title && !text) return null;
  return { title, text };
}

/** Normaliza JSON do banco (aceita legado `description`). */
export function parseLandingProposals(raw: unknown): LandingProposalItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeProposal).filter((p): p is LandingProposalItem => p !== null);
}

export function serializeLandingProposals(items: LandingProposalItem[]): LandingProposalItem[] {
  return items
    .map((p) => ({
      title: p.title.trim(),
      text: p.text.trim(),
    }))
    .filter((p) => p.title.length > 0)
    .slice(0, MAX_LANDING_PROPOSALS);
}

export function createEmptyProposal(): LandingProposalItem {
  return { title: "", text: "" };
}

export function validateLandingProposals(items: LandingProposalItem[]): string | null {
  for (let i = 0; i < items.length; i++) {
    const title = items[i]?.title.trim() ?? "";
    const text = items[i]?.text.trim() ?? "";
    if (!title && text) {
      return `Proposta ${i + 1}: informe um título ou remova o texto.`;
    }
    if (title.length > 120) {
      return `Proposta ${i + 1}: título muito longo (máx. 120 caracteres).`;
    }
    if (text.length > 500) {
      return `Proposta ${i + 1}: descrição muito longa (máx. 500 caracteres).`;
    }
  }
  return null;
}

/** Texto exibido na landing pública. */
export function getLandingProposalBody(item: LandingProposalItem): string {
  return item.text.trim();
}
