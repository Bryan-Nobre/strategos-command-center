import { Check, Sparkles } from "lucide-react";
import type { PlanDefinitionRow } from "@/lib/plan-display";
import {
  buildPlanFeatureList,
  formatPlanPriceDisplay,
  planCardClassName,
  planDisplayName,
} from "@/lib/plan-display";
import type { TenantPlan } from "@/types/tenant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  plans: PlanDefinitionRow[];
  currentPlan: TenantPlan;
};

export function PlanPricingGrid({ plans, currentPlan }: Props) {
  return (
    <section className="admin-plans-showcase rounded-2xl border border-zinc-800 bg-[#050505] p-6 md:p-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Planos disponíveis
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">Compare o que cada plano oferece</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Valores e limites configurados pela plataforma. Para mudar de plano, fale com o suporte
          comercial — upgrade self-service em breve.
        </p>
      </div>

      <div
        className={cn(
          "grid gap-4 md:grid-cols-2",
          plans.length >= 3 ? "xl:grid-cols-3" : "xl:grid-cols-2",
        )}
      >
        {plans.map((row) => {
          const isCurrent = row.plan === currentPlan;
          const features = buildPlanFeatureList(row);
          const price = formatPlanPriceDisplay(row.priceLabel);

          return (
            <article
              key={row.plan}
              className={cn(planCardClassName(row, isCurrent), "flex flex-col")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {planDisplayName(row.plan as TenantPlan)}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {row.tagline || "Plano comercial"}
                  </p>
                </div>
                {row.isHighlighted && !isCurrent && (
                  <Badge className="admin-plan-card__badge shrink-0 gap-1 border-0 bg-white/15 text-white">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="admin-plan-card__badge shrink-0 border-0 bg-emerald-500/20 text-emerald-300">
                    Seu plano
                  </Badge>
                )}
              </div>

              {price.main && (
                <div className="mt-5">
                  <p className="text-3xl font-bold tracking-tight text-white">{price.main}</p>
                  {price.suffix && <p className="text-xs text-zinc-500">{price.suffix}</p>}
                </div>
              )}

              <ul className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  disabled={isCurrent}
                  variant={isCurrent ? "secondary" : "default"}
                  className={cn(
                    "w-full",
                    isCurrent
                      ? "cursor-default border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-900"
                      : "bg-white text-black hover:bg-white/90",
                  )}
                >
                  {isCurrent ? "Plano atual" : "Solicitar upgrade"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
