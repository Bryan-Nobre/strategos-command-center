import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export function createServerSupabaseClient(request: Request) {
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get("Cookie") ?? "";
        return cookieHeader
          .split(";")
          .map((c) => c.trim())
          .filter(Boolean)
          .map((pair) => {
            const idx = pair.indexOf("=");
            const name = pair.slice(0, idx);
            const value = decodeURIComponent(pair.slice(idx + 1));
            return { name, value };
          });
      },
      setAll() {
        // SSR read-only context; cookie writes happen on client after auth
      },
    },
  });
}
