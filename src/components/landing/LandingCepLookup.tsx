import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCepMask, isCepCompleteForLookup } from "@/lib/postal-code";
import {
  resolvePostalCode,
  type PostalCodeResolveSuccess,
} from "@/services/postal-code";

export type LandingCepLookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; geo: PostalCodeResolveSuccess }
  | { status: "invalid" }
  | { status: "not_found" }
  | { status: "error" };

type Props = {
  cepValue: string;
  onCepChange: (masked: string) => void;
  onLookupStateChange: (state: LandingCepLookupState) => void;
  neighborhood: string;
  city: string;
  onNeighborhoodChange: (v: string) => void;
  onCityChange: (v: string) => void;
  stateUf: string;
  onStateUfChange: (v: string) => void;
};

const DEBOUNCE_MS = 450;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function LandingCepLookup({
  cepValue,
  onCepChange,
  onLookupStateChange,
  neighborhood,
  city,
  onNeighborhoodChange,
  onCityChange,
  stateUf,
  onStateUfChange,
}: Props) {
  const [lookup, setLookup] = useState<LandingCepLookupState>({ status: "idle" });
  const [confirmed, setConfirmed] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    onLookupStateChange(lookup);
  }, [lookup, onLookupStateChange]);

  useEffect(() => {
    const controller = new AbortController();
    const raw = cepValue.trim();

    if (!raw) {
      setLookup({ status: "idle" });
      setConfirmed(false);
      return () => controller.abort();
    }

    if (!isCepCompleteForLookup(raw)) {
      if (raw.replace(/\D/g, "").length >= 8) {
        setLookup({ status: "invalid" });
      } else {
        setLookup({ status: "idle" });
      }
      setConfirmed(false);
      return () => controller.abort();
    }

    const id = ++requestId.current;
    setLookup({ status: "loading" });
    setConfirmed(false);

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

          setLookup({ status: "found", geo: result });
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

  const showFound = lookup.status === "found" && confirmed;

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="space-y-2">
        <Label htmlFor="landing-cep">CEP</Label>
        <div className="relative">
          <Input
            id="landing-cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cepValue}
            onChange={(e) => onCepChange(formatCepMask(e.target.value))}
          />
          {lookup.status === "loading" && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ajuda a localizar seu bairro automaticamente (opcional).
        </p>
        {lookup.status === "invalid" && (
          <p className="text-xs text-amber-600 dark:text-amber-500">
            CEP inválido. Você pode continuar sem informar o CEP.
          </p>
        )}
        {lookup.status === "not_found" && (
          <p className="text-xs text-muted-foreground">
            CEP não encontrado. Informe bairro e cidade manualmente, se quiser.
          </p>
        )}
        {lookup.status === "error" && (
          <p className="text-xs text-muted-foreground">
            Não foi possível consultar o CEP agora. O cadastro segue normalmente.
          </p>
        )}
      </div>

      {lookup.status === "found" && !confirmed && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <p className="mb-2 font-medium text-foreground">Localização encontrada</p>
          <p className="text-xs text-muted-foreground">
            Confirme ou ajuste os dados abaixo antes de enviar.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Bairro</Label>
              <Input
                value={neighborhood || lookup.geo.neighborhood || ""}
                onChange={(e) => onNeighborhoodChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Cidade</Label>
              <Input
                value={city || lookup.geo.city || ""}
                onChange={(e) => onCityChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">UF</Label>
              <Input
                maxLength={2}
                value={stateUf || lookup.geo.state_uf || ""}
                onChange={(e) => onStateUfChange(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <button
            type="button"
            className="mt-3 text-xs font-medium text-primary hover:underline"
            onClick={() => {
              if (!neighborhood && lookup.geo.neighborhood) {
                onNeighborhoodChange(lookup.geo.neighborhood);
              }
              if (!city && lookup.geo.city) {
                onCityChange(lookup.geo.city);
              }
              if (!stateUf && lookup.geo.state_uf) {
                onStateUfChange(lookup.geo.state_uf);
              }
              setConfirmed(true);
            }}
          >
            Usar estes dados
          </button>
        </div>
      )}

      {showFound && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            <p className="font-medium text-foreground">Localização confirmada</p>
            <p className="text-xs text-muted-foreground">
              {[neighborhood, city, stateUf].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function getGeoForEnrichment(
  lookup: LandingCepLookupState,
): PostalCodeResolveSuccess | null {
  if (lookup.status === "found") return lookup.geo;
  return null;
}
