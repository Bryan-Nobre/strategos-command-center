import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
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
  onNeighborhoodChange: (v: string) => void;
  onCityChange: (v: string) => void;
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
  onNeighborhoodChange,
  onCityChange,
  onStateUfChange,
}: Props) {
  const [lookup, setLookup] = useState<LandingCepLookupState>({ status: "idle" });
  const requestId = useRef(0);

  const onLookupStateChangeRef = useRef(onLookupStateChange);
  onLookupStateChangeRef.current = onLookupStateChange;

  useEffect(() => {
    onLookupStateChangeRef.current(lookup);
  }, [lookup]);

  useEffect(() => {
    const controller = new AbortController();
    const raw = cepValue.trim();

    if (!raw) {
      setLookup({ status: "idle" });
      return () => controller.abort();
    }

    if (!isCepCompleteForLookup(raw)) {
      if (raw.replace(/\D/g, "").length >= 8) {
        setLookup({ status: "invalid" });
      } else {
        setLookup({ status: "idle" });
      }
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

          setLookup({ status: "found", geo: result });
          if (result.neighborhood) onNeighborhoodChange(result.neighborhood);
          if (result.city) onCityChange(result.city);
          if (result.state_uf) onStateUfChange(result.state_uf);
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
  }, [cepValue, onNeighborhoodChange, onCityChange, onStateUfChange]);

  return (
    <div className="space-y-2 sm:col-span-2">
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
          Ao informar o CEP, cidade e bairro são preenchidos automaticamente nos campos abaixo.
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
    </div>
  );
}

export function getGeoForEnrichment(
  lookup: LandingCepLookupState,
): PostalCodeResolveSuccess | null {
  if (lookup.status === "found") return lookup.geo;
  return null;
}
