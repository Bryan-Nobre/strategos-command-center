/** URL pública da landing — usa código opaco (public_code), não o slug da campanha. */
export function landingPublicPath(publicCode: string): string {
  const normalized = publicCode.trim().toLowerCase();
  return `/landpage/${normalized}`;
}
