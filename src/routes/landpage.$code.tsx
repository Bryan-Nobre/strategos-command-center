import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart } from "lucide-react";
import {
  getPublicLanding,
  registerFromLanding,
  type PublicLandingChapa,
} from "@/services/landing";
import { landingCaptureSchema } from "@/types/domain";
import type { CaptureForm } from "@/lib/landing-capture-form";
import { PhoneFormField } from "@/components/common/PhoneFormField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingCaptureSteps } from "@/components/landing/LandingCaptureSteps";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LandingFieldHelpLink } from "@/components/landing/LandingFieldHelpLink";
import { LandingVotingPlaceField } from "@/components/landing/LandingVotingPlaceField";
import { CORREIOS_CEP_URL } from "@/lib/landing-external-links";
import { formatBirthDateMask, parseBirthDateBr } from "@/lib/birth-date";
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
import { getLandingProposalBody, parseLandingProposals } from "@/lib/landing-proposals";
import { DEFAULT_LANDING_THEME, landingPageRootStyle, landingSectionBackgroundStyle } from "@/lib/landing-theme";
import { resolveLandingPublicCode } from "@/services/landing";
import { normalizeCep } from "@/lib/postal-code";
import { applySupporterGeoFromCep } from "@/services/postal-code";
import { toast } from "sonner";
import { LandingLgpdConsent } from "@/components/landing/LandingLgpdConsent";

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
    const map = new Map<
      string,
      { leadershipId: string; name: string; region: string | null; items: PublicLandingChapa[] }
    >();
    for (const c of chapas) {
      const key = c.leadership_id;
      const entry = map.get(key) ?? {
        leadershipId: key,
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
    formState: { isSubmitting, errors },
  } = useForm<CaptureForm>({
    resolver: zodResolver(landingCaptureSchema),
    defaultValues: {
      primary_leadership_id: undefined,
      lgpd_consent: false,
      birth_date: "",
      voting_place_name: "",
    },
  });

  const neighborhood = watch("neighborhood") ?? "";
  const city = watch("city") ?? "";
  const stateUf = watch("state_uf") ?? "";
  const birthDate = watch("birth_date") ?? "";
  const votingPlaceName = watch("voting_place_name") ?? "";
  const lgpdConsent = watch("lgpd_consent") ?? false;
  const primaryLeadershipId = watch("primary_leadership_id") ?? "";

  const handleCepLookupChange = useCallback((state: LandingCepLookupState) => {
    setCepLookup(state);
  }, []);

  const setNeighborhood = useCallback((v: string) => setValue("neighborhood", v), [setValue]);
  const setCity = useCallback((v: string) => setValue("city", v), [setValue]);
  const setStreet = useCallback((v: string) => setValue("street", v), [setValue]);
  const setStateUf = useCallback((v: string) => setValue("state_uf", v), [setValue]);

  const mutation = useMutation({
    mutationFn: (values: CaptureForm) =>
      registerFromLanding(code, {
        name: values.name,
        birthDate: parseBirthDateBr(values.birth_date) ?? "",
        email: values.email,
        phone: values.phone,
        cep: normalizeCep(cepInput) ?? undefined,
        street: values.street,
        addressNumber: values.address_number,
        addressComplement: values.address_complement,
        stateUf: stateUf || values.state_uf,
        neighborhood: values.neighborhood,
        city: values.city,
        votingPlaceName: values.voting_place_name,
        lgpdConsent: values.lgpd_consent,
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

  if (isLoading) return <LoadingState />;
  if (error || !landing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Página não encontrada.</p>
      </div>
    );
  }

  const proposals = parseLandingProposals(landing.proposals);
  const theme = landing.theme ?? DEFAULT_LANDING_THEME;
  const pageStyle = landingPageRootStyle(theme);
  const middleZoneStyle = landingSectionBackgroundStyle(theme.middle_background_color);
  const footerZoneStyle = landingSectionBackgroundStyle(theme.footer_background_color);
  const decorIconColor = theme.political_icons_color ?? theme.accent_color;

  return (
    <div
      className={`landing-page relative min-h-screen bg-background${theme.accent_color ? " landing-page--accent" : ""}${theme.show_graphic_elements ? " landing-page--decorated" : ""}${theme.show_political_icons ? " landing-page--with-icons" : ""}`}
      style={pageStyle}
    >
      {theme.show_political_icons && (
        <LandingPoliticalDecor color={decorIconColor} />
      )}
      <main className="relative z-[1] mx-auto max-w-3xl space-y-8 px-4 py-8 md:py-12">
        <LandingHero landing={landing} />

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
                  {getLandingProposalBody(p) && (
                    <CardContent className="pb-3 pt-0 text-xs leading-relaxed text-muted-foreground">
                      {getLandingProposalBody(p)}
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
                Preencha seus dados para entrar na base de <strong>Eleitores</strong> da campanha. Campos com * são
                obrigatórios.
              </p>
            </CardHeader>
            <CardContent>
              <LandingCaptureSteps
                register={register}
                control={control}
                errors={errors}
                watch={watch}
                setValue={setValue}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onSubmit={(v) => mutation.mutate(v)}
                personalStep={
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="landing-name">Nome *</Label>
                      <Input id="landing-name" {...register("name")} autoComplete="name" />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landing-birth">Data de nascimento *</Label>
                      <Input
                        id="landing-birth"
                        inputMode="numeric"
                        autoComplete="bday"
                        placeholder="DD/MM/AAAA"
                        value={birthDate}
                        onChange={(e) =>
                          setValue("birth_date", formatBirthDateMask(e.target.value), {
                            shouldValidate: true,
                          })
                        }
                      />
                      {errors.birth_date && (
                        <p className="text-xs text-destructive">{errors.birth_date.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landing-email">E-mail *</Label>
                      <Input
                        id="landing-email"
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                    <PhoneFormField
                      className="sm:col-span-2"
                      control={control}
                      name="phone"
                      label="WhatsApp *"
                    />
                  </div>
                }
                addressStep={
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <LandingFieldHelpLink
                        prefix="Não sabe o CEP?"
                        linkLabel="Clique aqui"
                        href={CORREIOS_CEP_URL}
                      />
                    </div>
                    <LandingCepLookup
                      cepValue={cepInput}
                      onCepChange={setCepInput}
                      onLookupStateChange={handleCepLookupChange}
                      onNeighborhoodChange={setNeighborhood}
                      onCityChange={setCity}
                      onStateUfChange={setStateUf}
                      onStreetChange={setStreet}
                    />
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="landing-street">Logradouro</Label>
                      <Input id="landing-street" {...register("street")} autoComplete="street-address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landing-number">Nº</Label>
                      <Input id="landing-number" {...register("address_number")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landing-complement">Complemento</Label>
                      <Input id="landing-complement" {...register("address_complement")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landing-neighborhood">Bairro</Label>
                      <Input id="landing-neighborhood" {...register("neighborhood")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landing-city">Cidade</Label>
                      <Input id="landing-city" {...register("city")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landing-uf">UF</Label>
                      <Input
                        id="landing-uf"
                        maxLength={2}
                        className={stateUf ? "bg-muted/40" : undefined}
                        readOnly={!!stateUf && cepLookup.status === "found"}
                        {...register("state_uf")}
                      />
                    </div>
                    <LandingVotingPlaceField
                      value={votingPlaceName}
                      onChange={(v) =>
                        setValue("voting_place_name", v, { shouldValidate: true, shouldDirty: true })
                      }
                      error={errors.voting_place_name?.message}
                    />
                  </div>
                }
                supportStep={
                  <div className="grid gap-4 sm:grid-cols-2">
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
                      <Label>Quer deixar uma mensagem? (opcional)</Label>
                      <Textarea {...register("notes")} rows={3} className="min-h-[5rem] resize-y" />
                    </div>
                    <LandingLgpdConsent
                      checked={lgpdConsent}
                      onCheckedChange={(checked) =>
                        setValue("lgpd_consent", checked, { shouldValidate: true })
                      }
                      error={errors.lgpd_consent?.message}
                      publicCode={code}
                    />
                  </div>
                }
              />
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
