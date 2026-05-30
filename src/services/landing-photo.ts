import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadLandingHeroPhoto(tenantId: string, file: File): Promise<string> {
  if (!tenantId) throw new Error("Campanha inválida");
  if (!ALLOWED.has(file.type)) {
    throw new Error("Use JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem muito grande (máx. 3 MB).");
  }

  const supabase = createClient();
  const ext = extFromMime(file.type);
  const path = `${tenantId}/hero.${ext}`;

  const { error: uploadError } = await supabase.storage.from("landing-photos").upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("landing-photos").getPublicUrl(path);

  return `${publicUrl}?v=${Date.now()}`;
}

export async function removeLandingHeroPhoto(tenantId: string): Promise<void> {
  if (!tenantId) throw new Error("Campanha inválida");

  const supabase = createClient();
  const { data: files } = await supabase.storage.from("landing-photos").list(tenantId);
  if (files?.length) {
    const paths = files.map((f) => `${tenantId}/${f.name}`);
    await supabase.storage.from("landing-photos").remove(paths);
  }
}
