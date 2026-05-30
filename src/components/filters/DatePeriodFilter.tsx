import { CalendarRange } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DATE_PERIOD_PRESET_OPTIONS,
  DATE_PERIOD_WITH_ALL_OPTIONS,
  formatDatePeriodLabel,
  resolveDatePeriodRange,
  type DatePeriodPreset,
  type DatePeriodSearch,
} from "@/lib/date-period";
import { cn } from "@/lib/utils";

type PresetOption = { value: DatePeriodPreset; label: string };

type Props = {
  value: DatePeriodSearch;
  onChange: (next: DatePeriodSearch) => void;
  /** Inclui opção "Todo período" (eleitores, demandas) */
  allowAll?: boolean;
  presets?: readonly PresetOption[];
  className?: string;
  compact?: boolean;
};

export function DatePeriodFilter({
  value,
  onChange,
  allowAll = false,
  presets,
  className,
  compact = false,
}: Props) {
  const options = presets ?? (allowAll ? DATE_PERIOD_WITH_ALL_OPTIONS : DATE_PERIOD_PRESET_OPTIONS);
  const period = value.period ?? (allowAll ? "all" : "30d");
  const isCustom = period === "custom";
  const range = resolveDatePeriodRange(value, {
    defaultPreset: allowAll ? "all" : "30d",
  });

  return (
    <div
      className={cn(
        "date-period-filter",
        compact ? "flex flex-wrap items-end gap-2" : "space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3",
        className,
      )}
    >
      {!compact && (
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <CalendarRange className="h-3.5 w-3.5 text-primary" />
          Período
          <span className="font-normal text-muted-foreground">· {formatDatePeriodLabel(range)}</span>
        </div>
      )}

      <div
        className={cn(
          "grid gap-2",
          compact ? "flex flex-wrap items-end" : "sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        <div className={cn("space-y-1", compact ? "min-w-[140px]" : "")}>
          {!compact && (
            <label className="text-[10px] font-medium text-muted-foreground">Intervalo</label>
          )}
          <Select
            value={period}
            onValueChange={(v) =>
              onChange({
                ...value,
                period: v as DatePeriodPreset,
                ...(v !== "custom" ? { from: undefined, to: undefined } : {}),
              })
            }
          >
            <SelectTrigger className={cn("bg-background/80 text-xs", compact ? "h-8" : "h-9")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isCustom && (
          <>
            <div className={cn("space-y-1", compact ? "min-w-[130px]" : "")}>
              <label className="text-[10px] font-medium text-muted-foreground">De</label>
              <Input
                type="date"
                className={cn("bg-background/80", compact ? "h-8 text-xs" : "h-9")}
                value={value.from ?? ""}
                onChange={(e) => onChange({ ...value, period: "custom", from: e.target.value })}
              />
            </div>
            <div className={cn("space-y-1", compact ? "min-w-[130px]" : "")}>
              <label className="text-[10px] font-medium text-muted-foreground">Até</label>
              <Input
                type="date"
                className={cn("bg-background/80", compact ? "h-8 text-xs" : "h-9")}
                value={value.to ?? ""}
                onChange={(e) => onChange({ ...value, period: "custom", to: e.target.value })}
              />
            </div>
          </>
        )}

        {compact && !isCustom && (
          <span className="pb-2 text-[10px] text-muted-foreground">{formatDatePeriodLabel(range)}</span>
        )}
      </div>
    </div>
  );
}
