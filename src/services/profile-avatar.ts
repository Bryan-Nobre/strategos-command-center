import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/services/team";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function uploadProfileAvatar(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem muito grande (máx. 2 MB).");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const ext = extFromMime(file.type);
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const url = `${publicUrl}?v=${Date.now()}`;
  await updateProfile({ avatar_url: url });
  return url;
}

export async function removeProfileAvatar(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files?.length) {
    const paths = files.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from("avatars").remove(paths);
  }

  await updateProfile({ avatar_url: null });
}
