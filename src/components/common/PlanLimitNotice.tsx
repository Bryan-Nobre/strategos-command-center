import { AlertCircle } from "lucide-react";

/** Aviso genérico de limite de plano (mensagem de upgrade definida depois). */
export function PlanLimitNotice({ message }: { message: string }) {
  return (
    <div
      className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
      role="status"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
