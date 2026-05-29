import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rótulo territorial unificado (label amigável; chave canônica no backend). */
export function TerritoryChip({
  label,
  sublabel,
  className,
}: {
  label: string;
  sublabel?: string | null;
  className?: string;
}) {
  if (!label.trim()) return null;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-foreground",
        className,
      )}
    >
      <MapPin className="h-3 w-3 shrink-0 text-primary" aria-hidden />
      <span className="truncate">{label}</span>
      {sublabel && (
        <span className="truncate text-muted-foreground">· {sublabel}</span>
      )}
    </span>
  );
}
