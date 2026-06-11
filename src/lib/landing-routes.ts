import { getAppOrigin } from "@/lib/landing-lgpd-routes";

/** Caminho público da landing — usa código opaco (public_code), não o slug da campanha. */
export function landingPublicPath(publicCode: string): string {
  const normalized = publicCode.trim().toLowerCase();
  return `/landpage/${normalized}`;
}

/** URL absoluta para compartilhar (dev, staging ou produção conforme o host atual / VITE_APP_URL). */
export function landingPublicUrl(publicCode: string): string {
  return `${getAppOrigin()}${landingPublicPath(publicCode)}`;
}
