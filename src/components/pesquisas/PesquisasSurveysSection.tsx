import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Globe, PieChart, Save, MapPin, Plus, Trash2 } from "lucide-react";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { narrativeApproval, narrativeIntention } from "@/lib/chart-narratives";
import { filterApprovalByNeighborhood } from "@/lib/territory-filter";
import type { Json } from "@/types/supabase";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Enums } from "@/types/supabase";

const DashboardCharts = lazy(() =>
  import("@/components/dashboard/DashboardCharts").then((m) => ({ default: m.DashboardCharts })),
);

type IntencaoRow = { candidato: string; valor: number };
type AprovacaoRow = { bairro: string; aprovacao: number };

type UpsertMutation = UseMutationResult<
  string,
  Error,
  {
    snapshotType: Enums<"poll_snapshot_type">;
    data: Json;
    title?: string;
  },
  unknown
>;

export function PesquisasSurveysSection({
  intencaoSaved,
  aprovacaoSaved,
  intencaoUpdatedAt,
  aprovacaoUpdatedAt,
  neighborhoodFilter,
  upsertMutation,
  pollsLocked,
  isLoading,
  index = 4,
}: {
  intencaoSaved: IntencaoRow[];
  aprovacaoSaved: AprovacaoRow[];
  intencaoUpdatedAt?: string;
  aprovacaoUpdatedAt?: string;
  neighborhoodFilter?: string | null;
  upsertMutation: UpsertMutation;
  pollsLocked: boolean;
  isLoading?: boolean;
  index?: number;
}) {
  const [intencao, setIntencao] = useState<IntencaoRow[]>([{ candidato: "Você", valor: 0 }]);
  const [aprovacao, setAprovacao] = useState<AprovacaoRow[]>([{ bairro: "Centro", aprovacao: 0 }]);

  useEffect(() => {
    if (isLoading) return;
    setIntencao(intencaoSaved.length ? intencaoSaved : [{ candidato: "Você", valor: 0 }]);
    setAprovacao(aprovacaoSaved.length ? aprovacaoSaved : [{ bairro: "Centro", aprovacao: 0 }]);
  }, [isLoading, intencaoSaved, aprovacaoSaved]);

  const filteredAprovacaoChart = useMemo(
    () => filterApprovalByNeighborhood(aprovacao, neighborhoodFilter),
    [aprovacao, neighborhoodFilter],
  );

  const narrativeInt = narrativeIntention(intencao);
  const narrativeApr = narrativeApproval(filteredAprovacaoChart);

  return (
    <ReportsSection
      variant="electoral"
      index={index}
      title="Leitura eleitoral"
      description="Intenção de voto e aprovação por região. Em breve, preenchimento automático via landing no Distrito Federal."
      icon={PieChart}
      unstyledBody
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SurveyCard
          title="Intenção de voto"
          subtitle="Estimulada · candidatos"
          source="manual"
          landingHint="Captura na landing (DF)"
          updatedAt={intencaoUpdatedAt}
          narrative={narrativeInt}
          chart={
            isLoading ? (
              <Skeleton className="h-44 w-full rounded-lg" />
            ) : intencao.some((r) => r.valor > 0) ? (
              <Suspense fallback={<Skeleton className="h-44 w-full rounded-lg" />}>
                <div className="h-44">
                  <DashboardCharts type="intencao" data={intencao} />
                </div>
              </Suspense>
            ) : (
              <EmptyChart message="Informe percentuais para visualizar a distribuição." />
            )
          }
          editor={
            <IntencaoEditor rows={intencao} onChange={setIntencao} disabled={pollsLocked} />
          }
          saveLabel="Salvar intenção"
          onSave={() =>
            upsertMutation.mutate({
              snapshotType: "intencao_voto",
              data: intencao as Json,
              title: "Intenção de voto",
            })
          }
          savePending={upsertMutation.isPending}
          saveDisabled={pollsLocked}
        />

        <SurveyCard
          title="Aprovação por bairro"
          subtitle={
            neighborhoodFilter
              ? `Filtrado pelo CEP · ${neighborhoodFilter}`
              : "Índice regional · DF"
          }
          source="manual"
          landingHint="Bairro informado na landing"
          updatedAt={aprovacaoUpdatedAt}
          narrative={narrativeApr}
          chart={
            isLoading ? (
              <Skeleton className="h-44 w-full rounded-lg" />
            ) : filteredAprovacaoChart.some((r) => r.aprovacao > 0) ? (
              <Suspense fallback={<Skeleton className="h-44 w-full rounded-lg" />}>
                <div className="h-44">
                  <DashboardCharts type="aprovacao" data={filteredAprovacaoChart} />
                </div>
              </Suspense>
            ) : (
              <EmptyChart
                message={
                  neighborhoodFilter
                    ? `Nenhum índice cadastrado para "${neighborhoodFilter}".`
                    : "Informe índices por bairro para o gráfico de barras."
                }
              />
            )
          }
          editor={<AprovacaoEditor rows={aprovacao} onChange={setAprovacao} disabled={pollsLocked} />}
          saveLabel="Salvar aprovação"
          onSave={() =>
            upsertMutation.mutate({
              snapshotType: "aprovacao_bairro",
              data: aprovacao as Json,
              title: "Aprovação por bairro",
            })
          }
          savePending={upsertMutation.isPending}
          saveDisabled={pollsLocked}
        />
      </div>
    </ReportsSection>
  );
}

