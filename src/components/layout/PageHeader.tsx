import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  showTitle = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Título já aparece na topbar; ative só para duplicar no conteúdo */
  showTitle?: boolean;
}) {
  if (!showTitle && !description && !actions) return null;

  return (
    <div className="flex flex-col gap-3 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {showTitle && <h1 className="page-heading text-2xl tracking-tight sm:text-3xl">{title}</h1>}
        {description && (
          <p className={cn("text-sm text-muted-foreground", showTitle && "mt-1.5")}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="page-header-actions flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}
