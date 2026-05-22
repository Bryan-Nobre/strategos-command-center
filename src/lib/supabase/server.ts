import { createServerClient } from "@supabase/ssr";
import { parseCookieHeader } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export function createServerSupabaseClient(request: Request) {
  const cookieHeader = request.headers.get("Cookie") ?? "";

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return parseCookieHeader(cookieHeader);
      },
      setAll() {
        // Escrita de cookies no SSR é feita pelo cliente após login
      },
    },
  });
}
