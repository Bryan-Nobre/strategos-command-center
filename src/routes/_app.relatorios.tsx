import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, FileSpreadsheet, FileBarChart, Filter } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/common/ChartCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { crescimentoApoiadores } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/relatorios")({
  component: RelatoriosPage,
});

const relatorios = [
  { id: 1, nome: "Relatório de desempenho eleitoral", desc: "Consolidado mensal por região", tipo: "PDF", periodo: "Mai/2026", icon: FileBarChart },
  { id: 2, nome: "Base de eleitores exportada", desc: "Todos os contatos cadastrados", tipo: "CSV", periodo: "Atualizado hoje", icon: FileSpreadsheet },
  { id: 3, nome: "Demandas atendidas", desc: "Por categoria e bairro", tipo: "PDF", periodo: "Abr/2026", icon: FileText },
  { id: 4, nome: "Performance de lideranças", desc: "Ranking e crescimento", tipo: "XLSX", periodo: "Mai/2026", icon: FileSpreadsheet },
  { id: 5, nome: "Pesquisa de aprovação", desc: "Histórico consolidado", tipo: "PDF", periodo: "Jun/2026", icon: FileBarChart },
  { id: 6, nome: "Agenda do mandato", desc: "Compromissos e eventos", tipo: "PDF", periodo: "Mai/2026", icon: FileText },
];

function RelatoriosPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios"
        description="Exporte e analise relatórios consolidados do mandato e da campanha."
        actions={<Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtrar período</Button>}
      />

      <ChartCard title="Desempenho consolidado" description="Visão analítica do crescimento da base">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={crescimentoApoiadores}>
              <defs>
                <linearGradient id="rel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="apoiadores" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#rel)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Relatórios disponíveis</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {relatorios.map((r) => (
            <Card key={r.id} className="shadow-elegant transition-shadow hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium leading-tight">{r.nome}</h3>
                      <Badge variant="outline" className="shrink-0 font-mono text-[10px]">{r.tipo}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{r.periodo}</span>
                      <Button size="sm" variant="outline"><Download className="mr-2 h-3.5 w-3.5" />Baixar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
