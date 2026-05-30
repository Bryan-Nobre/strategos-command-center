/** Espelha public.normalize_supporter_phone — apenas dígitos, até 11 (DDD+número). */
export function normalizeSupporterPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length <= 11) return digits;
  // +55 ou prefixos longos: mantém os 11 dígitos finais (DDD + número BR)
  return digits.slice(-11);
}

/** Máscara visual BR (10 ou 11 dígitos). Não altera persistência. */
export function formatPhoneBrDisplay(phone: string | null | undefined): string {
  const n = normalizeSupporterPhone(phone);
  if (!n) return "";
  if (n.length <= 10) {
    return n.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/[- ]$/, "");
  }
  return n.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/[- ]$/, "");
}

/** Aplica máscara enquanto o usuário digita (máx. 11 dígitos). */
export function maskPhoneBrInput(raw: string): string {
  return formatPhoneBrDisplay(raw);
}

export const PHONE_BR_PLACEHOLDER = "(61) 99999-9999";

export const PHONE_INVALID_MSG =
  "Informe um telefone válido com DDD (10 dígitos fixo ou 11 celular).";

/** Celular ou fixo brasileiro com DDD. */
export function isValidBrPhone(phone: string | null | undefined): boolean {
  const n = normalizeSupporterPhone(phone);
  if (!n) return false;
  if (n.length !== 10 && n.length !== 11) return false;
  const ddd = Number(n.slice(0, 2));
  return ddd >= 11 && ddd <= 99;
}

/** Vazio é válido; se preenchido, deve ser BR válido. */
export function isValidBrPhoneOptional(phone: string | null | undefined): boolean {
  const n = normalizeSupporterPhone(phone);
  if (!n) return true;
  return isValidBrPhone(n);
}

export function telHref(phone: string | null | undefined): string | null {
  const n = normalizeSupporterPhone(phone);
  if (!n) return null;
  return `tel:+55${n}`;
}
