import { ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { landingLgpdHubPath } from "@/lib/landing-lgpd-routes";
import { cn } from "@/lib/utils";

export function LandingLgpdConsent({
  checked,
  onCheckedChange,
  error,
  publicCode,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  publicCode: string;
}) {
  const lgpdHref = landingLgpdHubPath(publicCode);

  return (
    <div
      className={cn(
        "landing-lgpd-consent sm:col-span-2",
        checked && "landing-lgpd-consent--checked",
        error && "landing-lgpd-consent--error",
      )}
    >
      <div className="flex items-start gap-3.5">
        <Checkbox
          id="landing-lgpd"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="landing-lgpd-consent__checkbox mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
          aria-describedby="landing-lgpd-desc"
        />
        <label
          htmlFor="landing-lgpd"
          className="landing-lgpd-consent__label flex min-w-0 flex-1 cursor-pointer flex-col gap-1.5"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck
              className={cn(
                "h-4 w-4 shrink-0",
                checked ? "text-primary" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span className="text-sm font-medium leading-snug text-foreground">
              Consentimento LGPD *
            </span>
          </span>
          <span
            id="landing-lgpd-desc"
            className="text-sm font-normal leading-relaxed text-muted-foreground"
          >
            Li e aceito o{" "}
            <a
              href={lgpdHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              Termo de Consentimento (LGPD)
            </a>{" "}
            para o tratamento dos meus dados pessoais e cadastrais, inclusive contato por e-mail,
            telefone, SMS e WhatsApp, conforme a Lei nº 13.709/2018 (LGPD).
          </span>
        </label>
      </div>
      {error && (
        <p className="landing-lgpd-consent__error mt-2 pl-[2.125rem] text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
