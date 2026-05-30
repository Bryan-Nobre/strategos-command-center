import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarClock,
  Clock,
  Crown,
  Globe,
  MessageSquareWarning,
  PauseCircle,
  Users,
  UserPlus,
  XCircle,
} from "lucide-react";
import { MetricCard } from "@/components/common/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatPercent,
  PLAN_ORDER,
  planLabel,
  type PlatformMetrics,
} from "@/lib/admin-platform-metrics";
import { TENANT_STATUS_LABELS } from "@/types/tenant";

function DistributionBar({
  segments,
}: {
  segments: Array<{ label: string; value: number; className: string }>;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              className={s.className}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${s.className}`} />
            {s.label}: <span className="font-medium text-foreground">{s.value}</span>
            <span>({formatPercent(s.value, total)})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function AdminPlatformMetrics({ data }: { data: PlatformMetrics }) {
  const statusSegments = [
    {
      label: TENANT_STATUS_LABELS.active,
      value: data.activeTenants,
      className: "bg-primary",
    },
    {
      label: TENANT_STATUS_LABELS.pending,
      value: data.pendingTenants,
      className: "bg-amber-500",
    },
    {
      label: TENANT_STATUS_LABELS.suspended,
      value: data.suspendedTenants,
      className: "bg-orange-500",
    },
    {
      label: TENANT_STATUS_LABELS.cancelled,
      value: data.cancelledTenants,
      className: "bg-muted-foreground/50",
    },
  ];

  const planSegments = PLAN_ORDER.map((plan, i) => ({
    label: planLabel(plan),
    value: data.byPlan[plan],
    className: ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-slate-500"][i] ?? "bg-primary",
  }));

  return (
    <div className="admin-metrics space-y-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Clientes na plataforma"
          value={String(data.totalTenants)}
          icon={Building2}
          tone="primary"
          featured
          context={{
            last7: data.newTenants30d,
            deltaPct: null,
            sublabel: `${data.activationRatePct}% ativos · ${data.newTenants30d} novos em 30 dias`,
          }}
        />
        <MetricCard
          label="Campanhas ativas"
          value={String(data.activeTenants)}
          icon={Activity}
          tone="success"
          context={{
            last7: data.activeTenants,
            deltaPct: null,
            sublabel: `${data.pendingTenants} pendentes · ${data.suspendedTenants} suspensas`,
          }}
        />
        <MetricCard
          label="Vigência em alerta"
          value={String(data.planVigencia.expiringWithin7Days)}
          icon={CalendarClock}
          tone="warning"
          context={{
            last7: data.planVigencia.expiringWithin7Days,
            deltaPct: null,
            sublabel: `${data.planVigencia.expired} vencidas · ${data.planVigencia.withoutPeriod} sem período`,
          }}
        />
        <MetricCard
          label="Apoiadores (todas campanhas)"
          value={data.totalSupporters.toLocaleString("pt-BR")}
          icon={Users}
          tone="accent"
          context={{
            last7: data.supportersLast30d,
            deltaPct: null,
            sublabel: `+${data.supportersLast30d.toLocaleString("pt-BR")} nos últimos 30 dias · média ${data.avgSupportersPerTenant}/cliente`,
          }}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status dos clientes</CardTitle>
            <CardDescription>Distribuição operacional das campanhas</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionBar segments={statusSegments} />
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Planos comerciais</CardTitle>
            <CardDescription>Quantidade por tier contratado</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionBar segments={planSegments} />
          </CardContent>
        </Card>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Membros de equipe"
          value={data.totalMembers.toLocaleString("pt-BR")}
          icon={UserPlus}
          tone="primary"
        />
        <MetricCard
          label="Lideranças"
          value={data.totalLeaderships.toLocaleString("pt-BR")}
          icon={Crown}
          tone="accent"
        />
        <MetricCard
          label="Landings publicadas"
          value={String(data.publishedLandings)}
          icon={Globe}
          tone="success"
          context={{
            last7: data.publishedLandings,
            deltaPct: null,
            sublabel:
              data.totalTenants > 0
                ? `${formatPercent(data.publishedLandings, data.totalTenants)} dos clientes`
                : "—",
          }}
        />
        <MetricCard
          label="Demandas abertas"
          value={data.openDemands.toLocaleString("pt-BR")}
          icon={MessageSquareWarning}
          tone="warning"
          context={{
            last7: data.openDemands,
            deltaPct: null,
            sublabel: `${data.resolvedDemands.toLocaleString("pt-BR")} resolvidas no total`,
          }}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-elegant lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              Vigência comercial
            </CardTitle>
            <CardDescription>Controle interno do período do plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-muted-foreground">Com período ativo</span>
              <span className="font-semibold tabular-nums">{data.planVigencia.activeWithPeriod}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Vence em até 7 dias
              </span>
              <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                {data.planVigencia.expiringWithin7Days}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                Período vencido
              </span>
              <span className="font-semibold tabular-nums text-destructive">
                {data.planVigencia.expired}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-muted-foreground">Sem datas cadastradas</span>
              <span className="font-semibold tabular-nums">{data.planVigencia.withoutPeriod}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/tenants">Gerenciar em Clientes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-elegant lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Renovações próximas</CardTitle>
            <CardDescription>Clientes com fim de plano nos próximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {data.expiringSoon.length === 0 ? (
              <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum cliente com vencimento nos próximos 7 dias.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.expiringSoon.map((row) => (
                  <li
                    key={row.tenantId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {planLabel(row.plan)} · até {formatDateBr(row.endDate)}
                      </p>
                    </div>
                    <Badge variant={row.daysRemaining <= 3 ? "destructive" : "secondary"}>
                      {row.daysRemaining === 0
                        ? "Encerra hoje"
                        : row.daysRemaining === 1
                          ? "1 dia"
                          : `${row.daysRemaining} dias`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="shadow-elegant">
          <CardContent className="flex items-center gap-3 p-4">
            <PauseCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Suspensos</p>
              <p className="text-xl font-bold tabular-nums">{data.suspendedTenants}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-xl font-bold tabular-nums">{data.pendingTenants}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cancelados</p>
              <p className="text-xl font-bold tabular-nums">{data.cancelledTenants}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Novos (30d)</p>
              <p className="text-xl font-bold tabular-nums">{data.newTenants30d}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
