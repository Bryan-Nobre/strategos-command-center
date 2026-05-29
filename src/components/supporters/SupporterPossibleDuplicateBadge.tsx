import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Indica possível duplicata (telefone/e-mail) — merge manual futuro. Segurança real: backend. */
export function SupporterPossibleDuplicateBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-500/50 bg-amber-500/10 text-[10px] font-medium text-amber-800 dark:text-amber-200",
        className,
      )}
    >
      Possível duplicado
    </Badge>
  );
}
