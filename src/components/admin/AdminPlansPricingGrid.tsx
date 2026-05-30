import { Check, Sparkles, Star } from "lucide-react";
import type { AdminPlanLimitRow } from "@/services/admin-plans";
import { buildPlanFeatureList, planCardClassName, planDisplayName } from "@/lib/plan-display";
import type { TenantPlan } from "@/types/tenant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  plans: AdminPlanLimitRow[];
  selectedPlan: TenantPlan;
  savingPlan: TenantPlan | null;
  onSelectPlan: (plan: TenantPlan) => void;
  onToggleHighlight: (plan: TenantPlan, highlighted: boolean) => void;
};

export function AdminPlansPricingGrid({
  plans,
  selectedPlan,
  savingPlan,
  onSelectPlan,
  onToggleHighlight,
}: Props) {
  return (
    <section className="admin-plans-showcase rounded-2xl border border-zinc-800 bg-[#050505] p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Vitrine comercial
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">Como os planos aparecem</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Prévia do layout que o cliente verá ao escolher plano. Marque quais ficam em destaque e
            clique em um card para editar limites e textos.
          </p>
        </div>
        <Badge variant="outline" className="border-zinc-700 text-zinc-300">
          {plans.filter((p) => p.isHighlighted).length} em destaque
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((row) => {
          const selected = row.plan === selectedPlan;
          const saving = savingPlan === row.plan;
          const features = buildPlanFeatureList(row);

          return (
            <article
              key={row.plan}
              className={cn(planCardClassName(row, selected), "flex flex-col")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {planDisplayName(row.plan as TenantPlan)}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {row.tagline || "Sem subtítulo configurado"}
                  </p>
                </div>
                {row.isHighlighted && (
                  <Badge className="admin-plan-card__badge shrink-0 gap-1 border-0 bg-white/15 text-white">
                    <Sparkles className="h-3 w-3" />
                    Destaque
                  </Badge>
                )}
              </div>

              <div className="mt-5">
                <p className="text-3xl font-bold tracking-tight text-white">
                  {row.priceLabel || "—"}
                </p>
                <p className="text-xs text-zinc-500">/ mês · faturamento comercial</p>
              </div>

              <ul className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor={`highlight-${row.plan}`}
                    className="flex items-center gap-1.5 text-xs text-zinc-300"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Plano em destaque
                  </Label>
                  <Switch
                    id={`highlight-${row.plan}`}
                    checked={row.isHighlighted}
                    disabled={saving}
                    onCheckedChange={(checked) => onToggleHighlight(row.plan as TenantPlan, checked)}
                  />
                </div>
                <Button
                  type="button"
                  variant={selected ? "default" : "secondary"}
                  className={cn(
                    "w-full",
                    selected
                      ? "bg-white text-black hover:bg-white/90"
                      : "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800",
                  )}
                  onClick={() => onSelectPlan(row.plan as TenantPlan)}
                >
                  {selected ? "Editando limites" : "Editar plano"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
