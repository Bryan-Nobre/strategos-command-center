/** Espelha public.normalize_supporter_phone — apenas dígitos, até 11 (DDD+número). */
export function normalizeSupporterPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length <= 11 ? digits : digits.slice(-11);
}

/** Máscara visual BR (11 dígitos). Não altera persistência. */
export function formatPhoneBrDisplay(phone: string | null | undefined): string {
  const n = normalizeSupporterPhone(phone);
  if (!n) return "";
  if (n.length <= 10) {
    return n.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return n.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}
