/** Máscara DD/MM/AAAA para data de nascimento. */
export function formatBirthDateMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Converte DD/MM/AAAA para ISO YYYY-MM-DD ou null se inválida. */
export function parseBirthDateBr(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1900 || year > new Date().getFullYear()) return null;
  if (month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDay) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return iso;
}

export function isBirthDateComplete(value: string): boolean {
  return parseBirthDateBr(value) !== null;
}

/** Idade mínima 16 anos (eleitorado). */
export function isBirthDateEligible(value: string, minAge = 16): boolean {
  const iso = parseBirthDateBr(value);
  if (!iso) return false;
  const birth = new Date(`${iso}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= minAge && age <= 120;
}
