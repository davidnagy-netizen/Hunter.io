import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { useMeQuery } from "@/features/authentication/api/auth.queries";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { useEligibilityAnswers } from "@/features/scoring/hooks/useEligibilityAnswers";
import { opportunitiesApi } from "./opportunities.api";

export const opportunitiesKeys = {
  all: ["opportunities"] as const,
  catalog: (scope: unknown) => [...opportunitiesKeys.all, "catalog", scope] as const,
};

/**
 * The catalog for whoever is looking.
 *
 * A subscriber/admin gets every open call — the browser then scores them
 * locally (`features/scoring`). Everyone else gets teasers the *server*
 * scored for their profile, so for them the answer depends on the profile and
 * answers and the key includes both. A subscriber's response doesn't depend on
 * either, so their key doesn't — editing a profile must not re-download 1.3 MB.
 */
export function useCatalog() {
  const me = useMeQuery();
  const isAuthenticated = useIsAuthenticated();
  const { profile } = useCompanyProfile();
  const { answers } = useEligibilityAnswers();

  const tier = me.data?.entitlements.tier;
  const isFull = tier === "subscriber" || tier === "admin";

  const query = useQuery({
    queryKey: opportunitiesKeys.catalog(isFull ? "full" : { isAuthenticated, profile, answers }),
    queryFn: () => {
      if (isAuthenticated) return opportunitiesApi.catalog();
      // `enabled` guarantees a profile for anonymous callers.
      return opportunitiesApi.catalogFor(profile!, answers);
    },
    enabled: me.isSuccess && (isAuthenticated || profile !== null),
    staleTime: 5 * 60_000,
  });

  return { ...query, catalog: query.data };
}