function SurveyCard({
  title,
  subtitle,
  source,
  landingHint,
  updatedAt,
  narrative,
  chart,
  editor,
  saveLabel,
  onSave,
  savePending,
  saveDisabled,
}: {
  title: string;
  subtitle: string;
  source: "manual" | "crm";
  landingHint?: string;
  updatedAt?: string;
  narrative: string | null;
  chart: ReactNode;
  editor: ReactNode;
  saveLabel: string;
  onSave: () => void;
  savePending: boolean;
  saveDisabled: boolean;
}) {
  return (
    <article className="pesquisas-survey-card">
      <header className="pesquisas-survey-card-head">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {source === "manual" ? (
            <span className="pesquisas-source-badge pesquisas-source-badge--survey">Cadastro manual</span>
          ) : (
            <span className="pesquisas-source-badge pesquisas-source-badge--crm">CRM</span>
          )}
          {landingHint && (
            <span className="pesquisas-source-badge pesquisas-source-badge--landing">
              <Globe className="h-3 w-3" aria-hidden />
              {landingHint}
            </span>
          )}
        </div>
      </header>

      {updatedAt && (
        <p className="text-[10px] text-muted-foreground">
          Última atualização: {new Date(updatedAt).toLocaleString("pt-BR")}
        </p>
      )}

      {narrative && (
        <p className="text-xs font-medium leading-relaxed text-primary/90">{narrative}</p>
      )}

      <div className="pesquisas-survey-chart">{chart}</div>

      <div className="pesquisas-survey-editor">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-3 w-3" />
          Dados
        </p>
        {editor}
      </div>

      <Button
        size="sm"
        className="mt-3 w-full sm:w-auto"
        disabled={savePending || saveDisabled}
        onClick={onSave}
      >
        <Save className="mr-2 h-4 w-4" />
        {savePending ? "Salvando…" : saveLabel}
      </Button>
    </article>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-border/70 px-4 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function IntencaoEditor({
  rows,
  onChange,
  disabled,
}: {
  rows: IntencaoRow[];
  onChange: (rows: IntencaoRow[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="pesquisas-editor-row">
          <Input
            placeholder="Candidato"
            value={row.candidato}
            disabled={disabled}
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
            className="w-20 shrink-0"
            placeholder="%"
            disabled={disabled}
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
            className="shrink-0"
            disabled={disabled || rows.length <= 1}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...rows, { candidato: "", valor: 0 }])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Candidato
      </Button>
    </div>
  );
}

function AprovacaoEditor({
  rows,
  onChange,
  disabled,
}: {
  rows: AprovacaoRow[];
  onChange: (rows: AprovacaoRow[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="pesquisas-editor-row">
          <Input
            placeholder="Bairro / região"
            value={row.bairro}
            disabled={disabled}
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
            className="w-20 shrink-0"
            placeholder="%"
            disabled={disabled}
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
            className="shrink-0"
            disabled={disabled || rows.length <= 1}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...rows, { bairro: "", aprovacao: 0 }])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Bairro
      </Button>
    </div>
  );
}
