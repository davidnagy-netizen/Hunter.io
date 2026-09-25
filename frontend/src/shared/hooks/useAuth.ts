import { useMeQuery } from "../api/auth.queries";
import type { AuthUser } from "../types/auth.types";

/**
 * Every other feature reads auth state through these, not by calling
 * `useMeQuery()` directly — keeps "what does admin/subscriber mean" defined
 * in one place, matching how `server/auth.js` is the single source there.
 */
export function useCurrentUser(): AuthUser | null {
  const { data } = useMeQuery();
  return data?.user ?? null;
}

export function useIsAdmin(): boolean {
  return useCurrentUser()?.role === "admin";
}

export function useIsSubscriber(): boolean {
  const { data } = useMeQuery();
  const tier = data?.entitlements.tier;
  return tier === "subscriber" || tier === "admin";
}

export function useIsAuthenticated(): boolean {
  return useCurrentUser() !== null;
}
