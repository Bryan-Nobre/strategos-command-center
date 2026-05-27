import { Link } from "@tanstack/react-router";
import { ArrowRight, ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NextAction } from "@/services/dashboard-intelligence";

export function NextActionsCard({ actions }: { actions: NextAction[] }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-primary" />
          Próximas ações
        </CardTitle>
        <CardDescription>Direcionamento operacional sugerido pelo sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pb-6">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.href}
            search={action.search}
            className="group flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5 text-sm transition-theme hover:border-primary/25 hover:bg-primary/5"
          >
            <span className="font-medium text-foreground/90">{action.label}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
