import { useLayoutEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useTheme } from "@/contexts/theme-provider";

/** Garante tema claro em login, cadastro e landing pública ao navegar. */
export function ThemeRouteEnforcer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { reconcileForRoute } = useTheme();

  useLayoutEffect(() => {
    reconcileForRoute(pathname);
  }, [pathname, reconcileForRoute]);

  return null;
}
