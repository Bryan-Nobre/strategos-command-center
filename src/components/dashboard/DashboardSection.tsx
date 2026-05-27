import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardSectionVariant =
  | "priorities"
  | "kpis"
  | "territory"
  | "goals"
  | "pipeline"
  | "analytics"
  | "activity";

const variantMeta: Record<
  DashboardSectionVariant,
  { tag: string; accentClass: string }
> = {
  priorities: { tag: "Prioridades", accentClass: "dashboard-section--priorities" },
  kpis: { tag: "Indicadores", accentClass: "dashboard-section--kpis" },
  territory: { tag: "Territórios", accentClass: "dashboard-section--territory" },
  goals: { tag: "Metas", accentClass: "dashboard-section--goals" },
  pipeline: { tag: "Pipeline", accentClass: "dashboard-section--pipeline" },
  analytics: { tag: "Análises", accentClass: "dashboard-section--analytics" },
  activity: { tag: "Atividade", accentClass: "dashboard-section--activity" },
};

export function DashboardSection({
  variant,
  index,
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
  bodyClassName,
  unstyledBody,
}: {
  variant: DashboardSectionVariant;
  index: number;
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Conteúdo já com painel próprio (ex.: hero interno do mapa). */
  unstyledBody?: boolean;
}) {
  const meta = variantMeta[variant];
  const indexLabel = String(index).padStart(2, "0");

  return (
    <section
      className={cn("dashboard-section", meta.accentClass, className)}
      aria-labelledby={`dashboard-section-${variant}-title`}
    >
      <header className="dashboard-section-header">
        <div className="dashboard-section-header-main">
          <div className="dashboard-section-label-row">
            <span className="dashboard-section-index">{indexLabel}</span>
            <span className="dashboard-section-tag">{meta.tag}</span>
          </div>
          <div className="dashboard-section-title-row">
            <div className="dashboard-section-icon" aria-hidden>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2
                id={`dashboard-section-${variant}-title`}
                className="dashboard-section-title"
              >
                {title}
              </h2>
              {description && (
                <p className="dashboard-section-desc">{description}</p>
              )}
            </div>
          </div>
        </div>
        {actions && <div className="dashboard-section-actions">{actions}</div>}
      </header>
      <div
        className={cn(
          !unstyledBody && "dashboard-section-body",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
