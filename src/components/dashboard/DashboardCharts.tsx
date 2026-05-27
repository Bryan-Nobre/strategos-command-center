import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type IntencaoRow = { candidato: string; valor: number };
type AprovacaoRow = { bairro: string; aprovacao: number };

export function DashboardCharts({
  type,
  data,
}: {
  type: "intencao" | "aprovacao";
  data: IntencaoRow[] | AprovacaoRow[];
}) {
  if (type === "intencao") {
    const intencao = data as IntencaoRow[];
    return (
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={intencao}
              dataKey="valor"
              nameKey="candidato"
              innerRadius={48}
              outerRadius={72}
              strokeWidth={0}
            >
              {intencao.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                fontSize: "12px",
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const aprovacao = data as AprovacaoRow[];
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={aprovacao} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
          <XAxis dataKey="bairro" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={48} />
          <YAxis fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--border)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="aprovacao" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
