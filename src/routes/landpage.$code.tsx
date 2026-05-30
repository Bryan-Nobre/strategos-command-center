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
import { PhoneFormField } from "@/components/common/PhoneFormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/common/LoadingState";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPoliticalDecor } from "@/components/landing/LandingPoliticalDecor";
import { LandingChapasSection } from "@/components/landing/LandingChapasSection";
import { LandingDemandSection } from "@/components/landing/LandingDemandSection";
import {
  getGeoForEnrichment,
  LandingCepLookup,
  type LandingCepLookupState,
} from "@/components/landing/LandingCepLookup";
import { buildLandingSuccessMessage } from "@/lib/landing-register";
import { DEFAULT_LANDING_THEME, landingPageBackgroundStyle, landingSectionBackgroundStyle } from "@/lib/landing-theme";
import { resolveLandingPublicCode } from "@/services/landing";
import { normalizeCep } from "@/lib/postal-code";
import { applySupporterGeoFromCep } from "@/services/postal-code";
import { toast } from "sonner";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

type CaptureForm = z.infer<typeof landingCaptureSchema>;

export const Route = createFileRoute("/landpage/$code")({
  beforeLoad: async ({ params }) => {
    const canonical = await resolveLandingPublicCode(params.code);
    if (canonical && canonical !== params.code.toLowerCase()) {
      throw redirect({
        to: "/landpage/$code",
        params: { code: canonical },
        replace: true,
      });
    }
  },
  component: PublicLandingPage,
});

function PublicLandingPage() {
  const { code } = Route.useParams();
  const supportRef = useRef<HTMLElement>(null);
  const [selectedChapas, setSelectedChapas] = useState<string[]>([]);
  const [cepInput, setCepInput] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [cepLookup, setCepLookup] = useState<LandingCepLookupState>({ status: "idle" });

  const { data: landing, isLoading, error } = useQuery({
    queryKey: ["public-landing", code],
    queryFn: () => getPublicLanding(code),
  });

  const chapas = landing?.chapas ?? [];
  const leaderships = landing?.leaderships ?? [];

  const chapaLeadershipMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of chapas) {
      map.set(c.id, c.leadership_id);
    }
    return map;
  }, [chapas]);

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
    control,
    formState: { isSubmitting },
  } = useForm<CaptureForm>({
    resolver: zodResolver(landingCaptureSchema),
    defaultValues: { primary_leadership_id: undefined },
  });

  const neighborhood = watch("neighborhood") ?? "";
  const city = watch("city") ?? "";
  const primaryLeadershipId = watch("primary_leadership_id") ?? "";

  const handleCepLookupChange = useCallback((state: LandingCepLookupState) => {
    setCepLookup(state);
  }, []);

  const setNeighborhood = useCallback((v: string) => setValue("neighborhood", v), [setValue]);
  const setCity = useCallback((v: string) => setValue("city", v), [setValue]);

  const mutation = useMutation({
    mutationFn: (values: CaptureForm) =>
      registerFromLanding(code, {
        name: values.name,
        phone: values.phone,
        cep: normalizeCep(cepInput) ?? undefined,
        neighborhood: values.neighborhood,
        city: values.city,
        interest: values.interest,
        notes: values.notes,
        chapaIds: selectedChapas,
        primaryLeadershipId: values.primary_leadership_id || undefined,
      }),
    onSuccess: (result) => {
      toast.success(buildLandingSuccessMessage(result));
      const geo = getGeoForEnrichment(cepLookup);
      if (geo && result.supporter_id) {
        void applySupporterGeoFromCep(result.supporter_id, geo).catch(() => {
          /* Enrichment assíncrono: falha não afeta conversão. */
        });
      }
      reset();
      setCepInput("");
      setStateUf("");
      setCepLookup({ status: "idle" });
      setSelectedChapas([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleChapa = useCallback(
    (id: string) => {
      setSelectedChapas((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        const leadershipIds = new Set(
          next.map((chapaId) => chapaLeadershipMap.get(chapaId)).filter(Boolean) as string[],
        );
        if (leadershipIds.size === 1) {
          setValue("primary_leadership_id", [...leadershipIds][0]);
        }
        return next;
      });
    },
    [chapaLeadershipMap, setValue],
  );

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
  const theme = landing.theme ?? DEFAULT_LANDING_THEME;
  const pageStyle = landingPageBackgroundStyle(theme);
  const middleZoneStyle = landingSectionBackgroundStyle(theme.middle_background_color);
  const footerZoneStyle = landingSectionBackgroundStyle(theme.footer_background_color);

  return (
    <div
      className={`landing-page relative min-h-screen bg-background${theme.show_graphic_elements ? " landing-page--decorated" : ""}${theme.show_political_icons ? " landing-page--with-icons" : ""}`}
      style={pageStyle}
    >
      {theme.show_political_icons && (
        <LandingPoliticalDecor color={theme.political_icons_color} />
      )}
      <main className="relative z-[1] mx-auto max-w-3xl space-y-8 px-4 py-8 md:py-12">
        <LandingHero landing={landing} onPrimaryAction={scrollToSupport} />

        <div
          className={`landing-zone landing-zone--middle space-y-8${theme.middle_background_color ? " landing-zone--filled" : ""}`}
          style={middleZoneStyle}
        >
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
          className="scroll-mt-6"
        >
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                Quero apoiar
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Leva menos de um minuto. Seu nome e contato bastam — o restante é opcional. Você entra na base de{" "}
                <strong>Eleitores</strong> da campanha.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome *</Label>
                  <Input {...register("name")} required autoComplete="name" />
                </div>
                <PhoneFormField
                  className="sm:col-span-2"
                  control={control}
                  name="phone"
                  label="Telefone / WhatsApp"
                />
                <LandingCepLookup
                  cepValue={cepInput}
                  onCepChange={setCepInput}
                  onLookupStateChange={handleCepLookupChange}
                  onNeighborhoodChange={setNeighborhood}
                  onCityChange={setCity}
                  onStateUfChange={setStateUf}
                />
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input {...register("city")} />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input {...register("neighborhood")} />
                </div>
                {stateUf && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>UF</Label>
                    <Input value={stateUf} readOnly className="bg-muted/40" />
                  </div>
                )}
                {leaderships.length > 0 && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Liderança primária (opcional)</Label>
                    <Select
                      value={primaryLeadershipId || "none"}
                      onValueChange={(v) =>
                        setValue("primary_leadership_id", v === "none" ? undefined : v, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma liderança" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {leaderships.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                            {l.region ? ` · ${l.region}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Aparece na aba Eleitores com vínculo à liderança escolhida.
                    </p>
                  </div>
                )}
                {chapasByLeadership.length > 0 && (
                  <div className="sm:col-span-2">
                    <LandingChapasSection
                      groups={chapasByLeadership}
                      selectedChapas={selectedChapas}
                      onToggle={toggleChapa}
                      embedded
                    />
                  </div>
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
        </div>

        <div
          className={`landing-zone landing-zone--footer space-y-8${theme.footer_background_color ? " landing-zone--filled" : ""}`}
          style={footerZoneStyle}
        >
        <LandingDemandSection
          publicCode={code}
          neighborhood={neighborhood}
          city={city}
          stateUf={stateUf}
        />

        <p className="pb-4 text-center text-[10px] text-muted-foreground/80">
          Dados tratados com responsabilidade.{" "}
          <Link to="/login" className="underline-offset-2 hover:underline">
            Strategos
          </Link>
        </p>
        </div>
      </main>
    </div>
  );
}
