/** Normaliza CEP brasileiro para 8 dígitos ou null. */
export function normalizeCep(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

/** Máscara visual 00000-000 (não valida). */
export function formatCepMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isCepCompleteForLookup(value: string): boolean {
  return normalizeCep(value) !== null;
}
