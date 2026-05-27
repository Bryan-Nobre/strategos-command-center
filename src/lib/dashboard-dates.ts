/** Utilitários de data para agregações do dashboard (dia local do navegador). */

export function toIsoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function isIsoDayBetween(isoDateTime: string | null, start: string, end: string): boolean {
  if (!isoDateTime) return false;
  const day = isoDateTime.slice(0, 10);
  return day >= start && day <= end;
}

export function lastNDaysRange(n: number): {
  start: string;
  end: string;
  prevStart: string;
  prevEnd: string;
} {
  const end = startOfLocalDay();
  const start = addDays(end, -(n - 1));
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(n - 1));
  return {
    start: toIsoDay(start),
    end: toIsoDay(end),
    prevStart: toIsoDay(prevStart),
    prevEnd: toIsoDay(prevEnd),
  };
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}
