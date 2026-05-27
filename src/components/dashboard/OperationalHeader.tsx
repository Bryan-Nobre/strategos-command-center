import type { QuickPill } from "@/services/dashboard-intelligence";

export function OperationalHeader({
  greeting,
  briefing,
  pills,
}: {
  greeting: string;
  briefing: string;
  pills: QuickPill[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading text-2xl tracking-tight sm:text-3xl">{greeting}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{briefing}</p>
      </div>
      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => (
            <span
              key={pill.id}
              className={
                pill.tone === "positive"
                  ? "rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  : pill.tone === "warning"
                    ? "rounded-full border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)] px-3 py-1 text-xs font-medium text-[#b45309] dark:text-warning"
                    : "rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground"
              }
            >
              {pill.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
