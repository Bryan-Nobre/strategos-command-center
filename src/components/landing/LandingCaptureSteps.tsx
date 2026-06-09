import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CaptureForm } from "@/lib/landing-capture-form";

const STEPS = [
  { id: "personal", label: "Seus dados" },
  { id: "address", label: "Endereço" },
  { id: "support", label: "Apoio" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

type LandingCaptureStepsProps = {
  register: UseFormRegister<CaptureForm>;
  control: Control<CaptureForm>;
  errors: FieldErrors<CaptureForm>;
  watch: UseFormWatch<CaptureForm>;
  setValue: UseFormSetValue<CaptureForm>;
  handleSubmit: UseFormHandleSubmit<CaptureForm>;
  isSubmitting: boolean;
  onSubmit: (values: CaptureForm) => void;
  personalStep: ReactNode;
  addressStep: ReactNode;
  supportStep: ReactNode;
};

export function LandingCaptureSteps({
  errors,
  handleSubmit,
  isSubmitting,
  onSubmit,
  personalStep,
  addressStep,
  supportStep,
}: LandingCaptureStepsProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const stepContent: Record<StepId, ReactNode> = {
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
    };
  }, [errors]);

  function goNext() {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      aria-label="Cadastro de apoio à campanha"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Passo {stepIndex + 1} de {STEPS.length} · <strong className="text-foreground">{step.label}</strong>
          </span>
          <span className="tabular-nums">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" aria-hidden />
        <div className="flex gap-1" role="tablist" aria-label="Etapas do cadastro">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === stepIndex}
              aria-current={i === stepIndex ? "step" : undefined}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors sm:text-xs",
                i === stepIndex
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                stepErrors[s.id] && i !== stepIndex && "ring-1 ring-destructive/40",
              )}
              onClick={() => setStepIndex(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" aria-labelledby={`landing-step-${step.id}`}>
        {stepContent[step.id]}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
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

        {stepIndex < STEPS.length - 1 ? (
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
