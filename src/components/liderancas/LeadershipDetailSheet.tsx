import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadershipChapasTab } from "@/components/liderancas/LeadershipChapasTab";
import { LeadershipNetworkTab } from "@/components/liderancas/LeadershipNetworkTab";
import { LeadershipResumoTab } from "@/components/liderancas/LeadershipResumoTab";
import { LeadershipTerritorioTab } from "@/components/liderancas/LeadershipTerritorioTab";
import type { LeadershipListItem } from "@/components/liderancas/leadership-list-types";

export function LeadershipDetailSheet({
  leadership,
  tenantId,
  open,
  onOpenChange,
  canUpdate,
  onSaveLeadership,
  savePending,
}: {
  leadership: LeadershipListItem | null;
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate: boolean;
  onSaveLeadership: (payload: {
    name: string;
    region: string | null;
    estimated_votes: number;
  }) => void;
  savePending?: boolean;
}) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [votes, setVotes] = useState("0");
  const [tab, setTab] = useState("resumo");

  const leadershipId = leadership?.leadership_id ?? null;

  useEffect(() => {
    if (!leadership) return;
    setName(leadership.name);
    setRegion(leadership.leadership_region ?? "");
    setVotes(String(leadership.estimated_votes ?? 0));
  }, [
    leadership?.leadership_id,
    leadership?.name,
    leadership?.leadership_region,
    leadership?.estimated_votes,
  ]);

  useEffect(() => {
    if (!open) setTab("resumo");
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{leadership?.name ?? "Liderança"}</SheetTitle>
          <SheetDescription>
            Centro operacional: rede política, chapas e território. Score = heurística interna (não
            projeção eleitoral).
          </SheetDescription>
        </SheetHeader>

        {leadership && leadershipId && (
          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid h-auto w-full grid-cols-4 gap-0.5 p-1">
              <TabsTrigger value="resumo" className="text-xs sm:text-sm">
                Resumo
              </TabsTrigger>
              <TabsTrigger value="rede" className="text-xs sm:text-sm">
                Rede
              </TabsTrigger>
              <TabsTrigger value="chapas" className="text-xs sm:text-sm">
                Chapas
              </TabsTrigger>
              <TabsTrigger value="territorio" className="text-xs sm:text-sm">
                Território
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="mt-4">
              <LeadershipResumoTab
                leadership={leadership}
                canUpdate={canUpdate}
                savePending={savePending}
                name={name}
                region={region}
                votes={votes}
                onNameChange={setName}
                onRegionChange={setRegion}
                onVotesChange={setVotes}
                onSave={() =>
                  onSaveLeadership({
                    name: name.trim(),
                    region: region.trim() || null,
                    estimated_votes: Number(votes) || 0,
                  })
                }
              />
            </TabsContent>

            <TabsContent value="rede" className="mt-4">
              <LeadershipNetworkTab
                tenantId={tenantId}
                leadershipId={leadershipId}
                leadershipName={leadership.name}
              />
            </TabsContent>

            <TabsContent value="chapas" className="mt-4">
              <LeadershipChapasTab
                tenantId={tenantId}
                leadershipId={leadershipId}
                canUpdate={canUpdate}
              />
            </TabsContent>

            <TabsContent value="territorio" className="mt-4">
              <LeadershipTerritorioTab
                tenantId={tenantId}
                leadershipId={leadershipId}
                leadership={leadership}
              />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
