import { httpClient } from "@/api/httpClient";
import type { CompanyProfile } from "@/features/profile/types/profile.types";
import type { ScoredOpportunity } from "@/features/scoring/types/scoring.types";
import type { CatalogResponse, SaveOpportunityResponse, SearchResponse } from "../types/opportunities.types";

export const opportunitiesApi = {
  /** A signed-in account: the server already holds its profile and answers, and scores against them. */
  catalog: (lang: string) => httpClient.get<CatalogResponse>("/catalog", { params: { lang } }).then((res) => res.data),

  /**
   * An anonymous visitor: the server stores nothing about them, so their
   * browser-held profile travels in the request body instead. Without a
   * profile the server would score against its demo company, so callers must
   * not send this until one exists.
   */
  catalogFor: (profile: CompanyProfile, lang: string) =>
    httpClient.post<CatalogResponse>("/catalog", { profile, answers: {}, saved: [] }, { params: { lang } }).then((res) => res.data),

  /** Scored search for a signed-in account (the server uses its stored profile). `query` already carries `lang`. */
  search: (query: string) => httpClient.get<SearchResponse>(`/search?${query}`).then((res) => res.data),

  /** Scored search for an anonymous visitor: their browser-held profile travels in the body, as with `catalogFor`. */
  searchFor: (query: string, profile: CompanyProfile) =>
    httpClient.post<SearchResponse>(`/search?${query}`, { profile, answers: {}, saved: [] }).then((res) => res.data),

  /**
   * One call by id, scored and explained. The catalog only holds *open* calls,
   * but search also returns forthcoming ones; this is how those open.
   */
  detail: (oppId: string, lang: string) =>
    httpClient
      .get<{ opportunity: ScoredOpportunity }>(`/opportunities/${encodeURIComponent(oppId)}`, { params: { lang } })
      .then((res) => res.data.opportunity),

  toggleSaved: (oppId: string) =>
    httpClient.post<SaveOpportunityResponse>(`/opportunities/${encodeURIComponent(oppId)}/save`).then((res) => res.data),
};
