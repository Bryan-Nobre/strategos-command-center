import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isLightOnlyRoute } from "@/lib/theme-routes";
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  reconcileForRoute: (pathname: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const reconcileForRoute = useCallback(
    (pathname: string) => {
      const resolved = applyTheme(theme, pathname);
      setResolvedTheme(resolved);
    },
    [theme],
  );

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
    const resolved = applyTheme(next, pathname);
    setResolvedTheme(resolved);
  }, []);

  useEffect(() => {
    const stored = readStoredTheme();
    const pathname = window.location.pathname;
    setThemeState(stored);
    const resolved = applyTheme(stored, pathname);
    setResolvedTheme(resolved);
  }, []);

  useEffect(() => {
    const pathname = window.location.pathname;
    if (isLightOnlyRoute(pathname)) {
      const resolved = applyTheme(theme, pathname);
      setResolvedTheme(resolved);
      return;
    }
    if (theme === "system") return;
    const resolved = applyTheme(theme, pathname);
    setResolvedTheme(resolved);
  }, [theme]);

  useEffect(() => {
    const pathname = window.location.pathname;
    if (isLightOnlyRoute(pathname) || theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = applyTheme("system", window.location.pathname);
      setResolvedTheme(resolved);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, reconcileForRoute }),
    [theme, resolvedTheme, setTheme, reconcileForRoute],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return ctx;
}
