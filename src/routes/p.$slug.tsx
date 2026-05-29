import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClipboardList, MessageCircle, Vote } from "lucide-react";
import {
  getPublicLanding,
  registerDemandFromLanding,
  registerFromLanding,
  type PublicLandingChapa,
} from "@/services/landing";
import { Checkbox } from "@/components/ui/checkbox";
import { landingCaptureSchema, landingDemandSchema, DEMAND_CATEGORY_LABELS } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/common/LoadingState";
import { toast } from "sonner";

type CaptureForm = z.infer<typeof landingCaptureSchema>;
type DemandForm = z.infer<typeof landingDemandSchema>;

export const Route = createFileRoute("/p/$slug")({
  component: PublicLandingPage,
});

function PublicLandingPage() {
  const { slug } = Route.useParams();
  const [selectedChapas, setSelectedChapas] = useState<string[]>([]);

  const { data: landing, isLoading, error } = useQuery({
    queryKey: ["public-landing", slug],
    queryFn: () => getPublicLanding(slug),
  });

  const chapas = landing?.chapas ?? [];

  const chapasByLeadership = useMemo(() => {
    const map = new Map<string, { name: string; region: string | null; items: PublicLandingChapa[] }>();
    for (const c of chapas) {
      const key = c.leadership_id;
      const entry = map.get(key) ?? {
        name: c.leadership_name,
        region: c.leadership_region,
        items: [],
      };
      entry.items.push(c);
      map.set(key, entry);
    }
    return [...map.values()];
  }, [chapas]);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CaptureForm>({
    resolver: zodResolver(landingCaptureSchema),
  });

  const {
    register: registerDemand,
    handleSubmit: handleDemandSubmit,
    reset: resetDemand,
    formState: { isSubmitting: isDemandSubmitting, errors: demandErrors },
  } = useForm<DemandForm>({
    resolver: zodResolver(landingDemandSchema),
    defaultValues: { category: "outros" },
  });

  const mutation = useMutation({
    mutationFn: (values: CaptureForm) =>
      registerFromLanding(slug, { ...values, chapaIds: selectedChapas }),
    onSuccess: () => {
      toast.success("Obrigado pelo apoio! Entraremos em contato.");
      reset();
      setSelectedChapas([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const demandMutation = useMutation({
    mutationFn: (values: DemandForm) =>
      registerDemandFromLanding(slug, {
        title: values.title,
        description: values.description,
        category: values.category,
        neighborhood: values.neighborhood,
        city: values.city,
        requester_name: values.requester_name,
        requester_phone: values.requester_phone,
      }),
    onSuccess: () => {
      toast.success("Sua solicitação foi registrada. A equipe vai analisar.");
      resetDemand();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleChapa(id: string) {
    setSelectedChapas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (isLoading) return <LoadingState />;
  if (error || !landing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Página não encontrada.</p>
      </div>
    );
  }

  const proposals = Array.isArray(landing.proposals) ? landing.proposals as { title?: string; text?: string }[] : [];
  const social = (landing.social_links ?? {}) as Record<string, string>;
  const wa = landing.whatsapp?.replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Vote className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{landing.tenant_name}</h1>
            <p className="text-muted-foreground">{landing.headline}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        {landing.bio && (
          <p className="text-lg leading-relaxed text-foreground/90">{landing.bio}</p>
        )}

        {proposals.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">Propostas</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {proposals.map((p, i) => (
                <Card key={i} className="shadow-elegant">
                  <CardHeader>
                    <CardTitle className="text-base">{p.title ?? `Proposta ${i + 1}`}</CardTitle>
                  </CardHeader>
                  {p.text && <CardContent className="pt-0 text-sm text-muted-foreground">{p.text}</CardContent>}
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          {wa && (
            <Button asChild>
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          )}
          {Object.entries(social).map(([k, v]) => v && (
            <Button key={k} variant="outline" asChild>
              <a href={v} target="_blank" rel="noopener noreferrer">{k}</a>
            </Button>
          ))}
        </div>

        {chapasByLeadership.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Escolha sua chapa</h2>
              <p className="text-sm text-muted-foreground">
                Selecione os candidatos ou chapas que você apoia. Cada escolha soma na meta da respectiva
                liderança.
              </p>
            </div>
            <div className="space-y-4">
              {chapasByLeadership.map((group) => (
                <Card key={group.name} className="shadow-elegant">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    {group.region && (
                      <p className="text-xs text-muted-foreground">{group.region}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.items.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 p-3 transition-theme hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={selectedChapas.includes(c.id)}
                          onCheckedChange={() => toggleChapa(c.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{c.name}</p>
                          {c.subtitle && (
                            <p className="text-xs text-muted-foreground">{c.subtitle}</p>
                          )}
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Contribui com {c.vote_weight} voto(s) na meta da liderança
                          </p>
                        </div>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <Card className="shadow-elegant border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Registrar solicitação ou melhoria
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Conte o que precisa no bairro — iluminação, saúde, segurança, obras ou outras demandas.
              Sua mensagem chega direto à equipe do mandato.
            </p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleDemandSubmit((v) => demandMutation.mutate(v))}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2 sm:col-span-2">
                <Label>Seu nome *</Label>
                <Input {...registerDemand("requester_name")} />
                {demandErrors.requester_name && (
                  <p className="text-xs text-destructive">{demandErrors.requester_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...registerDemand("requester_phone")} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input {...registerDemand("city")} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input {...registerDemand("neighborhood")} />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <select
                  {...registerDemand("category")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(DEMAND_CATEGORY_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Assunto *</Label>
                <Input {...registerDemand("title")} placeholder="Ex.: Poste apagado na Rua X" />
                {demandErrors.title && (
                  <p className="text-xs text-destructive">{demandErrors.title.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descrição *</Label>
                <Textarea
                  {...registerDemand("description")}
                  rows={4}
                  placeholder="Descreva o problema ou a melhoria que você sugere..."
                />
                {demandErrors.description && (
                  <p className="text-xs text-destructive">{demandErrors.description.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isDemandSubmitting} className="w-full sm:w-auto">
                  {isDemandSubmitting ? "Enviando..." : "Enviar solicitação"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Quero apoiar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome *</Label>
                <Input {...register("name")} required />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input {...register("neighborhood")} />
              </div>
              <div className="space-y-2">
                <Label>Interesse</Label>
                <Input {...register("interest")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Observações</Label>
                <Textarea {...register("notes")} rows={3} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "Enviando..." : "Enviar apoio"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Powered by <Link to="/login" className="text-primary hover:underline">Strategos CRM</Link>
        </p>
      </main>
    </div>
  );
}
