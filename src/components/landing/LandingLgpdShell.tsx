import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, FileText, Shield, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { landingHeroTitle, landingPageBackgroundStyle, type LandingTheme } from "@/lib/landing-theme";
import { landingLgpdRevokePath, landingLgpdTermPath } from "@/lib/landing-lgpd-routes";
import { landingPublicPath } from "@/lib/landing-routes";
import type { PublicLanding } from "@/services/landing";

type LgpdTab = "termo" | "revogar";

function activeLgpdTab(pathname: string, code: string): LgpdTab {
  const revoke = landingLgpdRevokePath(code);
  if (pathname === revoke || pathname.startsWith(`${revoke}/`)) return "revogar";
  return "termo";
}

export function LandingLgpdShell({
  code,
  landing,
  theme,
}: {
  code: string;
  landing: PublicLanding;
  theme: LandingTheme;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tab = activeLgpdTab(pathname, code);
  const campaignTitle = landingHeroTitle(landing);
  const pageStyle = landingPageBackgroundStyle(theme);

  const tabs: {
    id: LgpdTab;
    label: string;
    icon: typeof FileText;
    to: "/lgpd/$code/termo" | "/lgpd/$code/revogar";
  }[] = [
    {
      id: "termo",
      label: "Termo de Consentimento",
      icon: FileText,
      to: "/lgpd/$code/termo",
    },
    {
      id: "revogar",
      label: "Revogar consentimento",
      icon: ShieldOff,
      to: "/lgpd/$code/revogar",
    },
  ];

  return (
    <div className="landing-lgpd-page min-h-screen" style={pageStyle}>
      <header
        className="landing-lgpd-page__header border-b border-border/60"
        style={
          theme.hero_background_color
            ? { background: theme.hero_background_color }
            : undefined
        }
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Privacidade e dados (LGPD)
              </p>
              <h1 className="mt-0.5 text-xl font-semibold text-foreground sm:text-2xl">
                {campaignTitle}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Lei nº 13.709/2018 — informações sobre tratamento de dados pessoais e cadastrais.
              </p>
            </div>
          </div>

          <nav
            className="landing-lgpd-page__tabs flex gap-1 rounded-lg border border-border/70 bg-background/80 p-1"
            aria-label="Seções LGPD"
          >
            {tabs.map(({ id, label, icon: Icon, to }) => (
              <Link
                key={id}
                to={to}
                params={{ code }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm",
                  tab === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
                aria-current={tab === id ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="leading-tight">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-border/70 bg-card/95 p-5 shadow-sm sm:p-8">
          <Outlet />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            to="/landpage/$code"
            params={{ code }}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar para a página da campanha
          </Link>
          <span className="mx-2 text-border">·</span>
          <span className="font-mono text-xs">{landingPublicPath(code)}</span>
        </p>
      </main>
    </div>
  );
}
