import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LandingFieldHelpLink } from "@/components/landing/LandingFieldHelpLink";
import { TRE_DF_VOTING_PLACES_URL } from "@/lib/landing-external-links";
import { searchDfPollingPlaces, type DfPollingPlace } from "@/data/df-polling-places";
import { createClient } from "@/lib/supabase/client";

export type VotingPlaceOption = {
  id: string;
  name: string;
  municipality: string;
  address: string | null;
  state_uf: string;
  source: "db" | "local";
};

function mergePlaces(db: VotingPlaceOption[], local: DfPollingPlace[]): VotingPlaceOption[] {
  const seen = new Set<string>();
  const out: VotingPlaceOption[] = [];
  const push = (row: VotingPlaceOption) => {
    const key = `${row.name}|${row.municipality}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(row);
  };
  for (const row of db) push(row);
  for (const p of local) {
    push({
      id: p.id,
      name: p.name,
      municipality: p.municipality,
      address: p.address,
      state_uf: p.state_uf,
      source: "local",
    });
  }
  return out.slice(0, 30);
}

async function searchDbPollingPlaces(query: string): Promise<VotingPlaceOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_public_polling_places", {
    p_query: query,
    p_state_uf: "DF",
    p_limit: 20,
  });
  if (error || !data) return [];
  return (data as VotingPlaceOption[]).map((row) => ({ ...row, source: "db" as const }));
}

export function LandingVotingPlaceField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (label: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dbResults, setDbResults] = useState<VotingPlaceOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setDbResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchDbPollingPlaces(q)
        .then(setDbResults)
        .catch(() => setDbResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const options = useMemo(() => {
    const local = searchDfPollingPlaces(query);
    return mergePlaces(dbResults, local);
  }, [dbResults, query]);

  const customOption =
    query.trim().length >= 2 && !options.some((o) => o.name.toLowerCase() === query.trim().toLowerCase())
      ? query.trim()
      : null;

  return (
    <div className="space-y-2 sm:col-span-2">
      <LandingFieldHelpLink
        prefix="Não sabe o local de votação?"
        linkLabel="Clique aqui"
        href={TRE_DF_VOTING_PLACES_URL}
      />
      <Label>Local de votação *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-10 w-full justify-between font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <span className="truncate">{value || "Buscar local de votação..."}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,28rem)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Digite parte do nome do local..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <p className="py-4 text-center text-xs text-muted-foreground">Buscando...</p>
              )}
              {!loading && options.length === 0 && !customOption && (
                <CommandEmpty>Nenhum local encontrado. Digite pelo menos 2 caracteres.</CommandEmpty>
              )}
              <CommandGroup>
                {options.map((place) => (
                  <CommandItem
                    key={`${place.source}-${place.id}`}
                    value={place.name}
                    onSelect={() => {
                      onChange(place.name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === place.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{place.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {place.municipality}
                        {place.address ? ` · ${place.address}` : ""}
                      </p>
                    </div>
                  </CommandItem>
                ))}
                {customOption && (
                  <CommandItem
                    value={customOption}
                    onSelect={() => {
                      onChange(customOption);
                      setOpen(false);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    Usar &quot;{customOption}&quot;
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-[11px] text-muted-foreground">
        Digite parte do nome do local de votação apresentada e selecione na lista. A consulta oficial
        está no site do TRE-DF; a lista aqui é uma referência auxiliar (amostra + base interna).
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
