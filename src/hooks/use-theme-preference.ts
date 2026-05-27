import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/contexts/theme-provider";
import { queryKeys } from "@/lib/query-keys";
import type { Theme } from "@/lib/theme";
import { getUserPreferences } from "@/services/team";

/** Sincroniza tema salvo no perfil (uma vez por sessão de campanha). */
export function useThemePreference(tenantId: string | undefined) {
  const { setTheme } = useTheme();
  const synced = useRef(false);

  const { data: prefs } = useQuery({
    queryKey: queryKeys.prefs(tenantId ?? ""),
    queryFn: () => getUserPreferences(tenantId!),
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (!tenantId || synced.current || !prefs?.theme) return;
    const stored = prefs.theme as Theme;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
      synced.current = true;
    }
  }, [tenantId, prefs?.theme, setTheme]);
}
