import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { GLOBAL_SEARCH_MIN_LENGTH, useGlobalSearch } from "@/hooks/use-global-search";
import { useTenantPermissions } from "@/hooks/use-tenant-permissions";
import {
  buildSearchPlaceholder,
  hasAnySearchableModule,
  SEARCH_MODULE_META,
} from "@/lib/search-module-meta";
import type { GlobalSearchItem } from "@/services/global-search";

type GlobalSearchDialogProps = {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalSearchDialog({ tenantId, open, onOpenChange }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const { permissions } = useTenantPermissions(tenantId);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const searchable = hasAnySearchableModule(permissions);
  const placeholder = buildSearchPlaceholder(permissions);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isFetching, isError } = useGlobalSearch(tenantId, debouncedQuery, open && searchable);

  const handleSelect = useCallback(
    (item: GlobalSearchItem) => {
      onOpenChange(false);
      void navigate({
        to: item.route,
        search: item.search,
      });
    },
    [navigate, onOpenChange],
  );

  const groups = data?.groups ?? [];
  const hasResults = groups.some((g) => g.items.length > 0);
  const showMinLengthHint = query.trim().length > 0 && query.trim().length < GLOBAL_SEARCH_MIN_LENGTH;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
        disabled={!searchable}
      />
      <CommandList>
        {!searchable && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Seu cargo não inclui permissão de leitura em módulos pesquisáveis.
          </div>
        )}

        {searchable && showMinLengthHint && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Digite pelo menos {GLOBAL_SEARCH_MIN_LENGTH} caracteres para buscar.
          </div>
        )}

        {searchable && !showMinLengthHint && debouncedQuery.length >= GLOBAL_SEARCH_MIN_LENGTH && isFetching && (
          <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando…
          </div>
        )}

        {searchable && isError && (
          <CommandEmpty>Não foi possível buscar. Tente novamente.</CommandEmpty>
        )}

        {searchable &&
          !isFetching &&
          !isError &&
          debouncedQuery.length >= GLOBAL_SEARCH_MIN_LENGTH &&
          !hasResults && <CommandEmpty>Nenhum resultado para &quot;{debouncedQuery}&quot;</CommandEmpty>}

        {groups.map((group, index) => {
          const Icon = SEARCH_MODULE_META[group.module].icon;
          return (
            <div key={group.module}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={group.label}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${group.module}-${item.id}-${item.title}`}
                    onSelect={() => handleSelect(item)}
                  >
                    <Icon className="text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title}</p>
                      {item.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

/** Atalho Cmd+K / Ctrl+K para abrir busca (somente quando tenant ativo). */
export function useGlobalSearchShortcut(onOpen: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, onOpen]);
}
