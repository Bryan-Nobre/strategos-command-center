import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportsSectionVariant =
  | "summary"
  | "exports"
  | "territory"
  | "pipeline"
  | "demands"
  | "electoral";

const variantMeta: Record<ReportsSectionVariant, { tag: string; accentClass: string }> = {
  summary: { tag: "Resumo", accentClass: "reports-section--summary" },
  exports: { tag: "Exportação", accentClass: "reports-section--exports" },
  territory: { tag: "Território", accentClass: "reports-section--territory" },
  pipeline: { tag: "Funil", accentClass: "reports-section--pipeline" },
  demands: { tag: "Operação", accentClass: "reports-section--demands" },
  electoral: { tag: "Eleitoral", accentClass: "reports-section--electoral" },
};

export function ReportsSection({
  variant,
  index,
  title,
  description,
  icon: Icon,
  actions,
  children,
  id,
  unstyledBody,
  bodyClassName,
}: {
  variant: ReportsSectionVariant;
  index: number;
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
  unstyledBody?: boolean;
  bodyClassName?: string;
}) {
  const meta = variantMeta[variant];
  return (
    <section
      id={id}
      className={cn("reports-section dashboard-section", meta.accentClass)}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <header className="dashboard-section-header">
        <div className="dashboard-section-header-main">
          <div className="dashboard-section-label-row">
            <span className="dashboard-section-index">{String(index).padStart(2, "0")}</span>
            <span className="dashboard-section-tag">{meta.tag}</span>
          </div>
          <div className="dashboard-section-title-row">
            <div className="dashboard-section-icon" aria-hidden>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 id={id ? `${id}-title` : undefined} className="dashboard-section-title">
                {title}
              </h2>
              {description && <p className="dashboard-section-desc">{description}</p>}
            </div>
          </div>
        </div>
        {actions && <div className="dashboard-section-actions">{actions}</div>}
      </header>
      <div className={cn(!unstyledBody && "dashboard-section-body", bodyClassName)}>{children}</div>
    </section>
  );
}
