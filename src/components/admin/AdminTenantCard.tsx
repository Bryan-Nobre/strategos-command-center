import { useEffect, useMemo, useState } from "react";
import { CalendarRange, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { landingPublicPath } from "@/lib/landing-routes";
import { summarizePlanPeriod, validatePlanPeriodRange } from "@/lib/admin-plan-period";
import { TENANT_PLAN_LABELS, TENANT_STATUS_LABELS } from "@/types/tenant";
import type { AdminTenantRow } from "@/services/admin";
import type { Enums } from "@/types/supabase";
import { toast } from "sonner";

const statusBadgeVariant = (status: Enums<"tenant_status">) => {
  if (status === "active") return "default" as const;
  if (status === "suspended" || status === "pending") return "secondary" as const;
  return "outline" as const;
};

function formatPeriodDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

type AdminTenantCardProps = {
  tenant: AdminTenantRow;
  isSaving: boolean;
  onStatusPlanChange: (payload: {
    status?: Enums<"tenant_status">;
    plan?: Enums<"tenant_plan">;
  }) => void;
  onCrmSave: (payload: {
    planPeriodStart: string | null;
    planPeriodEnd: string | null;
    comment: string | null;
  }) => void;
};

export function AdminTenantCard({
  tenant,
  isSaving,
  onStatusPlanChange,
  onCrmSave,
}: AdminTenantCardProps) {
  const [planStart, setPlanStart] = useState(tenant.admin_plan_period_start ?? "");
  const [planEnd, setPlanEnd] = useState(tenant.admin_plan_period_end ?? "");
  const [comment, setComment] = useState(tenant.admin_comment ?? "");
  const [crmDirty, setCrmDirty] = useState(false);

  useEffect(() => {
    setPlanStart(tenant.admin_plan_period_start ?? "");
    setPlanEnd(tenant.admin_plan_period_end ?? "");
    setComment(tenant.admin_comment ?? "");
    setCrmDirty(false);
  }, [
    tenant.id,
    tenant.admin_plan_period_start,
    tenant.admin_plan_period_end,
    tenant.admin_comment,
  ]);

  const periodSummary = useMemo(
    () => summarizePlanPeriod(planStart || null, planEnd || null),
    [planStart, planEnd],
  );

  const periodRangeLabel = useMemo(() => {
    if (planStart && planEnd) {
      return `${formatPeriodDate(planStart)} → ${formatPeriodDate(planEnd)}`;
    }
    if (planStart) return `Início ${formatPeriodDate(planStart)}`;
    if (planEnd) return `Término ${formatPeriodDate(planEnd)}`;
    return null;
  }, [planStart, planEnd]);

  function handleSaveCrm() {
    const start = planStart.trim() || null;
    const end = planEnd.trim() || null;
    const rangeError = validatePlanPeriodRange(start ?? "", end ?? "");
    if (rangeError) {
      toast.error(rangeError);
      return;
    }
    onCrmSave({
      planPeriodStart: start,
      planPeriodEnd: end,
      comment: comment.trim() || null,
    });
    setCrmDirty(false);
  }

  return (
    <Card className="shadow-elegant">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{tenant.name}</span>
              <Badge variant={statusBadgeVariant(tenant.status)}>
                {TENANT_STATUS_LABELS[tenant.status] ?? tenant.status}
              </Badge>
              {periodSummary.status !== "unset" && (
                <Badge variant={periodSummary.badgeVariant} className="gap-1">
                  <CalendarRange className="h-3 w-3" />
                  {periodSummary.message}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              /{tenant.slug} · Plano {TENANT_PLAN_LABELS[tenant.plan] ?? tenant.plan} ·{" "}
              {tenant.member_count} usuários · {tenant.supporter_count} apoiadores
            </div>
            <div className="text-xs text-muted-foreground">
              Criado em {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
              {periodRangeLabel ? ` · Vigência ${periodRangeLabel}` : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={tenant.status}
              onValueChange={(v) =>
                onStatusPlanChange({ status: v as Enums<"tenant_status"> })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TENANT_STATUS_LABELS) as Enums<"tenant_status">[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {TENANT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={tenant.plan}
              onValueChange={(v) => onStatusPlanChange({ plan: v as Enums<"tenant_plan"> })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TENANT_PLAN_LABELS) as Enums<"tenant_plan">[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {TENANT_PLAN_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" asChild>
              <a
                href={
                  tenant.landing_public_code
                    ? landingPublicPath(tenant.landing_public_code)
                    : "#"
                }
                target="_blank"
                rel="noreferrer"
                aria-disabled={!tenant.landing_public_code}
                className={!tenant.landing_public_code ? "pointer-events-none opacity-50" : undefined}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Landing
              </a>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Período do plano e comentário (só plataforma)
          </p>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,11rem)_minmax(0,11rem)_1fr_auto] lg:items-end">
            <div className="grid gap-1.5">
              <Label htmlFor={`plan-start-${tenant.id}`} className="text-xs">
                Início do plano
              </Label>
              <Input
                id={`plan-start-${tenant.id}`}
                type="date"
                value={planStart}
                onChange={(e) => {
                  setPlanStart(e.target.value);
                  setCrmDirty(true);
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`plan-end-${tenant.id}`} className="text-xs">
                Fim do plano
              </Label>
              <Input
                id={`plan-end-${tenant.id}`}
                type="date"
                min={planStart || undefined}
                value={planEnd}
                onChange={(e) => {
                  setPlanEnd(e.target.value);
                  setCrmDirty(true);
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`comment-${tenant.id}`} className="text-xs">
                Comentário
              </Label>
              <Textarea
                id={`comment-${tenant.id}`}
                rows={2}
                placeholder="Ex.: renovação, boleto enviado, upgrade para Pro…"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setCrmDirty(true);
                }}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant={crmDirty ? "default" : "outline"}
              disabled={!crmDirty || isSaving}
              onClick={handleSaveCrm}
              className="lg:mb-0.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
          {(planStart || planEnd) && (
            <p className="mt-2 text-[11px] text-muted-foreground">{periodSummary.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
