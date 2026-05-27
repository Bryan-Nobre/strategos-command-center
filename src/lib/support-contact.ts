/** Número de suporte (somente dígitos, com DDI). Configure em `VITE_SUPPORT_WHATSAPP`. */
export function getSupportWhatsAppUrl(prefill?: string): string {
  const raw = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined;
  const digits = raw?.replace(/\D/g, "") ?? "";
  if (!digits) {
    return "https://wa.me/";
  }
  const query = prefill ? `?text=${encodeURIComponent(prefill)}` : "";
  return `https://wa.me/${digits}${query}`;
}
