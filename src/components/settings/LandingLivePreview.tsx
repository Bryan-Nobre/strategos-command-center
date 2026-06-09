import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_LANDING_ACCENT,
  landingPageRootStyle,
  landingSectionBackgroundStyle,
  type LandingTheme,
} from "@/lib/landing-theme";
import { getLandingProposalBody, type LandingProposalItem } from "@/lib/landing-proposals";

type LandingLivePreviewProps = {
  title: string;
  headline: string;
  photoUrl: string;
  theme: LandingTheme;
  proposals: LandingProposalItem[];
};

export function LandingLivePreview({
  title,
  headline,
  photoUrl,
  theme,
  proposals,
}: LandingLivePreviewProps) {
  const accent = theme.accent_color ?? DEFAULT_LANDING_ACCENT;
  const pageStyle = landingPageRootStyle(theme);
  const middleStyle = landingSectionBackgroundStyle(theme.middle_background_color);
  const previewProposals = proposals.filter((p) => p.title.trim() || p.text.trim()).slice(0, 2);

  return (
    <div className="settings-landing-live-preview overflow-hidden rounded-xl border border-border/70">
      <p className="border-b border-border/60 bg-muted/30 px-3 py-2 text-[11px] font-medium text-muted-foreground">
        Prévia ao vivo · como o visitante verá a landing
      </p>
      <div
        className={`landing-page landing-page--preview relative max-h-[420px] overflow-y-auto text-foreground${theme.accent_color ? " landing-page--accent" : ""}${theme.show_graphic_elements ? " landing-page--decorated" : ""}`}
        style={pageStyle}
      >
        <div className="space-y-3 p-3">
          <div
            className={`landing-hero rounded-xl border border-border/40 p-3${theme.show_graphic_elements ? " landing-hero--decorated" : ""}`}
            style={landingSectionBackgroundStyle(theme.hero_background_color)}
          >
            <div className="relative z-[1] flex items-center gap-3">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  className="h-12 w-12 rounded-lg border border-border/60 object-cover"
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: accent }}
                >
                  {title.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {headline.trim() || "Slogan da campanha"}
                </p>
              </div>
            </div>
          </div>

          {previewProposals.length > 0 && (
            <div className="space-y-1.5" style={middleStyle}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Propostas
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {previewProposals.map((p, i) => (
                  <Card key={i} className="border-border/50 shadow-none">
                    <CardHeader className="px-2.5 py-2 pb-1">
                      <CardTitle className="text-[11px] leading-snug">
                        {p.title || `Proposta ${i + 1}`}
                      </CardTitle>
                    </CardHeader>
                    {getLandingProposalBody(p) && (
                      <CardContent className="px-2.5 pb-2 pt-0 text-[10px] leading-relaxed text-muted-foreground">
                        {getLandingProposalBody(p).slice(0, 80)}
                        {getLandingProposalBody(p).length > 80 ? "…" : ""}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div
            className="rounded-xl border border-border/40 p-3"
            style={middleStyle}
          >
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
              <Heart className="h-3.5 w-3.5 text-primary" aria-hidden />
              Quero apoiar
            </p>
            <div className="mb-2 grid grid-cols-2 gap-1.5">
              <div className="h-6 rounded-md border border-border/60 bg-background/80" />
              <div className="h-6 rounded-md border border-border/60 bg-background/80" />
            </div>
            <Button type="button" size="sm" className="h-7 text-[10px] pointer-events-none">
              Confirmar meu apoio
            </Button>
          </div>

          {theme.show_graphic_elements && (
            <div className="flex justify-center gap-1 py-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: accent, opacity: 0.35 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
