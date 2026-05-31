import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/supabase/errors";
import { normalizeSupporterPhone } from "@/lib/normalize-phone";
import { parseLandingRegisterResult, type LandingRegisterResult } from "@/lib/landing-register";
import { parseLandingLgpd, type LandingLgpdConfig } from "@/lib/landing-lgpd";
import { parseLandingTheme, type LandingTheme } from "@/lib/landing-theme";
import type { Enums, TablesUpdate } from "@/types/supabase";

export type { LandingRegisterResult };

export type PublicLandingChapa = {
  id: string;
  name: string;
  subtitle: string | null;
  vote_weight: number;
  leadership_id: string;
  leadership_name: string;
  leadership_region: string | null;
};

export type PublicLandingLeadership = {
  id: string;
  name: string;
  region: string | null;
};

export type PublicLanding = {
  public_code: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  video_url: string | null;
  proposals: unknown;
  social_links: unknown;
  whatsapp: string | null;
  tenant_name: string;
  display_name?: string | null;
  theme?: LandingTheme;
  chapas?: PublicLandingChapa[];
  leaderships?: PublicLandingLeadership[];
  lgpd?: LandingLgpdConfig | null;
};

export async function getPublicLanding(publicCode: string): Promise<PublicLanding | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_landing", {
    p_public_code: publicCode.trim().toLowerCase(),
  });
  if (error) throw error;
  if (!data) return null;
  const landing = data as PublicLanding & { lgpd?: unknown };
  return {
    ...landing,
    theme: parseLandingTheme(landing.theme as never),
    lgpd: parseLandingLgpd(landing.lgpd),
  };
}

export async function resolveLandingPublicCode(ref: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("resolve_landing_public_code", {
    p_ref: ref.trim(),
  });
  if (error) throw error;
  return typeof data === "string" ? data : null;
}

export async function registerFromLanding(
  publicCode: string,
  payload: {
    name: string;
    birthDate: string;
    email: string;
    phone: string;
    cep?: string;
    street?: string;
    addressNumber?: string;
    addressComplement?: string;
    stateUf?: string;
    neighborhood?: string;
    city?: string;
    votingPlaceName: string;
    lgpdConsent: boolean;
    notes?: string;
    chapaIds?: string[];
    primaryLeadershipId?: string;
  },
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("register_supporter_from_landing", {
    p_public_code: publicCode.trim().toLowerCase(),
    p_name: payload.name,
    p_phone: normalizeSupporterPhone(payload.phone),
    p_email: payload.email,
    p_birth_date: payload.birthDate,
    p_street: payload.street ?? null,
    p_address_number: payload.addressNumber ?? null,
    p_address_complement: payload.addressComplement ?? null,
    p_state_uf: payload.stateUf ?? null,
    p_voting_place_name: payload.votingPlaceName,
    p_lgpd_consent: payload.lgpdConsent,
    p_neighborhood: payload.neighborhood ?? null,
    p_city: payload.city ?? null,
    p_interest: null,
    p_notes: payload.notes ?? null,
    p_chapa_ids: payload.chapaIds?.length ? payload.chapaIds : null,
    p_cep: payload.cep ?? null,
    p_primary_leadership_id: payload.primaryLeadershipId ?? null,
  });
  if (error) throw error;
  return parseLandingRegisterResult(data);
}

export async function registerDemandFromLanding(
  publicCode: string,
  payload: {
    title: string;
    description?: string;
    category?: string;
    neighborhood?: string;
    city?: string;
    requester_name?: string;
    requester_phone?: string;
  },
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("register_demand_from_landing", {
    p_public_code: publicCode.trim().toLowerCase(),
    p_title: payload.title,
    p_description: payload.description ?? undefined,
    p_category: (payload.category as Enums<"demand_category"> | undefined) ?? undefined,
    p_neighborhood: payload.neighborhood ?? undefined,
    p_city: payload.city ?? undefined,
    p_requester_name: payload.requester_name ?? undefined,
    p_requester_phone: normalizeSupporterPhone(payload.requester_phone) ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function getLandingPage(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const LGPD_LANDING_COLUMNS = [
  "lgpd_controller_name",
  "lgpd_controller_cpf",
  "lgpd_controller_email",
  "lgpd_revoke_consent_url",
] as const;

function splitLandingPageUpdate(payload: TablesUpdate<"landing_pages">): {
  core: TablesUpdate<"landing_pages">;
  lgpd: Pick<
    TablesUpdate<"landing_pages">,
    (typeof LGPD_LANDING_COLUMNS)[number]
  >;
} {
  const core = { ...payload };
  const lgpd: Pick<
    TablesUpdate<"landing_pages">,
    (typeof LGPD_LANDING_COLUMNS)[number]
  > = {};

  for (const key of LGPD_LANDING_COLUMNS) {
    if (key in core) {
      lgpd[key] = core[key] as never;
      delete core[key];
    }
  }

  return { core, lgpd };
}

function isMissingLgpdColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object" || !("message" in err)) return false;
  const msg = String((err as { message: string }).message);
  return /lgpd_controller_/i.test(msg) && /column|schema cache|PGRST204/i.test(msg);
}

export async function updateLandingPage(tenantId: string, payload: TablesUpdate<"landing_pages">) {
  const supabase = createClient();
  const { core, lgpd } = splitLandingPageUpdate(payload);

  const { data, error } = await supabase
    .from("landing_pages")
    .update(core)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(getAuthErrorMessage(error));
  }

  const hasLgpdFields = Object.keys(lgpd).length > 0;
  if (!hasLgpdFields) return data;

  const { data: lgpdData, error: lgpdError } = await supabase
    .from("landing_pages")
    .update(lgpd)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (lgpdError) {
    if (isMissingLgpdColumnError(lgpdError)) {
      throw new Error(
        "Landing salva parcialmente: faltam colunas LGPD no banco. Aplique a migration 20260707120000_landing_lgpd_terms no Supabase.",
      );
    }
    throw new Error(getAuthErrorMessage(lgpdError));
  }

  return lgpdData;
}
