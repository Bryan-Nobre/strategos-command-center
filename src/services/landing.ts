import { createClient } from "@/lib/supabase/client";
import { parseLandingRegisterResult, type LandingRegisterResult } from "@/lib/landing-register";
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
  slug: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  video_url: string | null;
  proposals: unknown;
  social_links: unknown;
  whatsapp: string | null;
  tenant_name: string;
  chapas?: PublicLandingChapa[];
  leaderships?: PublicLandingLeadership[];
};

export async function getPublicLanding(slug: string): Promise<PublicLanding | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_landing", { p_slug: slug });
  if (error) throw error;
  if (!data) return null;
  return data as PublicLanding;
}

export async function registerFromLanding(
  slug: string,
  payload: {
    name: string;
    phone?: string;
    cep?: string;
    neighborhood?: string;
    city?: string;
    interest?: string;
    notes?: string;
    chapaIds?: string[];
    primaryLeadershipId?: string;
  },
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("register_supporter_from_landing", {
    p_slug: slug,
    p_name: payload.name,
    p_phone: payload.phone ?? null,
    p_neighborhood: payload.neighborhood ?? null,
    p_city: payload.city ?? null,
    p_interest: payload.interest ?? null,
    p_notes: payload.notes ?? null,
    p_chapa_ids: payload.chapaIds?.length ? payload.chapaIds : null,
    p_email: null,
    p_cep: payload.cep ?? null,
    p_primary_leadership_id: payload.primaryLeadershipId ?? null,
  });
  if (error) throw error;
  return parseLandingRegisterResult(data);
}

export async function registerDemandFromLanding(
  slug: string,
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
    p_slug: slug,
    p_title: payload.title,
    p_description: payload.description ?? undefined,
    p_category: (payload.category as Enums<"demand_category"> | undefined) ?? undefined,
    p_neighborhood: payload.neighborhood ?? undefined,
    p_city: payload.city ?? undefined,
    p_requester_name: payload.requester_name ?? undefined,
    p_requester_phone: payload.requester_phone ?? undefined,
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

export async function updateLandingPage(tenantId: string, payload: TablesUpdate<"landing_pages">) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .update(payload)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
