import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { PhoneFormField } from "@/components/common/PhoneFormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TerritoryChip } from "@/components/territory/TerritoryChip";
import { LandingCepLookup } from "@/components/landing/LandingCepLookup";
import { LandingLgpdConsent } from "@/components/landing/LandingLgpdConsent";
import { registerDemandFromLanding } from "@/services/landing";
import { landingDemandSchema, DEMAND_CATEGORY_LABELS } from "@/types/domain";
import { toast } from "sonner";
import type { z } from "zod";

export const LANDING_DEMAND_FORM_ID = "landing-demand-form";

type DemandForm = z.infer<typeof landingDemandSchema>;

export function LandingDemandSection({
  publicCode,
  neighborhood,
  city,
  stateUf,
  embedded = false,
  formId = LANDING_DEMAND_FORM_ID,
  hideSubmitButton = false,
  lgpdConsent = false,
  onLgpdChange,
  lgpdError,
  onPendingChange,
}: {
  publicCode: string;
  neighborhood?: string;
  city?: string;
  stateUf?: string;
  embedded?: boolean;
  formId?: string;
  hideSubmitButton?: boolean;
  lgpdConsent?: boolean;
  onLgpdChange?: (checked: boolean) => void;
  lgpdError?: string;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [cepInput, setCepInput] = useState("");
  const [demandStateUf, setDemandStateUf] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
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

  useEffect(() => {
    onPendingChange?.(mutation.isPending);
  }, [mutation.isPending, onPendingChange]);

  const submitDemand = handleSubmit((values) => {
    if (!lgpdConsent) {
      toast.error("Aceite o consentimento LGPD para enviar a demanda.");
      return;
    }
    mutation.mutate(values);
  });

  const demandForm = (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        Registre uma solicitação da comunidade. Ela vai para a aba <strong>Demandas</strong> da campanha.
        {embedded
          ? " Etapa opcional — envie apenas se quiser registrar algo no seu bairro."
          : " Separada do cadastro de apoio acima."}
      </p>
      {territoryLabel && (
        <div className="mb-3">
          <TerritoryChip label={territoryLabel} />
        </div>
      )}
      <form id={formId} onSubmit={submitDemand} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Seu nome *</Label>
          <Input {...register("requester_name")} />
          {errors.requester_name && (
            <p className="text-xs text-destructive">{errors.requester_name.message}</p>
          )}
        </div>
        <PhoneFormField
          className="sm:col-span-2"
          control={control}
          name="requester_phone"
          label="Telefone"
        />
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
        {embedded && onLgpdChange && (
          <LandingLgpdConsent
            checked={lgpdConsent}
            onCheckedChange={onLgpdChange}
            error={lgpdError}
            publicCode={publicCode}
          />
        )}
        {!hideSubmitButton && (
          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="secondary"
              disabled={isSubmitting || mutation.isPending || !lgpdConsent}
              className="w-full sm:w-auto"
            >
              {mutation.isPending ? "Enviando..." : "Enviar demanda"}
            </Button>
          </div>
        )}
      </form>
    </>
  );

  if (embedded) {
    return (
      <div className="landing-demand landing-demand--embedded space-y-3">
        <div className="flex items-start gap-2">
          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">
              Precisa de algo no seu bairro?{" "}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </p>
          </div>
        </div>
        {demandForm}
      </div>
    );
  }

  return (
    <details className="landing-demand rounded-xl border border-border/70 bg-muted/15">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        Precisa de algo no seu bairro? <span className="text-xs text-muted-foreground">(opcional)</span>
      </summary>
      <div className="border-t border-border/60 px-4 pb-4 pt-3">{demandForm}</div>
    </details>
  );
}
