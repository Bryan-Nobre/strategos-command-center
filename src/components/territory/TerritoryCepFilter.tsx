import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCepMask, isCepCompleteForLookup } from "@/lib/postal-code";
import { resolvePostalCode } from "@/services/postal-code";
import type { TerritoryFilter } from "@/lib/territory-filter";
import { territoryFilterLabel } from "@/lib/territory-filter";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 450;

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; filter: TerritoryFilter }
  | { status: "invalid" }
  | { status: "not_found" }
  | { status: "error" };

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

type Props = {
  /** Bairro ativo vindo da URL ou estado pai (ex.: filtro já aplicado). */
  activeFilter?: TerritoryFilter | null;
  onResolved: (filter: TerritoryFilter) => void;
  onClear: () => void;
  className?: string;
  label?: string;
  hint?: string;
  compact?: boolean;
};

export function TerritoryCepFilter({
  activeFilter,
  onResolved,
  onClear,
  className,
  label = "CEP (território)",
  hint = "Informe o CEP para filtrar mapa e aprovação pelo bairro reconhecido.",
  compact = false,
}: Props) {
  const [cepValue, setCepValue] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const requestId = useRef(0);
  const onResolvedRef = useRef(onResolved);
  const onClearRef = useRef(onClear);
  onResolvedRef.current = onResolved;
  onClearRef.current = onClear;

  useEffect(() => {
    const controller = new AbortController();
    const raw = cepValue.trim();

    if (!raw) {
      setLookup({ status: "idle" });
      return () => controller.abort();
    }

    if (!isCepCompleteForLookup(raw)) {
      setLookup(raw.replace(/\D/g, "").length >= 8 ? { status: "invalid" } : { status: "idle" });
      return () => controller.abort();
    }

    const id = ++requestId.current;
    setLookup({ status: "loading" });

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await resolvePostalCode(raw, controller.signal);
          if (controller.signal.aborted || requestId.current !== id) return;

          if (!result.success) {
            setLookup(
              result.reason === "invalid_cep"
                ? { status: "invalid" }
                : result.reason === "not_found"
                  ? { status: "not_found" }
                  : { status: "error" },
            );
            return;
          }

          const neighborhood = result.neighborhood?.trim() || result.city?.trim() || "";
          if (!neighborhood) {
            setLookup({ status: "not_found" });
            return;
          }

          const filter: TerritoryFilter = {
            neighborhood,
            city: result.city?.trim() || null,
            stateUf: result.state_uf?.trim() || null,
          };
          setLookup({ status: "found", filter });
          onResolvedRef.current(filter);
        } catch (error) {
          if (isAbortError(error) || requestId.current !== id) return;
          setLookup({ status: "error" });
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cepValue]);

  const activeLabel = territoryFilterLabel(activeFilter);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className={cn(compact && "text-[10px] font-medium text-muted-foreground")}>{label}</Label>
      <div className="relative">
        <Input
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={cepValue}
          onChange={(e) => setCepValue(formatCepMask(e.target.value))}
          className={cn("h-9", compact && "text-xs")}
        />
        {lookup.status === "loading" && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {!compact && hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {lookup.status === "invalid" && (
        <p className="text-xs text-amber-600 dark:text-amber-500">CEP inválido.</p>
      )}
      {lookup.status === "not_found" && (
        <p className="text-xs text-muted-foreground">CEP não encontrado.</p>
      )}
      {lookup.status === "error" && (
        <p className="text-xs text-muted-foreground">Não foi possível consultar o CEP agora.</p>
      )}
      {activeLabel && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-xs">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-medium text-foreground">{activeLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px]"
            onClick={() => {
              setCepValue("");
              setLookup({ status: "idle" });
              onClearRef.current();
            }}
          >
            <X className="mr-0.5 h-3 w-3" />
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
