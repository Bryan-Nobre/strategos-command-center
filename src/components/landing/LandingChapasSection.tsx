import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicLandingChapa } from "@/services/landing";

type LeadershipGroup = {
  name: string;
  region: string | null;
  items: PublicLandingChapa[];
};

export function LandingChapasSection({
  groups,
  selectedChapas,
  onToggle,
  embedded = false,
}: {
  groups: LeadershipGroup[];
  selectedChapas: string[];
  onToggle: (id: string) => void;
  /** Quando true, renderiza dentro do formulário de apoio (sem details externo). */
  embedded?: boolean;
}) {
  if (!groups.length) return null;

  const body = (
    <>
      <p className="text-xs text-muted-foreground">
        Escolha candidatos ou chapas que representam seu apoio. Marque antes de confirmar — entra junto no cadastro de Eleitores.
      </p>
      {groups.map((group) => (
        <Card key={group.name} className="border-border/60 shadow-none">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">{group.name}</CardTitle>
            {group.region && (
              <p className="text-[10px] text-muted-foreground">Área de atuação: {group.region}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            {group.items.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 p-2.5 transition-theme hover:bg-muted/40"
              >
                <Checkbox
                  checked={selectedChapas.includes(c.id)}
                  onCheckedChange={() => onToggle(c.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.subtitle && (
                    <p className="text-xs text-muted-foreground">{c.subtitle}</p>
                  )}
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );

  if (embedded) {
    return (
      <div className="landing-chapas-embedded space-y-3 rounded-xl border border-border/70 bg-muted/10 p-3">
        <p className="text-sm font-semibold text-foreground">
          Quem você apoia na chapa? <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
        </p>
        {body}
      </div>
    );
  }

  return (
    <details className="landing-chapas group rounded-xl border border-border/70 bg-card/50 open:shadow-elegant">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          Quem você apoia na chapa? <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
          <span className="text-xs text-primary group-open:hidden">Expandir</span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-border/60 px-4 pb-4 pt-3">{body}</div>
    </details>
  );
}
