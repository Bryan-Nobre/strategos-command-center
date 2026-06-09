import { CheckCircle2, Circle, ExternalLink, Image, Link2, ListChecks, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  done?: boolean;
  href?: string;
  search?: Record<string, unknown>;
  external?: boolean;
};

export function CampaignSetupChecklist({
  variant = "dashboard",
  publicCode,
  hasPhoto,
  hasHeadline,
  hasProposals,
  supporterCount = 0,
}: {
  variant?: "dashboard" | "blocked";
  publicCode?: string;
  hasPhoto?: boolean;
  hasHeadline?: boolean;
  hasProposals?: boolean;
  supporterCount?: number;
}) {
  const items: ChecklistItem[] =
    variant === "blocked"
      ? [
          {
            id: "materials",
            label: "Separe foto, slogan e propostas",
            description: "Tenha em mãos o material visual e as mensagens principais da campanha.",
          },
          {
            id: "team",
            label: "Alinhe a equipe de coordenação",
            description: "Defina quem será owner e quem receberá convites após a ativação.",
          },
          {
            id: "link",
            label: "Prepare a divulgação da landing",
            description: publicCode
              ? `Após ativar, compartilhe ${publicCode} nos grupos e redes.`
              : "Após ativar, copie o link público em Configurações → Landing.",
          },
        ]
      : [
          {
            id: "photo",
            label: "Foto e identidade na landing",
            description: "Adicione foto, cores e slogan para transmitir confiança.",
            done: hasPhoto && hasHeadline,
            href: "/configuracoes",
            search: { tab: "landing" },
          },
          {
            id: "proposals",
            label: "Propostas da campanha",
            description: "Liste 3–6 propostas objetivas na landing pública.",
            done: hasProposals,
            href: "/configuracoes",
            search: { tab: "landing" },
          },
          {
            id: "share",
            label: "Divulgar link da landing",
            description: publicCode
              ? `Compartilhe /landpage/${publicCode} para captar apoiadores.`
              : "Copie o link em Configurações → Landing.",
            done: supporterCount > 0,
            href: publicCode ? `/landpage/${publicCode}` : "/configuracoes",
            search: publicCode ? undefined : { tab: "landing" },
            external: !!publicCode,
          },
          {
            id: "supporters",
            label: "Primeiros apoiadores",
            description: "Importe CSV ou cadastre manualmente na aba Eleitores.",
            done: supporterCount >= 5,
            href: "/eleitores",
          },
        ];

  const icons = {
    photo: Image,
    proposals: ListChecks,
    share: Link2,
    supporters: Users,
    materials: Image,
    team: Users,
    link: ExternalLink,
  };

  return (
    <Card className="border-primary/15 bg-primary/[0.03] shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {variant === "blocked" ? "Enquanto aguarda a ativação" : "Primeiros passos da campanha"}
        </CardTitle>
        <CardDescription>
          {variant === "blocked"
            ? "Use este tempo para organizar o material. O acesso ao CRM será liberado após a confirmação."
            : "Complete os itens abaixo para colocar a campanha no ar com mais impacto."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => {
            const Icon = icons[item.id as keyof typeof icons] ?? Circle;
            const content = (
              <>
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    item.done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">{item.description}</span>
                </span>
              </>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 rounded-lg border border-border/60 bg-background/80 p-3 transition-colors hover:bg-muted/30"
                    >
                      {content}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      search={item.search as never}
                      className="flex gap-3 rounded-lg border border-border/60 bg-background/80 p-3 transition-colors hover:bg-muted/30"
                    >
                      {content}
                    </Link>
                  )
                ) : (
                  <div className="flex gap-3 rounded-lg border border-border/60 bg-background/80 p-3">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
