import { createFileRoute } from "@tanstack/react-router";
import { Crown, Plus, TrendingUp, Users, Vote } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { liderancasMock } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/liderancas")({
  component: LiderancasPage,
});

function LiderancasPage() {
  const ranked = [...liderancasMock].sort((a, b) => b.votos - a.votos);
  const max = Math.max(...ranked.map((l) => l.votos));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lideranças"
        description="Acompanhe o desempenho dos seus principais articuladores políticos."
        actions={<Button size="sm"><Plus className="mr-2 h-4 w-4" />Nova liderança</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Lideranças ativas" value="142" delta={5.2} icon={Crown} tone="primary" />
        <MetricCard label="Apoiadores vinculados" value="3.214" delta={11.8} icon={Users} tone="accent" />
        <MetricCard label="Votos estimados" value="24.680" delta={9.3} icon={Vote} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {ranked.map((l, i) => (
          <Card key={l.id} className="shadow-elegant transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{l.nome}</CardTitle>
                <CardDescription>{l.regiao}</CardDescription>
              </div>
              <Badge variant={l.crescimento >= 0 ? "default" : "destructive"} className="font-mono">
                <TrendingUp className="mr-1 h-3 w-3" />{l.crescimento >= 0 ? "+" : ""}{l.crescimento}%
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Votos estimados</div>
                  <div className="mt-1 text-2xl font-semibold">{l.votos.toLocaleString("pt-BR")}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Apoiadores</div>
                  <div className="mt-1 text-2xl font-semibold">{l.apoiadores}</div>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Performance relativa</span><span>{Math.round((l.votos / max) * 100)}%</span>
                </div>
                <Progress value={(l.votos / max) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
