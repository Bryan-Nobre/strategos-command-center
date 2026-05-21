import { createClient } from "@/lib/supabase/client";
import type { TablesUpdate } from "@/types/supabase";

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
    neighborhood?: string;
    city?: string;
    interest?: string;
    notes?: string;
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
