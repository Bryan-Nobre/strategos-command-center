import { buildLgpdTermBlocks, type LandingLgpdConfig } from "@/lib/landing-lgpd";

export function LandingLgpdTermContent({ config }: { config: LandingLgpdConfig }) {
  const blocks = buildLgpdTermBlocks(config);

  return (
    <article className="landing-lgpd-term space-y-4 text-sm leading-relaxed text-foreground/90">
      {blocks.map((block, index) => {
        if (block.type === "controller") {
          const c = block.config;
          return (
            <section
              key="controller"
              className="rounded-lg border border-border/80 bg-muted/30 p-4"
            >
              <h3 className="mb-3 text-sm font-semibold text-foreground">Dados do Controlador</h3>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nome
                  </dt>
                  <dd>{c.controller_name}</dd>
                </div>
                {c.controller_cpf && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      CPF
                    </dt>
                    <dd>{c.controller_cpf}</dd>
                  </div>
                )}
                {c.controller_email && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      E-mail
                    </dt>
                    <dd>
                      <a
                        href={`mailto:${c.controller_email}`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {c.controller_email}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          );
        }
        if (block.type === "revoke") {
          return (
            <p key="revoke" className="text-pretty">
              Estou ciente de que, a qualquer tempo, posso revogar o consentimento ora fornecido,
              por meio do endereço{" "}
              <a
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {block.url}
              </a>
              , hipótese em que o envio de comunicações das atividades desenvolvidas pelo
              Controlador deverá cessar, ressalvadas as hipóteses legais de tratamento.
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-pretty">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
