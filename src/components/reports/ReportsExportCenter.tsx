import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  Calendar,
  Crown,
  Download,
  FileSpreadsheet,
  MapPin,
  MessageSquareWarning,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { formatPeriodLabel, type ReportsDateRange } from "@/lib/reports-period";
import { readExportLog, type ReportsExportLogEntry } from "@/lib/reports-export-log";
import type { ReportsSummary } from "@/services/reports";

export type ExportKind =
  | "supporters"
  | "demands"
  | "leaderships"
  | "territories"
  | "agenda"
  | "activities"
  | "executive";

const EXPORT_DEFS: {
  kind: ExportKind;
  label: string;
  description: string;
  icon: typeof Users;
  countKey: keyof ReportsSummary["exportCounts"];
}[] = [
  {
    kind: "supporters",
    label: "Apoiadores",
    description: "Lista completa com filtros aplicados",
    icon: Users,
    countKey: "supporters",
  },
  {
    kind: "demands",
    label: "Demandas",
    description: "Detalhamento operacional de demandas",
    icon: MessageSquareWarning,
    countKey: "demands",
  },
  {
    kind: "leaderships",
    label: "Lideranças",
    description: "Rede de lideranças e regiões",
    icon: Crown,
    countKey: "leaderships",
  },
  {
    kind: "territories",
    label: "Territórios",
    description: "Ranking territorial agregado",
    icon: MapPin,
    countKey: "territories",
  },
  {
    kind: "agenda",
    label: "Agenda",
    description: "Eventos no período selecionado",
    icon: Calendar,
    countKey: "agenda",
  },
  {
    kind: "activities",
    label: "Atividades",
    description: "Log operacional do período",
    icon: Activity,
    countKey: "activities",
  },
  {
    kind: "executive",
    label: "Consolidado executivo",
    description: "Apoiadores + demandas em um arquivo",
    icon: FileSpreadsheet,
    countKey: "supporters",
  },
];

export function ReportsExportCenter({
  range,
  counts,
  tenantId,
  disabled,
  onExport,
  lastExports,
}: {
  range: ReportsDateRange;
  counts?: ReportsSummary["exportCounts"];
  tenantId: string;
  disabled?: boolean;
  onExport: (kind: ExportKind) => void;
  lastExports?: ReportsExportLogEntry[];
}) {
  const log = lastExports ?? readExportLog(tenantId);
  const periodLabel = formatPeriodLabel(range);

  return (
    <ReportsSection
      variant="exports"
      index={2}
      title="Central de exportações"
      description="Downloads sob demanda — nenhuma lista completa é carregada até você exportar."
      icon={Download}
      unstyledBody
    >
      <div className="reports-export-grid">
        {EXPORT_DEFS.map((def) => {
          const last = log.find((e) => e.type === def.kind);
          const rows = counts?.[def.countKey] ?? 0;
          return (
            <div key={def.kind} className="reports-export-card">
              <div className="flex items-start gap-3">
                <div className="reports-export-icon">
                  <def.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{def.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{def.description}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{rows.toLocaleString("pt-BR")}</span>{" "}
                    linhas · {periodLabel}
                  </p>
                  {last && (
                    <p className="mt-1 text-[10px] text-muted-foreground/80">
                      Última:{" "}
                      {format(new Date(last.at), "dd/MM/yy HH:mm", { locale: ptBR })} (
                      {last.rows} linhas)
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-8 w-full text-xs"
                disabled={disabled}
                onClick={() => onExport(def.kind)}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
          );
        })}
      </div>
    </ReportsSection>
  );
}
