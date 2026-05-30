import { isLightOnlyRoute } from "@/lib/theme-routes";

export const THEME_STORAGE_KEY = "strategos-theme";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export function forceLightTheme() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  document.documentElement.dataset.themeLock = "light";
}

export function clearLightThemeLock() {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.themeLock;
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

export function applyTheme(theme: Theme, pathname?: string) {
  const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  if (isLightOnlyRoute(path)) {
    forceLightTheme();
    return "light" as const;
  }
  clearLightThemeLock();
  const resolved = resolveTheme(theme);
  applyResolvedTheme(resolved);
  return resolved;
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

/** Inline no <head> para evitar flash antes do React hidratar. */
export const themeInitScript = `(function(){try{var p=window.location.pathname.replace(/\\/+$/,"")||"/";var lightOnly=/^\\/login\\/?$/.test(p)||/^\\/signup\\/?$/.test(p)||/^\\/landpage\\/.+/.test(p);if(lightOnly){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";document.documentElement.dataset.themeLock="light";return;}var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
