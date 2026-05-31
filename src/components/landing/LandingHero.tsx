import { Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_LANDING_THEME,
  landingHeroTitle,
  landingPhotoClassName,
  landingSectionBackgroundStyle,
  type LandingTheme,
} from "@/lib/landing-theme";
import { getInstagramFromSocialLinks } from "@/lib/landing-social";
import type { PublicLanding } from "@/services/landing";
import { cn } from "@/lib/utils";

export function LandingHero({ landing }: { landing: PublicLanding }) {
  const wa = landing.whatsapp?.replace(/\D/g, "");
  const instagram = getInstagramFromSocialLinks(landing.social_links);
  const theme: LandingTheme = landing.theme ?? DEFAULT_LANDING_THEME;
  const title = landingHeroTitle(landing);
  const heroBgStyle = landingSectionBackgroundStyle(theme.hero_background_color);
  const showContact = Boolean(wa || instagram);

  return (
    <section
      className={cn(
        "landing-hero overflow-hidden rounded-2xl border border-border/80 bg-card shadow-elegant",
        theme.hero_style === "minimal" && "landing-hero--minimal",
        theme.hero_style === "stamped" && "landing-hero--stamped",
        theme.show_graphic_elements && "landing-hero--decorated",
        theme.hero_background_color && "landing-hero--custom-bg",
      )}
      style={heroBgStyle}
    >
      {theme.show_graphic_elements && theme.hero_style === "stamped" && landing.photo_url && (
        <div
          className="landing-hero-watermark pointer-events-none select-none"
          aria-hidden
          style={{ backgroundImage: `url(${landing.photo_url})` }}
        />
      )}
      <div className="relative grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
        <div className="flex justify-center md:justify-start">
          {landing.photo_url ? (
            <img
              src={landing.photo_url}
              alt={title}
              className={landingPhotoClassName(theme.photo_style)}
            />
          ) : (
            <div
              className={cn(
                "flex h-24 w-24 items-center justify-center bg-primary text-primary-foreground md:h-28 md:w-28",
                landingPhotoClassName(theme.photo_style),
              )}
            >
              <span className="text-2xl font-bold">{title.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            {landing.headline && (
              <p className="mt-2 text-base text-muted-foreground md:text-lg">{landing.headline}</p>
            )}
          </div>
          {landing.bio && (
            <p className="text-sm leading-relaxed text-foreground/90 md:text-base">{landing.bio}</p>
          )}
          {showContact && (
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {wa && (
                <Button
                  size="icon"
                  className="landing-hero__btn-wa h-11 w-11 shrink-0"
                  asChild
                >
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {instagram && (
                <Button
                  size="icon"
                  variant="outline"
                  className="landing-hero__btn-ig h-11 w-11 shrink-0"
                  asChild
                >
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
