import { redirect } from "@tanstack/react-router";
import type { RouterContext } from "@/router-context";
import type { AuthContext } from "./session";
import { loadAuthForRoute } from "./load-auth-for-route";

function withAuth(context: RouterContext, auth: AuthContext): RouterContext {
  return {
    ...context,
    profile: auth.profile,
    tenants: auth.tenants,
    activeTenant: auth.activeTenant,
  };
}

export async function ensureAppAuth(
  context: RouterContext,
  locationHref: string,
): Promise<RouterContext> {
  const auth = await loadAuthForRoute();
  if (!auth.session) {
    throw redirect({ to: "/login", search: { redirect: locationHref } });
  }
  if (auth.tenants.length === 0 && auth.profile?.platform_role !== "super_admin") {
    throw redirect({ to: "/signup" });
  }
  if (!auth.activeTenant && auth.profile?.platform_role !== "super_admin") {
    throw redirect({ to: "/signup" });
  }

  return withAuth(context, auth);
}

export async function ensureAdminAuth(context: RouterContext): Promise<RouterContext> {
  const auth = await loadAuthForRoute();
  if (!auth.session) {
    throw redirect({ to: "/login" });
  }
  if (auth.profile?.platform_role !== "super_admin") {
    throw redirect({ to: "/dashboard" });
  }

  return withAuth(context, auth);
}

export async function ensurePublicAuthRedirect(
  context: RouterContext,
  target: "login" | "signup" | "index",
): Promise<RouterContext> {
  const auth = await loadAuthForRoute();

  if (target === "login" && auth.session) {
    throw redirect({
      to: auth.profile?.platform_role === "super_admin" ? "/admin/tenants" : "/dashboard",
    });
  }

  if (target === "signup" && auth.session) {
    if (auth.profile?.platform_role === "super_admin") {
      throw redirect({ to: "/admin/tenants" });
    }
    if (auth.activeTenant) {
      throw redirect({ to: "/dashboard" });
    }
  }

  if (target === "index") {
    if (auth.session && auth.profile?.platform_role === "super_admin") {
      throw redirect({ to: "/admin/tenants" });
    }
    if (auth.session && auth.activeTenant) {
      throw redirect({ to: "/dashboard" });
    }
    if (auth.session) {
      throw redirect({ to: "/signup" });
    }
    throw redirect({ to: "/login" });
  }

  return context;
}
