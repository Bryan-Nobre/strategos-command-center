import { Link } from "@tanstack/react-router";
import {
  Crown,
  MessageSquareWarning,
  UserCheck,
  Users,
  UserX,
  Vote,
  GitBranch,
} from "lucide-react";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { cn } from "@/lib/utils";
import type { ReportsSummary } from "@/services/reports";

type KpiItem = {
  label: string;
  value: string;
  icon: typeof Users;
  href?: string;
  search?: Record<string, string>;
  tone?: "default" | "warning";
};

export function ReportsKpiStrip({
  summary,
  funnel,
  isLoading,
}: {
  summary?: ReportsSummary["summary"];
  funnel?: ReportsSummary["funnel"];
  isLoading?: boolean;
}) {
  const funnelTotal =
    (funnel?.interessado ?? 0) +
    (funnel?.apoiador ?? 0) +
    (funnel?.lideranca ?? 0);
  const conversionPct =
    funnelTotal > 0 && funnel?.lideranca
      ? Math.round((funnel.lideranca / funnelTotal) * 100)
      : 0;

  const items: KpiItem[] = [
    {
      label: "Apoiadores",
      value: isLoading ? "—" : String(summary?.totalSupporters ?? 0),
      icon: Users,
      href: "/eleitores",
    },
    {
      label: "Apoio forte",
      value: isLoading ? "—" : String(summary?.strongSupport ?? 0),
      icon: Vote,
      href: "/eleitores",
      search: { apoio: "forte" },
    },
    {
      label: "Indecisos",
      value: isLoading ? "—" : String(summary?.undecided ?? 0),
      icon: UserCheck,
      href: "/eleitores",
      search: { status: "indeciso" },
    },
    {
      label: "Oposição",
      value: isLoading ? "—" : String(summary?.opposition ?? 0),
      icon: UserX,
      href: "/eleitores",
      search: { status: "oposicao" },
    },
    {
      label: "Lideranças",
      value: isLoading ? "—" : String(summary?.leaderships ?? 0),
      icon: Crown,
      href: "/liderancas",
    },
    {
      label: "Demandas abertas",
      value: isLoading ? "—" : String(summary?.openDemands ?? 0),
      icon: MessageSquareWarning,
      href: "/demandas",
      tone: "warning",
    },
    {
      label: "Resolvidas no período",
      value: isLoading ? "—" : String(summary?.resolvedInPeriod ?? 0),
      icon: MessageSquareWarning,
      href: "/demandas",
    },
    {
      label: "Conversão funil",
      value: isLoading ? "—" : `${conversionPct}%`,
      icon: GitBranch,
    },
  ];

  return (
    <ReportsSection
      variant="summary"
      index={1}
      title="Resumo executivo"
      description="Indicadores consolidados do período e da base filtrada — dados reais do CRM."
      icon={Users}
      unstyledBody
      bodyClassName="reports-kpi-grid"
    >
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </ReportsSection>
  );
}

function KpiCard({ label, value, icon: Icon, href, search, tone = "default" }: KpiItem) {
  const inner = (
    <div
      className={cn(
        "reports-kpi-card transition-theme",
        tone === "warning" && "reports-kpi-card--warning",
        href && "hover:border-primary/25 hover:shadow-md",
      )}
    >
      <Icon className="mb-3 h-4 w-4 text-primary opacity-80" />
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className="reports-kpi-value mt-1 tabular-nums">{value}</p>
    </div>
  );

  if (href) {
    return (
      <Link to={href} search={search} className="block min-w-0">
        {inner}
      </Link>
    );
  }
  return inner;
}
