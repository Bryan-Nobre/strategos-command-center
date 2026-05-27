import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useMatch, useRouterState, useRouteContext } from "@tanstack/react-router";
import { resolveRouteMeta } from "@/lib/navigation-meta";
import {
  GlobalSearchDialog,
  useGlobalSearchShortcut,
} from "@/components/search/GlobalSearchDialog";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useTenantPermissions } from "@/hooks/use-tenant-permissions";
import { buildSearchPlaceholder } from "@/lib/search-module-meta";

export function AppNavbar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const appRoute = useMatch({ from: "/_app", shouldThrow: false });
  const { activeTenant } = useRouteContext({ strict: false });
  const meta = resolveRouteMeta(path);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  const tenantId = appRoute ? (activeTenant?.id ?? "") : "";
  const { permissions } = useTenantPermissions(tenantId);
  const searchPlaceholder = buildSearchPlaceholder(permissions);
  useGlobalSearchShortcut(openSearch, !!tenantId);

  return (
    <>
      <GlobalSearchDialog tenantId={tenantId} open={searchOpen} onOpenChange={setSearchOpen} />
      <header className="strategos-topbar transition-theme sticky top-0 z-30">
        <div className="strategos-topbar-row">
          {/* Esquerda — até o limite */}
          <div className="topbar-left">
            <SidebarTrigger className="topbar-icon-btn shrink-0" />
            <p className="topbar-title truncate">{meta.title}</p>
          </div>

          {/* Centro — busca geral */}
          <div className="topbar-center hidden lg:block">
            <div className="strategos-search relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={openSearch}
                className="strategos-search-input flex h-9 w-full items-center rounded-lg pl-10 pr-[4.5rem] text-left text-sm outline-none transition-theme"
                aria-label="Buscar na campanha"
              >
                <span className="truncate text-muted-foreground">{searchPlaceholder}</span>
              </button>
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center rounded border border-border/80 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Direita — até o limite */}
          <div className="topbar-right">
            <Button
              variant="ghost"
              size="icon"
              className="topbar-icon-btn lg:hidden"
              aria-label="Buscar"
              onClick={openSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle className="topbar-icon-btn" />
            {tenantId ? <NotificationBell tenantId={tenantId} className="topbar-icon-btn" /> : null}
          </div>
        </div>
      </header>
    </>
  );
}
