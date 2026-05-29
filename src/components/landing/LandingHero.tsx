import { MessageCircle, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicLanding } from "@/services/landing";

export function LandingHero({
  landing,
  onPrimaryAction,
}: {
  landing: PublicLanding;
  onPrimaryAction: () => void;
}) {
  const wa = landing.whatsapp?.replace(/\D/g, "");
  const social = (landing.social_links ?? {}) as Record<string, string>;

  return (
    <section className="landing-hero overflow-hidden rounded-2xl border border-border/80 bg-card shadow-elegant">
      <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
        <div className="flex justify-center md:justify-start">
          {landing.photo_url ? (
            <img
              src={landing.photo_url}
              alt=""
              className="h-24 w-24 rounded-2xl border border-border object-cover shadow-sm md:h-28 md:w-28"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-primary-foreground md:h-28 md:w-28">
              <Vote className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{landing.tenant_name}</h1>
            {landing.headline && (
              <p className="mt-2 text-base text-muted-foreground md:text-lg">{landing.headline}</p>
            )}
          </div>
          {landing.bio && (
            <p className="text-sm leading-relaxed text-foreground/90 md:text-base">{landing.bio}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Button size="lg" className="h-11 px-6" type="button" onClick={onPrimaryAction}>
              Quero apoiar
            </Button>
            {wa && (
              <Button size="lg" variant="outline" className="h-11" asChild>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            )}
            {Object.entries(social).map(([k, v]) =>
              v ? (
                <Button key={k} variant="ghost" size="sm" className="h-9 text-xs" asChild>
                  <a href={v} target="_blank" rel="noopener noreferrer">
                    {k}
                  </a>
                </Button>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
