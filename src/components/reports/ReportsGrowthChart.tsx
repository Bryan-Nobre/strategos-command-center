import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type GrowthSeriesPoint = {
  label: string;
  apoiadores: number;
  date?: string;
};

function formatTooltipDate(point: GrowthSeriesPoint): string {
  if (point.date && /^\d{4}-\d{2}-\d{2}$/.test(point.date)) {
    return format(parseISO(point.date), "EEEE, d 'de' MMMM", { locale: ptBR });
  }
  return point.label;
}

function tickInterval(count: number): number | "preserveStartEnd" {
  if (count <= 14) return 0;
  if (count <= 31) return 1;
  if (count <= 60) return 2;
  return Math.max(1, Math.floor(count / 12));
}

export function ReportsGrowthChart({ data }: { data: GrowthSeriesPoint[] }) {
  const total = useMemo(() => data.reduce((s, d) => s + d.apoiadores, 0), [data]);
  const xInterval = tickInterval(data.length);

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
        Sem cadastros no período para exibir evolução.
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9 }}
            interval={xInterval}
            angle={data.length > 20 ? -35 : 0}
            textAnchor={data.length > 20 ? "end" : "middle"}
            height={data.length > 20 ? 44 : 24}
          />
          <YAxis tick={{ fontSize: 10 }} width={28} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as GrowthSeriesPoint | undefined;
              return row ? formatTooltipDate(row) : "";
            }}
            formatter={(value: number) => [
              `${value} ${value === 1 ? "novo apoiador" : "novos apoiadores"}`,
              "Cadastros",
            ]}
          />
          <Area
            type="monotone"
            dataKey="apoiadores"
            name="Novos apoiadores"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.12}
            dot={data.length <= 31 ? { r: 2, fill: "var(--chart-2)" } : false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {total > 0 && (
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          {total} cadastros no período · um ponto por dia
        </p>
      )}
    </div>
  );
}
