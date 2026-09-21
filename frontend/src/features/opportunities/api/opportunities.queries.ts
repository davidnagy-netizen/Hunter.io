import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { useMeQuery } from "@/features/authentication/api/auth.queries";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { opportunitiesKeys } from "@/shared/api/opportunitiesKeys";
import { useLang } from "@/shared/hooks/useFormat";
import { opportunitiesApi } from "./opportunities.api";
import { toSearchRequest, type SearchState } from "../domain/searchState";

export { opportunitiesKeys };

/**
 * The catalog for whoever is looking, scored by the server for their company.
 *
 * A subscriber/admin gets every open call with its score, verdict, checks and
 * factors; everyone else gets censored teasers. Either way the *server* did
 * the scoring, so the answer depends on the company and the language. A
 * signed-in account's profile and answers live on the server, so the key does
 * not carry them — whatever changes them invalidates `opportunitiesKeys.all`.
 * An anonymous visitor's profile is browser-held and travels in the request,
 * so it is part of the key.
 */
export function useCatalog() {
  const me = useMeQuery();
  const isAuthenticated = useIsAuthenticated();
  const { profile } = useCompanyProfile();
  const lang = useLang();

  const query = useQuery({
    queryKey: opportunitiesKeys.catalog(lang, isAuthenticated ? "account" : profile),
    queryFn: () => (isAuthenticated ? opportunitiesApi.catalog(lang) : opportunitiesApi.catalogFor(profile!, lang)),
    // An anonymous visitor's response depends on their profile: asking before
    // it has loaded would request twice (once without it, once with).
    enabled: me.isSuccess && (isAuthenticated || profile !== null),
    staleTime: 5 * 60_000,
  });

  return { ...query, catalog: query.data };
}

/**
 * Scored search. Ranking by relevance needs the whole index, so the server
 * scores every row for every tier. The previous page stays on screen while
 * the next loads.
 */
export function useSearchQuery(state: SearchState, lang: "hu" | "en") {
  const me = useMeQuery();
  const isAuthenticated = useIsAuthenticated();
  const { profile } = useCompanyProfile();
  const request = toSearchRequest(state, lang);

  return useQuery({
    queryKey: opportunitiesKeys.search(request, isAuthenticated ? "account" : profile),
    queryFn: () => (isAuthenticated ? opportunitiesApi.search(request) : opportunitiesApi.searchFor(request, profile!)),
    enabled: me.isSuccess && (isAuthenticated || profile !== null),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** A single call by id, scored and explained for the current company. */
export function useOpportunityDetailQuery(oppId: string, enabled: boolean) {
  const lang = useLang();
  return useQuery({
    queryKey: opportunitiesKeys.detail(oppId, lang),
    queryFn: () => opportunitiesApi.detail(oppId, lang),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
