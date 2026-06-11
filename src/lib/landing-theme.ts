import type { CSSProperties } from "react";
import type { Json } from "@/types/supabase";

export type LandingHeroStyle = "default" | "minimal" | "stamped";
export type LandingPhotoStyle = "rounded" | "circle" | "stamped";

export type LandingTheme = {
  background_color: string | null;
  hero_background_color: string | null;
  middle_background_color: string | null;
  footer_background_color: string | null;
  /** Botões, ícones pequenos, coração, checkboxes e destaques na landing pública. */
  accent_color: string | null;
  hero_style: LandingHeroStyle;
  show_graphic_elements: boolean;
  show_political_icons: boolean;
  political_icons_color: string | null;
  photo_style: LandingPhotoStyle;
};

export const DEFAULT_LANDING_THEME: LandingTheme = {
  background_color: null,
  hero_background_color: null,
  middle_background_color: null,
  footer_background_color: null,
  accent_color: null,
  hero_style: "default",
  show_graphic_elements: true,
  show_political_icons: false,
  political_icons_color: null,
  photo_style: "rounded",
};

export const DEFAULT_LANDING_ACCENT = "#10944a";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidLandingBackgroundColor(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  return HEX_RE.test(value.trim());
}

function parseOptionalColor(value: unknown): string | null {
  if (typeof value !== "string" || !isValidLandingBackgroundColor(value)) return null;
  return value.trim() || null;
}

function parseHeroStyle(value: unknown): LandingHeroStyle {
  if (value === "minimal" || value === "stamped" || value === "default") return value;
  return "default";
}

function parsePhotoStyle(value: unknown): LandingPhotoStyle {
  if (value === "circle" || value === "stamped" || value === "rounded") return value;
  return "rounded";
}

export function parseLandingTheme(raw: Json | null | undefined): LandingTheme {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_LANDING_THEME };
  }
  const row = raw as Record<string, unknown>;

  return {
    background_color: parseOptionalColor(row.background_color),
    hero_background_color: parseOptionalColor(row.hero_background_color),
    middle_background_color: parseOptionalColor(row.middle_background_color),
    footer_background_color: parseOptionalColor(row.footer_background_color),
    accent_color: parseOptionalColor(row.accent_color),
    hero_style: parseHeroStyle(row.hero_style),
    show_graphic_elements: row.show_graphic_elements !== false,
    show_political_icons: row.show_political_icons === true,
    political_icons_color: parseOptionalColor(row.political_icons_color),
    photo_style: parsePhotoStyle(row.photo_style),
  };
}

export function serializeLandingTheme(theme: LandingTheme): LandingTheme {
  return {
    background_color: parseOptionalColor(theme.background_color),
    hero_background_color: parseOptionalColor(theme.hero_background_color),
    middle_background_color: parseOptionalColor(theme.middle_background_color),
    footer_background_color: parseOptionalColor(theme.footer_background_color),
    accent_color: parseOptionalColor(theme.accent_color),
    hero_style: parseHeroStyle(theme.hero_style),
    show_graphic_elements: theme.show_graphic_elements !== false,
    show_political_icons: theme.show_political_icons === true,
    political_icons_color: parseOptionalColor(theme.political_icons_color),
    photo_style: parsePhotoStyle(theme.photo_style),
  };
}

export function landingSectionBackgroundStyle(
  color: string | null | undefined,
): CSSProperties | undefined {
  if (!color) return undefined;
  return { background: color };
}

export function landingPageBackgroundStyle(theme: LandingTheme): CSSProperties | undefined {
  return landingSectionBackgroundStyle(theme.background_color);
}

/** Cor de destaque na landing (botão, coração, checkboxes, bolinhas decorativas). */
export function resolveLandingAccentColor(theme: LandingTheme): string {
  return theme.accent_color?.trim() || DEFAULT_LANDING_ACCENT;
}

/** Variáveis CSS aplicadas no container `.landing-page` para personalizar detalhes. */
export function landingAccentStyle(theme: LandingTheme): CSSProperties | undefined {
  const accent = theme.accent_color?.trim();
  if (!accent) return undefined;

  return {
    "--landing-accent": accent,
    "--primary": accent,
    "--ring": `${accent}59`,
    "--primary-hover": accent,
    "--landing-icon-color": theme.political_icons_color?.trim() || accent,
  } as CSSProperties;
}

export function landingPageRootStyle(theme: LandingTheme): CSSProperties | undefined {
  const bg = landingPageBackgroundStyle(theme);
  const accent = landingAccentStyle(theme);
  if (!bg && !accent) return undefined;
  return { ...bg, ...accent };
}

export function landingHeroTitle(landing: {
  display_name?: string | null;
  tenant_name: string;
}): string {
  const custom = landing.display_name?.trim();
  return custom || landing.tenant_name;
}

export function landingPhotoClassName(style: LandingPhotoStyle): string {
  switch (style) {
    case "circle":
      return "landing-hero-photo landing-hero-photo--circle";
    case "stamped":
      return "landing-hero-photo landing-hero-photo--stamped";
    default:
      return "landing-hero-photo landing-hero-photo--rounded";
  }
}

export const LANDING_THEME_COLOR_FIELDS = [
  { key: "background_color" as const, label: "Página inteira", fallback: "#f4f7fb" },
  { key: "hero_background_color" as const, label: "Bloco topo (hero)", fallback: "#ffffff" },
  { key: "middle_background_color" as const, label: "Bloco formulário", fallback: "#f8fafc" },
];

export function validateLandingThemeColors(theme: LandingTheme): string | null {
  for (const { key, label } of LANDING_THEME_COLOR_FIELDS) {
    const value = theme[key];
    if (value && !isValidLandingBackgroundColor(value)) {
      return `Cor inválida em «${label}». Use formato hexadecimal (#RRGGBB).`;
    }
  }
  if (
    theme.political_icons_color &&
    !isValidLandingBackgroundColor(theme.political_icons_color)
  ) {
    return "Cor inválida dos ícones políticos. Use formato hexadecimal (#RRGGBB).";
  }
  if (theme.accent_color && !isValidLandingBackgroundColor(theme.accent_color)) {
    return "Cor inválida dos detalhes pequenos. Use formato hexadecimal (#RRGGBB).";
  }
  return null;
}
