import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ReportsGrowthChart({
  data,
}: {
  data: { label: string; apoiadores: number }[];
}) {
  if (!data.length) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
        Sem cadastros no período para exibir evolução.
      </div>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={32} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="apoiadores"
            name="Novos apoiadores"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.12}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
