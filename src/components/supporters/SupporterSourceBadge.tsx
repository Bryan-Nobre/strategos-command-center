import { Globe, Upload, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SUPPORTER_SOURCE_LABELS } from "@/types/domain";
import { cn } from "@/lib/utils";

const sourceStyles: Record<string, string> = {
  landing: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  manual: "border-border bg-muted/50 text-muted-foreground",
  import: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

const sourceIcons = {
  landing: Globe,
  manual: UserPlus,
  import: Upload,
} as const;

export function SupporterSourceBadge({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const Icon = sourceIcons[source as keyof typeof sourceIcons] ?? UserPlus;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[10px] font-semibold", sourceStyles[source], className)}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {SUPPORTER_SOURCE_LABELS[source] ?? source}
    </Badge>
  );
}
