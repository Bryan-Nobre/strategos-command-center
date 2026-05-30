import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

export type PlanPeriodStatus =
  | "unset"
  | "missing_end"
  | "missing_start"
  | "active"
  | "ends_today"
  | "expired";

export type PlanPeriodSummary = {
  status: PlanPeriodStatus;
  daysRemaining: number | null;
  message: string;
  badgeVariant: "outline" | "default" | "secondary" | "destructive";
};

function parseIsoDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = parseISO(value);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

/** Resumo do período contratado do plano (datas YYYY-MM-DD). */
export function summarizePlanPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  today: Date = startOfDay(new Date()),
): PlanPeriodSummary {
  const startDate = start ? parseIsoDateOnly(start) : null;
  const endDate = end ? parseIsoDateOnly(end) : null;

  if (!startDate && !endDate) {
    return {
      status: "unset",
      daysRemaining: null,
      message: "Defina início e fim do período do plano",
      badgeVariant: "outline",
    };
  }

  if (startDate && !endDate) {
    return {
      status: "missing_end",
      daysRemaining: null,
      message: "Informe a data de término do plano",
      badgeVariant: "outline",
    };
  }

  if (!startDate && endDate) {
    return {
      status: "missing_start",
      daysRemaining: null,
      message: "Informe a data de início do plano",
      badgeVariant: "outline",
    };
  }

  const daysRemaining = differenceInCalendarDays(endDate!, today);

  if (daysRemaining < 0) {
    const overdue = Math.abs(daysRemaining);
    return {
      status: "expired",
      daysRemaining,
      message:
        overdue === 1 ? "Plano encerrado há 1 dia" : `Plano encerrado há ${overdue} dias`,
      badgeVariant: "destructive",
    };
  }

  if (daysRemaining === 0) {
    return {
      status: "ends_today",
      daysRemaining: 0,
      message: "Encerra hoje",
      badgeVariant: "secondary",
    };
  }

  return {
    status: "active",
    daysRemaining,
    message:
      daysRemaining === 1 ? "Falta 1 dia para encerrar" : `Faltam ${daysRemaining} dias para encerrar`,
    badgeVariant: daysRemaining <= 7 ? "secondary" : "default",
  };
}

export function validatePlanPeriodRange(start: string, end: string): string | null {
  if (!start && !end) return null;
  if (start && end && start > end) {
    return "A data de início deve ser anterior ou igual à data de término.";
  }
  return null;
}
