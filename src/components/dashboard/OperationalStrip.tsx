import { AlertTriangle, TrendingUp, Zap } from "lucide-react";
import type { StripItem } from "@/services/dashboard-intelligence";

const iconFor = {
  warning: AlertTriangle,
  success: TrendingUp,
  neutral: Zap,
} as const;

export function OperationalStrip({ items }: { items: StripItem[] }) {
  if (!items.length) return null;

  return (
    <div className="operational-strip flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm">
      {items.map((item) => {
        const Icon = iconFor[item.tone];
        return (
          <span
            key={item.id}
            className="inline-flex items-center gap-2 font-medium text-foreground/90"
          >
            <Icon className="h-4 w-4 shrink-0 text-[#d97706] dark:text-warning" />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}
