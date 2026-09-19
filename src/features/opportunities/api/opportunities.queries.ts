import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { useMeQuery } from "@/features/authentication/api/auth.queries";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { useEligibilityAnswers } from "@/features/scoring/hooks/useEligibilityAnswers";
import { opportunitiesApi } from "./opportunities.api";
import { toSearchRequest, type SearchState } from "../domain/searchState";

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
    // A subscriber's catalog doesn't depend on the profile, so it needn't wait
    // for it. Everyone else's does — and asking before it has loaded would
    // request twice (once with no profile in the key, once with it).
    enabled: me.isSuccess && (isFull || profile !== null),
    staleTime: 5 * 60_000,
  });

  return { ...query, catalog: query.data };
}

/**
 * Scored search. Unlike the catalog, the *server* scores every row here (it
 * has to — ranking by relevance needs the whole index), so the results depend
 * on the profile and answers for every tier, and the key includes both.
 * The previous page stays on screen while the next loads.
 */
export function useSearchQuery(state: SearchState, lang: "hu" | "en") {
  const me = useMeQuery();
  const isAuthenticated = useIsAuthenticated();
  const { profile } = useCompanyProfile();
  const { answers } = useEligibilityAnswers();
  const request = toSearchRequest(state, lang);

  return useQuery({
    queryKey: [...opportunitiesKeys.all, "search", request, isAuthenticated, profile, answers] as const,
    queryFn: () => (isAuthenticated ? opportunitiesApi.search(request) : opportunitiesApi.searchFor(request, profile!, answers)),
    // Results are scored for the profile, so wait for it: asking first would
    // search twice (once with no profile in the key, once with it).
    enabled: me.isSuccess && profile !== null,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** A single call fetched by id — the fallback for anything the open-calls catalog doesn't hold. */
export function useOpportunityDetailQuery(oppId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...opportunitiesKeys.all, "detail", oppId] as const,
    queryFn: () => opportunitiesApi.detail(oppId),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
