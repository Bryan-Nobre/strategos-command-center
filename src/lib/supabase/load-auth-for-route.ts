import { createIsomorphicFn } from "@tanstack/react-start";
import { loadAuthContextForRoute } from "./session";

/** SSR: cookies via Request; browser: Supabase client local. */
export const loadAuthForRoute = createIsomorphicFn()
  .client(async () => loadAuthContextForRoute())
  .server(async () => {
    const { getRequest } = await import("@tanstack/react-start/server");
    return loadAuthContextForRoute(getRequest());
  });
