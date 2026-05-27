import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/common/ChartCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenant } from "@/hooks/use-tenant";
import { usePollSnapshots, useUpsertPollSnapshot } from "@/hooks/use-dashboard";
import type { Json } from "@/types/supabase";
import { LoadingState } from "@/components/common/LoadingState";

export const Route = createFileRoute("/_app/pesquisas")({
  component: PesquisasPage,
});

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

type IntencaoRow = { candidato: string; valor: number };
type AprovacaoRow = { bairro: string; aprovacao: number };
type CrescimentoRow = { mes: string; apoiadores: number };

function PesquisasPage() {
  const { tenantId } = useTenant();
  const { data: polls, isLoading } = usePollSnapshots(tenantId);
  const upsertMutation = useUpsertPollSnapshot(tenantId);

  const intencaoSaved = (polls?.find((p) => p.snapshot_type === "intencao_voto")?.data ?? []) as IntencaoRow[];
  const aprovacaoSaved = (polls?.find((p) => p.snapshot_type === "aprovacao_bairro")?.data ?? []) as AprovacaoRow[];
  const crescimentoSaved = (polls?.find((p) => p.snapshot_type === "crescimento_apoiadores")?.data ?? []) as CrescimentoRow[];

  const [intencao, setIntencao] = useState<IntencaoRow[]>([{ candidato: "Candidato", valor: 0 }]);
  const [aprovacao, setAprovacao] = useState<AprovacaoRow[]>([{ bairro: "Centro", aprovacao: 0 }]);
  const [crescimento, setCrescimento] = useState<CrescimentoRow[]>([{ mes: "Jan", apoiadores: 0 }]);

  useEffect(() => {
    if (isLoading) return;
    setIntencao(intencaoSaved.length ? intencaoSaved : [{ candidato: "Candidato", valor: 0 }]);
    setAprovacao(aprovacaoSaved.length ? aprovacaoSaved : [{ bairro: "Centro", aprovacao: 0 }]);
    setCrescimento(crescimentoSaved.length ? crescimentoSaved : [{ mes: "Jan", apoiadores: 0 }]);
  }, [isLoading, polls]);

  if (isLoading) return <LoadingState />;

  const hasAnyData = intencaoSaved.length || aprovacaoSaved.length || crescimentoSaved.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pesquisas"
        description="Atualize intenção de voto, aprovação por bairro e crescimento mensal."
      />

      {!hasAnyData && (
        <EmptyState
          title="Nenhuma pesquisa salva ainda"
          description="Preencha os formulários abaixo e clique em Salvar para persistir os dados."
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Intenção de voto" description="Estimulada">
          <div className="h-56 mb-4">
            {intencao.some((r) => r.valor > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={intencao} dataKey="valor" nameKey="candidato" innerRadius={45} outerRadius={75}>
                    {intencao.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Adicione valores para visualizar o gráfico
              </div>
            )}
          </div>
          <EditableIntencaoTable rows={intencao} onChange={setIntencao} />
          <Button
            className="mt-3"
            size="sm"
            disabled={upsertMutation.isPending}
            onClick={() =>
              upsertMutation.mutate({
                snapshotType: "intencao_voto",
                data: intencao as Json,
                title: "Intenção de voto",
              })
            }
          >
            <Save className="mr-2 h-4 w-4" />
            {upsertMutation.isPending ? "Salvando..." : "Salvar intenção"}
          </Button>
        </ChartCard>

        <ChartCard title="Aprovação por bairro" description="Índice regional">
          <div className="h-56 mb-4">
            {aprovacao.some((r) => r.aprovacao > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aprovacao}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bairro" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="aprovacao" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Adicione valores para visualizar o gráfico
              </div>
            )}
          </div>
          <EditableAprovacaoTable rows={aprovacao} onChange={setAprovacao} />
          <Button
            className="mt-3"
            size="sm"
            disabled={upsertMutation.isPending}
            onClick={() =>
              upsertMutation.mutate({
                snapshotType: "aprovacao_bairro",
                data: aprovacao as Json,
                title: "Aprovação por bairro",
              })
            }
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar aprovação
          </Button>
        </ChartCard>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Crescimento mensal de apoiadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 mb-4">
            {crescimento.some((r) => r.apoiadores > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={crescimento}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="apoiadores" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Adicione valores para visualizar o gráfico
              </div>
            )}
          </div>
          <EditableCrescimentoTable rows={crescimento} onChange={setCrescimento} />
          <Button
            className="mt-3"
            size="sm"
            disabled={upsertMutation.isPending}
            onClick={() =>
              upsertMutation.mutate({
                snapshotType: "crescimento_apoiadores",
                data: crescimento as Json,
                title: "Crescimento mensal",
              })
            }
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar crescimento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function EditableIntencaoTable({
  rows,
  onChange,
}: {
  rows: IntencaoRow[];
  onChange: (rows: IntencaoRow[]) => void;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="Candidato"
            value={row.candidato}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, candidato: e.target.value };
              onChange(next);
            }}
          />
          <Input
            type="number"
            min={0}
            max={100}
            className="w-24"
            value={row.valor}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, valor: Number(e.target.value) || 0 };
              onChange(next);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            disabled={rows.length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...rows, { candidato: "", valor: 0 }])}>
        <Plus className="mr-2 h-4 w-4" />
        Linha
      </Button>
    </div>
  );
}

function EditableAprovacaoTable({
  rows,
  onChange,
}: {
  rows: AprovacaoRow[];
  onChange: (rows: AprovacaoRow[]) => void;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="Bairro"
            value={row.bairro}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, bairro: e.target.value };
              onChange(next);
            }}
          />
          <Input
            type="number"
            min={0}
            max={100}
            className="w-24"
            value={row.aprovacao}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, aprovacao: Number(e.target.value) || 0 };
              onChange(next);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            disabled={rows.length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...rows, { bairro: "", aprovacao: 0 }])}>
        <Plus className="mr-2 h-4 w-4" />
        Linha
      </Button>
    </div>
  );
}

function EditableCrescimentoTable({
  rows,
  onChange,
}: {
  rows: CrescimentoRow[];
  onChange: (rows: CrescimentoRow[]) => void;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="Mês"
            value={row.mes}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, mes: e.target.value };
              onChange(next);
            }}
          />
          <Input
            type="number"
            min={0}
            className="w-28"
            value={row.apoiadores}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, apoiadores: Number(e.target.value) || 0 };
              onChange(next);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            disabled={rows.length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...rows, { mes: "", apoiadores: 0 }])}>
        <Plus className="mr-2 h-4 w-4" />
        Linha
      </Button>
    </div>
  );
}
