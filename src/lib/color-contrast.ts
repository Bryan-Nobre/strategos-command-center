/** Utilitários WCAG para validação de contraste em cores da landing. */

function expandHex(hex: string): string {
  const h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return `#${h}`.toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = expandHex(hex);
  const match = /^#([0-9a-f]{6})$/i.exec(normalized);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Razão de contraste WCAG entre duas cores hex (#RRGGBB). */
export function colorContrastRatio(foreground: string, background: string): number | null {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return null;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Contraste mínimo recomendado para texto branco sobre botão (WCAG AA grande). */
export const MIN_ACCENT_ON_WHITE_RATIO = 3;

/** Contraste mínimo para texto branco sobre fundo de cor sólida (WCAG AA normal). */
export const MIN_ACCENT_BUTTON_RATIO = 4.5;

export type AccentContrastIssue = "button" | "on-white";

export function getAccentContrastIssues(
  accentHex: string,
  backgroundHex: string = "#ffffff",
): AccentContrastIssue[] {
  const issues: AccentContrastIssue[] = [];
  const onWhite = colorContrastRatio(accentHex, backgroundHex);
  const button = colorContrastRatio("#ffffff", accentHex);

  if (onWhite != null && onWhite < MIN_ACCENT_ON_WHITE_RATIO) {
    issues.push("on-white");
  }
  if (button != null && button < MIN_ACCENT_BUTTON_RATIO) {
    issues.push("button");
  }
  return issues;
}

export function accentContrastWarning(
  accentHex: string,
  backgroundHex?: string | null,
): string | null {
  const bg = backgroundHex?.trim() || "#ffffff";
  const issues = getAccentContrastIssues(accentHex, bg);
  if (!issues.length) return null;

  if (issues.includes("button") && issues.includes("on-white")) {
    return "Contraste baixo: botões e ícones podem ficar difíceis de ler. Escolha um tom mais escuro ou saturado.";
  }
  if (issues.includes("button")) {
    return "Contraste baixo no botão: o texto branco pode ficar ilegível. Prefira um tom mais escuro.";
  }
  return "Contraste baixo nos detalhes: ícones e destaques podem sumir no fundo claro.";
}
