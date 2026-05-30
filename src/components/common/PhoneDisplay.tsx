import { Phone } from "lucide-react";
import { formatPhoneBrDisplay, telHref } from "@/lib/normalize-phone";
import { cn } from "@/lib/utils";

type Props = {
  phone: string | null | undefined;
  className?: string;
  showIcon?: boolean;
  asLink?: boolean;
};

/** Exibe telefone mascarado; link tel:+55 quando asLink. */
export function PhoneDisplay({ phone, className, showIcon = false, asLink = true }: Props) {
  const display = formatPhoneBrDisplay(phone);
  if (!display) return <span className={cn("text-muted-foreground", className)}>—</span>;

  const href = telHref(phone);
  if (asLink && href) {
    return (
      <a
        href={href}
        className={cn(
          "inline-flex items-center gap-1 text-primary hover:underline",
          className,
        )}
      >
        {showIcon && <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        {display}
      </a>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {showIcon && <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />}
      {display}
    </span>
  );
}
