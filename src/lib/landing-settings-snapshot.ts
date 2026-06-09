import {
  parseLandingTheme,
  serializeLandingTheme,
  type LandingTheme,
} from "@/lib/landing-theme";
import {
  parseLandingProposals,
  serializeLandingProposals,
  type LandingProposalItem,
} from "@/lib/landing-proposals";
import { getInstagramFromSocialLinks } from "@/lib/landing-social";
import { formatPhoneBrDisplay } from "@/lib/normalize-phone";
import type { Tables } from "@/types/supabase";

export type LandingSettingsSnapshot = {
  displayName: string;
  headline: string;
  landingBio: string;
  whatsapp: string;
  instagram: string;
  photoUrl: string;
  themeJson: string;
  proposalsJson: string;
  lgpdControllerName: string;
  lgpdControllerCpf: string;
  lgpdControllerEmail: string;
  lgpdRevokeConsentUrl: string;
};

export function buildLandingSettingsSnapshot(input: {
  displayName: string;
  headline: string;
  landingBio: string;
  whatsapp: string;
  instagram: string;
  photoUrl: string;
  theme: LandingTheme;
  proposals: LandingProposalItem[];
  lgpdControllerName: string;
  lgpdControllerCpf: string;
  lgpdControllerEmail: string;
  lgpdRevokeConsentUrl: string;
}): LandingSettingsSnapshot {
  return {
    displayName: input.displayName.trim(),
    headline: input.headline.trim(),
    landingBio: input.landingBio.trim(),
    whatsapp: input.whatsapp.trim(),
    instagram: input.instagram.trim(),
    photoUrl: input.photoUrl.trim(),
    themeJson: JSON.stringify(serializeLandingTheme(input.theme)),
    proposalsJson: JSON.stringify(serializeLandingProposals(input.proposals)),
    lgpdControllerName: input.lgpdControllerName.trim(),
    lgpdControllerCpf: input.lgpdControllerCpf.trim(),
    lgpdControllerEmail: input.lgpdControllerEmail.trim(),
    lgpdRevokeConsentUrl: input.lgpdRevokeConsentUrl.trim(),
  };
}

export function snapshotFromLandingRow(landing: Tables<"landing_pages">): LandingSettingsSnapshot {
  return buildLandingSettingsSnapshot({
    displayName: landing.display_name ?? "",
    headline: landing.headline ?? "",
    landingBio: landing.bio ?? "",
    whatsapp: landing.whatsapp ? formatPhoneBrDisplay(landing.whatsapp) : "",
    instagram: getInstagramFromSocialLinks(landing.social_links),
    photoUrl: landing.photo_url ?? "",
    theme: parseLandingTheme(landing.theme),
    proposals: parseLandingProposals(landing.proposals),
    lgpdControllerName: landing.lgpd_controller_name ?? "",
    lgpdControllerCpf: landing.lgpd_controller_cpf ?? "",
    lgpdControllerEmail: landing.lgpd_controller_email ?? "",
    lgpdRevokeConsentUrl: landing.lgpd_revoke_consent_url ?? "",
  });
}

export function landingSettingsSnapshotsEqual(
  a: LandingSettingsSnapshot,
  b: LandingSettingsSnapshot,
): boolean {
  return (
    a.displayName === b.displayName &&
    a.headline === b.headline &&
    a.landingBio === b.landingBio &&
    a.whatsapp === b.whatsapp &&
    a.instagram === b.instagram &&
    a.photoUrl === b.photoUrl &&
    a.themeJson === b.themeJson &&
    a.proposalsJson === b.proposalsJson &&
    a.lgpdControllerName === b.lgpdControllerName &&
    a.lgpdControllerCpf === b.lgpdControllerCpf &&
    a.lgpdControllerEmail === b.lgpdControllerEmail &&
    a.lgpdRevokeConsentUrl === b.lgpdRevokeConsentUrl
  );
}
