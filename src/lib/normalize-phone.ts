const BR_PHONE_MAX_DIGITS = 11;

/** Apenas dígitos, no máximo 11 — usado na digitação (não “come” números do meio). */
export function extractBrPhoneDigits(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "").slice(0, BR_PHONE_MAX_DIGITS);
}

/** Espelha public.normalize_supporter_phone — apenas dígitos, até 11 (DDD+número). */
export function normalizeSupporterPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length <= BR_PHONE_MAX_DIGITS) return digits;
  // Colar +55…: descarta o prefixo do país e mantém DDD+número (11 finais).
  if (digits.length > BR_PHONE_MAX_DIGITS && digits.startsWith("55")) {
    return digits.slice(-BR_PHONE_MAX_DIGITS);
  }
  return digits.slice(0, BR_PHONE_MAX_DIGITS);
}

function formatBrPhoneDigits(digits: string): string {
  if (!digits) return "";
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/[- ]$/, "");
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/[- ]$/, "");
}

/** Máscara visual BR (10 ou 11 dígitos). Não altera persistência. */
export function formatPhoneBrDisplay(phone: string | null | undefined): string {
  return formatBrPhoneDigits(extractBrPhoneDigits(phone));
}

/** Aplica máscara enquanto o usuário digita (máx. 11 dígitos; extras são ignorados). */
export function maskPhoneBrInput(raw: string): string {
  return formatBrPhoneDigits(extractBrPhoneDigits(raw));
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
