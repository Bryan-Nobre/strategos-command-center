import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TerritoryChip } from "@/components/territory/TerritoryChip";
import {
  LandingCepLookup,
} from "@/components/landing/LandingCepLookup";
import { registerDemandFromLanding } from "@/services/landing";
import { landingDemandSchema, DEMAND_CATEGORY_LABELS } from "@/types/domain";
import { toast } from "sonner";
import type { z } from "zod";

type DemandForm = z.infer<typeof landingDemandSchema>;

export function LandingDemandSection({
  publicCode,
  neighborhood,
  city,
  stateUf,
}: {
  publicCode: string;
  neighborhood?: string;
  city?: string;
  stateUf?: string;
}) {
  const [cepInput, setCepInput] = useState("");
  const [demandStateUf, setDemandStateUf] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DemandForm>({
    resolver: zodResolver(landingDemandSchema),
    defaultValues: { category: "outros" },
  });

  const formNeighborhood = watch("neighborhood") ?? "";
  const formCity = watch("city") ?? "";

  useEffect(() => {
    if (neighborhood) setValue("neighborhood", neighborhood);
  }, [neighborhood, setValue]);

  useEffect(() => {
    if (city) setValue("city", city);
  }, [city, setValue]);

  useEffect(() => {
    if (stateUf) setDemandStateUf(stateUf);
  }, [stateUf]);

  const setNeighborhood = useCallback((v: string) => setValue("neighborhood", v), [setValue]);
  const setCity = useCallback((v: string) => setValue("city", v), [setValue]);

  const territoryLabel =
    [formNeighborhood, formCity, demandStateUf || stateUf].filter(Boolean).join(" · ") || null;

  const mutation = useMutation({
    mutationFn: (values: DemandForm) =>
      registerDemandFromLanding(publicCode, {
        ...values,
        neighborhood: values.neighborhood ?? neighborhood ?? undefined,
        city: values.city ?? city ?? undefined,
      }),
    onSuccess: () => {
      toast.success("Demanda registrada! A equipe verá na aba Demandas da campanha.");
      reset({ category: "outros", neighborhood: neighborhood ?? "", city: city ?? "" });
      setCepInput("");
      setDemandStateUf(stateUf ?? "");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <details className="landing-demand rounded-xl border border-border/70 bg-muted/15">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        Precisa de algo no seu bairro? <span className="text-xs text-muted-foreground">(opcional)</span>
      </summary>
      <div className="border-t border-border/60 px-4 pb-4 pt-3">
        <p className="mb-3 text-xs text-muted-foreground">
          Registre uma solicitação da comunidade. Ela vai para a aba <strong>Demandas</strong> — separada do
          cadastro de apoio acima.
        </p>
        {territoryLabel && (
          <div className="mb-3">
            <TerritoryChip label={territoryLabel} />
          </div>
        )}
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label>Seu nome *</Label>
            <Input {...register("requester_name")} />
            {errors.requester_name && (
              <p className="text-xs text-destructive">{errors.requester_name.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Telefone</Label>
            <Input {...register("requester_phone")} inputMode="tel" autoComplete="tel" />
          </div>
          <LandingCepLookup
            inputId="landing-demand-cep"
            cepValue={cepInput}
            onCepChange={setCepInput}
            onLookupStateChange={() => {}}
            onNeighborhoodChange={setNeighborhood}
            onCityChange={setCity}
            onStateUfChange={setDemandStateUf}
          />
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input {...register("city")} />
          </div>
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input {...register("neighborhood")} />
          </div>
          {demandStateUf && (
            <div className="space-y-2 sm:col-span-2">
              <Label>UF</Label>
              <Input value={demandStateUf} readOnly className="bg-muted/40" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <select
              {...register("category")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(DEMAND_CATEGORY_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Assunto *</Label>
            <Input {...register("title")} placeholder="Ex.: Poste apagado na Rua X" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Descrição *</Label>
            <Textarea {...register("description")} rows={3} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" disabled={isSubmitting} className="w-full sm:w-auto">
              {mutation.isPending ? "Enviando..." : "Enviar para Demandas"}
            </Button>
          </div>
        </form>
      </div>
    </details>
  );
}
