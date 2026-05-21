import { createFileRoute } from "@tanstack/react-router";
import { Plus, Crown, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { useLeaderships, useCreateLeadership } from "@/hooks/use-leaderships";
import { LoadingState } from "@/components/common/LoadingState";

export const Route = createFileRoute("/_app/liderancas")({
  component: LiderancasPage,
});

function LiderancasPage() {
  const { tenantId } = useTenant();
  const { data: list, isLoading } = useLeaderships(tenantId);
  const createMutation = useCreateLeadership(tenantId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lideranças"
        description="Ranking de influência e capilaridade regional."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Nova liderança</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar liderança</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Região</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => { createMutation.mutate({ name, region: region || null, estimated_votes: 0 }); setOpen(false); }}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(list ?? []).map((l, i) => (
          <Card key={l.id} className="shadow-elegant">
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">#{i + 1}</span>
                  <div>
                    <h3 className="font-semibold">{l.name}</h3>
                    <p className="text-xs text-muted-foreground">{l.region}</p>
                  </div>
                </div>
                <Crown className="h-5 w-5 text-chart-3" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Users className="mb-1 h-4 w-4 text-muted-foreground" />{l.apoiadores} apoiadores</div>
                <div><TrendingUp className="mb-1 h-4 w-4 text-muted-foreground" />{l.estimated_votes} votos est.</div>
              </div>
              {l.crescimento !== 0 && <Badge className="mt-3" variant="secondary">{l.crescimento > 0 ? "+" : ""}{l.crescimento}%</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
