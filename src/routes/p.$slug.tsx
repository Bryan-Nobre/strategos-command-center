import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, Vote } from "lucide-react";
import { getPublicLanding, registerFromLanding } from "@/services/landing";
import { landingCaptureSchema } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/common/LoadingState";
import { toast } from "sonner";

type CaptureForm = z.infer<typeof landingCaptureSchema>;

export const Route = createFileRoute("/p/$slug")({
  component: PublicLandingPage,
});

function PublicLandingPage() {
  const { slug } = Route.useParams();
  const { data: landing, isLoading, error } = useQuery({
    queryKey: ["public-landing", slug],
    queryFn: () => getPublicLanding(slug),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CaptureForm>({
    resolver: zodResolver(landingCaptureSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: CaptureForm) => registerFromLanding(slug, values),
    onSuccess: () => {
      toast.success("Obrigado pelo apoio! Entraremos em contato.");
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
