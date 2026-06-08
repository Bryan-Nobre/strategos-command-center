import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyProposal,
  MAX_LANDING_PROPOSALS,
  type LandingProposalItem,
} from "@/lib/landing-proposals";

type LandingProposalsEditorProps = {
  proposals: LandingProposalItem[];
  canEdit: boolean;
  onChange: (items: LandingProposalItem[]) => void;
};

export function LandingProposalsEditor({
  proposals,
  canEdit,
  onChange,
}: LandingProposalsEditorProps) {
  function patchItem(index: number, patch: Partial<LandingProposalItem>) {
    onChange(proposals.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    onChange(proposals.filter((_, i) => i !== index));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= proposals.length) return;
    const copy = [...proposals];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  }

  return (
    <div className="space-y-3">
      {proposals.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          Nenhuma proposta cadastrada. Adicione cards exibidos na landing, acima do formulário de
          apoio.
        </p>
      ) : (
        <ul className="space-y-3">
          {proposals.map((proposal, index) => (
            <li
              key={index}
              className="rounded-lg border border-border/70 bg-muted/15 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <GripVertical className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                  Proposta {index + 1}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                    >
                      Subir
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      disabled={index === proposals.length - 1}
                      onClick={() => moveItem(index, 1)}
                    >
                      Descer
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`proposal-title-${index}`}>Título</Label>
                <Input
                  id={`proposal-title-${index}`}
                  value={proposal.title}
                  disabled={!canEdit}
                  placeholder="Ex.: Saúde perto de você"
                  maxLength={120}
                  onChange={(e) => patchItem(index, { title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`proposal-text-${index}`}>Descrição</Label>
                <Textarea
                  id={`proposal-text-${index}`}
                  value={proposal.text}
                  disabled={!canEdit}
                  placeholder="Resumo objetivo da proposta para o eleitor."
                  rows={3}
                  maxLength={500}
                  onChange={(e) => patchItem(index, { text: e.target.value })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit && proposals.length < MAX_LANDING_PROPOSALS && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...proposals, createEmptyProposal()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar proposta
        </Button>
      )}

      <p className="text-[11px] text-muted-foreground">
        Até {MAX_LANDING_PROPOSALS} propostas · exibidas na seção «Propostas» da landing pública.
      </p>
    </div>
  );
}
