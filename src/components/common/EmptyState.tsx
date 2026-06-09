import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  linkLabel,
  linkTo,
  linkSearch,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  linkLabel?: string;
  linkTo?: string;
  linkSearch?: Record<string, unknown>;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground" />}
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {actionLabel && onAction && (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {linkLabel && linkTo && (
          <Button size="sm" variant="outline" asChild>
            <Link to={linkTo} search={linkSearch as never}>
              {linkLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
