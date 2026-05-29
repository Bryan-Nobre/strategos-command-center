import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Heart } from "lucide-react";
import {
  getPublicLanding,
  registerFromLanding,
  type PublicLandingChapa,
} from "@/services/landing";
import { landingCaptureSchema } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/common/LoadingState";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingChapasSection } from "@/components/landing/LandingChapasSection";
import { LandingDemandSection } from "@/components/landing/LandingDemandSection";
import {
  getGeoForEnrichment,
  LandingCepLookup,
  type LandingCepLookupState,
} from "@/components/landing/LandingCepLookup";
import { normalizeCep } from "@/lib/postal-code";
import { applySupporterGeoFromCep } from "@/services/postal-code";
import { toast } from "sonner";

type CaptureForm = z.infer<typeof landingCaptureSchema>;

export const Route = createFileRoute("/p/$slug")({
  component: PublicLandingPage,
});

function PublicLandingPage() {
  const { slug } = Route.useParams();
  const supportRef = useRef<HTMLElement>(null);
  const [selectedChapas, setSelectedChapas] = useState<string[]>([]);
  const [cepInput, setCepInput] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [cepLookup, setCepLookup] = useState<LandingCepLookupState>({ status: "idle" });
  const [territoryConfirmed, setTerritoryConfirmed] = useState(false);

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<CaptureForm>({
    resolver: zodResolver(landingCaptureSchema),
  });

  const neighborhood = watch("neighborhood") ?? "";
  const city = watch("city") ?? "";

  const territoryLabel = useMemo(() => {
    const parts = [neighborhood, city, stateUf].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }, [neighborhood, city, stateUf]);

  const handleCepLookupChange = useCallback((state: LandingCepLookupState) => {
    setCepLookup(state);
    if (state.status !== "found") {
      setTerritoryConfirmed(false);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: (values: CaptureForm) =>
      registerFromLanding(slug, {
        ...values,
        cep: normalizeCep(cepInput) ?? undefined,
        chapaIds: selectedChapas,
      }),
    onSuccess: (supporterId) => {
      toast.success("Obrigado! Você faz parte desta campanha. Em breve nossa equipe entra em contato.");
      const geo = getGeoForEnrichment(cepLookup);
      if (geo && supporterId) {
        void applySupporterGeoFromCep(supporterId, geo).catch(() => {
          /* Enrichment assíncrono: falha não afeta conversão. */
        });
      }
      reset();
      setCepInput("");
      setStateUf("");
      setCepLookup({ status: "idle" });
      setTerritoryConfirmed(false);
      setSelectedChapas([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleChapa(id: string) {
    setSelectedChapas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function scrollToSupport() {
    supportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (isLoading) return <LoadingState />;
  if (error || !landing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Página não encontrada.</p>
      </div>
    );
  }

  const proposals = Array.isArray(landing.proposals)
    ? (landing.proposals as { title?: string; text?: string }[])
    : [];

  const hideLocationFields = territoryConfirmed && cepLookup.status === "found";

  return (
    <div className="landing-page min-h-screen bg-background">
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:py-12">
        <LandingHero landing={landing} onPrimaryAction={scrollToSupport} />

        {proposals.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Propostas
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {proposals.map((p, i) => (
                <Card key={i} className="border-border/60 shadow-none">
                  <CardHeader className="pb-1 pt-3">
                    <CardTitle className="text-sm">{p.title ?? `Proposta ${i + 1}`}</CardTitle>
                  </CardHeader>
                  {p.text && (
                    <CardContent className="pb-3 pt-0 text-xs leading-relaxed text-muted-foreground">
                      {p.text}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        <section
          ref={supportRef}
          id="apoio"
          className="scroll-mt-6 rounded-2xl border-2 border-primary/25 bg-card shadow-elegant"
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                Quero apoiar
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Leva menos de um minuto. Seu nome e contato bastam — o restante é opcional.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome *</Label>
                  <Input {...register("name")} required autoComplete="name" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input {...register("phone")} inputMode="tel" autoComplete="tel" />
                </div>
                <LandingCepLookup
                  cepValue={cepInput}
                  onCepChange={setCepInput}
                  onLookupStateChange={handleCepLookupChange}
                  neighborhood={neighborhood}
                  city={city}
                  onNeighborhoodChange={(v) => setValue("neighborhood", v)}
                  onCityChange={(v) => setValue("city", v)}
                  stateUf={stateUf}
                  onStateUfChange={setStateUf}
                  hideLocationFields={hideLocationFields}
                  onTerritoryConfirmed={setTerritoryConfirmed}
                />
                {!hideLocationFields && (
                  <>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input {...register("city")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bairro</Label>
                      <Input {...register("neighborhood")} />
                    </div>
                  </>
                )}
                <div className="space-y-2 sm:col-span-2">
                  <Label>O que mais te motiva? (opcional)</Label>
                  <Input {...register("interest")} placeholder="Ex.: Saúde, emprego, segurança..." />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Quer deixar uma mensagem? (opcional)</Label>
                  <Textarea {...register("notes")} rows={2} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={isSubmitting} size="lg" className="h-11 w-full sm:w-auto">
                    {isSubmitting ? "Enviando..." : "Confirmar meu apoio"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <LandingChapasSection
          groups={chapasByLeadership}
          selectedChapas={selectedChapas}
          onToggle={toggleChapa}
        />

        <LandingDemandSection
          slug={slug}
          territoryLabel={territoryLabel}
          defaultNeighborhood={neighborhood}
          defaultCity={city}
        />

        <p className="pb-4 text-center text-[10px] text-muted-foreground/80">
          Dados tratados com responsabilidade.{" "}
          <Link to="/login" className="underline-offset-2 hover:underline">
            Strategos
          </Link>
        </p>
      </main>
    </div>
  );
}
