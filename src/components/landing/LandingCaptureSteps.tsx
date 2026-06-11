import { useMemo, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CaptureForm } from "@/lib/landing-capture-form";
import { LANDING_DEMAND_FORM_ID } from "@/components/landing/LandingDemandSection";

export const LANDING_CAPTURE_CORE_STEPS = [
  { id: "personal", label: "Seus dados" },
  { id: "address", label: "Endereço" },
  { id: "support", label: "Apoio" },
] as const;

export const LANDING_CAPTURE_OPTIONAL_STEP = {
  id: "demand",
  label: "Seu bairro",
  shortLabel: "Extra",
} as const;

type CoreStepId = (typeof LANDING_CAPTURE_CORE_STEPS)[number]["id"];

type LandingCaptureStepsProps = {
  errors: FieldErrors<CaptureForm>;
  handleSubmit: UseFormHandleSubmit<CaptureForm>;
  isSubmitting: boolean;
  onSubmit: (values: CaptureForm) => void;
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
  personalStep: ReactNode;
  addressStep: ReactNode;
  supportStep: ReactNode;
  demandStep: ReactNode;
  demandSubmitDisabled?: boolean;
  demandSubmitPending?: boolean;
};

export function LandingCaptureSteps({
  errors,
  handleSubmit,
  isSubmitting,
  onSubmit,
  stepIndex,
  onStepIndexChange,
  personalStep,
  addressStep,
  supportStep,
  demandStep,
  demandSubmitDisabled = false,
  demandSubmitPending = false,
}: LandingCaptureStepsProps) {
  const isOptionalStep = stepIndex === LANDING_CAPTURE_CORE_STEPS.length;
  const coreStep = !isOptionalStep ? LANDING_CAPTURE_CORE_STEPS[stepIndex] : null;
  const progress = isOptionalStep
    ? 100
    : ((stepIndex + 1) / LANDING_CAPTURE_CORE_STEPS.length) * 100;

  const coreStepContent: Record<CoreStepId, ReactNode> = {
    personal: personalStep,
    address: addressStep,
    support: supportStep,
  };

  const stepErrors = useMemo(() => {
    const personalKeys = ["name", "birth_date", "email", "phone"] as const;
    const addressKeys = ["voting_place_name"] as const;
    const supportKeys = ["lgpd_consent"] as const;

    return {
      personal: personalKeys.some((k) => errors[k]),
      address: addressKeys.some((k) => errors[k]),
      support: supportKeys.some((k) => errors[k]),
      demand: false,
    };
  }, [errors]);

  function goNext() {
    if (stepIndex < LANDING_CAPTURE_CORE_STEPS.length - 1) {
      onStepIndexChange(stepIndex + 1);
    }
  }

  function goBack() {
    if (stepIndex > 0) onStepIndexChange(stepIndex - 1);
  }

  const stepNav = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {isOptionalStep ? (
            <>
              <strong className="text-foreground">Extra opcional</strong>
              <span className="text-muted-foreground"> · {LANDING_CAPTURE_OPTIONAL_STEP.label}</span>
            </>
          ) : (
            <>
              Passo {stepIndex + 1} de {LANDING_CAPTURE_CORE_STEPS.length} ·{" "}
              <strong className="text-foreground">{coreStep?.label}</strong>
            </>
          )}
        </span>
        <span className="tabular-nums">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-1.5" aria-hidden />
      <div className="flex gap-1" role="tablist" aria-label="Etapas do cadastro">
        {LANDING_CAPTURE_CORE_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={!isOptionalStep && i === stepIndex}
            aria-current={!isOptionalStep && i === stepIndex ? "step" : undefined}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors sm:text-xs",
              !isOptionalStep && i === stepIndex
                ? "bg-primary/10 text-primary"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
              stepErrors[s.id] && i !== stepIndex && "ring-1 ring-destructive/40",
            )}
            onClick={() => onStepIndexChange(i)}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={isOptionalStep}
          aria-current={isOptionalStep ? "step" : undefined}
          className={cn(
            "max-w-[5.5rem] shrink-0 rounded-md border border-dashed px-2 py-1.5 text-[10px] font-medium transition-colors sm:max-w-none sm:text-xs",
            isOptionalStep
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40",
          )}
          onClick={() => onStepIndexChange(LANDING_CAPTURE_CORE_STEPS.length)}
        >
          <span className="hidden sm:inline">{LANDING_CAPTURE_OPTIONAL_STEP.label}</span>
          <span className="sm:hidden">{LANDING_CAPTURE_OPTIONAL_STEP.shortLabel}</span>
          <span className="ml-0.5 text-[9px] font-normal opacity-80">(opc.)</span>
        </button>
      </div>
    </div>
  );

  const backButton = (
    <Button
      type="button"
      variant="outline"
      className="h-11 sm:w-auto"
      disabled={stepIndex === 0 || isSubmitting}
      onClick={goBack}
    >
      <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
      Voltar
    </Button>
  );

  if (isOptionalStep) {
    return (
      <div className="space-y-4" aria-label="Demanda da comunidade (opcional)">
        {stepNav}
        <div role="tabpanel">{demandStep}</div>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
          {backButton}
          <Button
            type="submit"
            form={LANDING_DEMAND_FORM_ID}
            disabled={demandSubmitDisabled || demandSubmitPending}
            size="lg"
            className="h-11 sm:w-auto"
          >
            {demandSubmitPending ? "Enviando..." : "Enviar demanda"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      aria-label="Cadastro de apoio à campanha"
    >
      {stepNav}

      <div role="tabpanel" aria-labelledby={`landing-step-${coreStep?.id}`}>
        {coreStep && coreStepContent[coreStep.id]}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
        {backButton}

        {stepIndex < LANDING_CAPTURE_CORE_STEPS.length - 1 ? (
          <Button type="button" className="h-11 sm:w-auto" onClick={goNext}>
            Continuar
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting} size="lg" className="h-11 sm:w-auto">
            {isSubmitting ? "Enviando..." : "Confirmar meu apoio"}
          </Button>
        )}
      </div>
    </form>
  );
}
