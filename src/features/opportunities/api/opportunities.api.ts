import { httpClient } from "@/shared/api/httpClient";
import type { CompanyProfile } from "@/features/profile/types/profile.types";
import type { AnswerMap } from "@/features/scoring/types/scoring.types";
import type { Opportunity } from "@/features/scoring/types/scoring.types";
import type { CatalogResponse, SaveOpportunityResponse, SearchResponse } from "../types/opportunities.types";

export const opportunitiesApi = {
  /** A signed-in account: the server already holds its profile and answers. */
  catalog: () => httpClient.get<CatalogResponse>("/catalog").then((res) => res.data),

  /**
   * An anonymous visitor: the server stores nothing about them, so their
   * browser-held profile and answers travel in the request body instead
   * (`resolveState` in `server/server.js`). Without a profile the server
   * would score against its demo company, so callers must not send this
   * until one exists.
   */
  catalogFor: (profile: CompanyProfile, answers: AnswerMap) =>
    httpClient.post<CatalogResponse>("/catalog", { profile, answers, saved: [] }).then((res) => res.data),

  /** Scored search for a signed-in account (the server uses its stored profile). */
  search: (query: string) => httpClient.get<SearchResponse>(`/search?${query}`).then((res) => res.data),

  /** Scored search for an anonymous visitor: their browser-held profile travels in the body, as with `catalogFor`. */
  searchFor: (query: string, profile: CompanyProfile, answers: AnswerMap) =>
    httpClient.post<SearchResponse>(`/search?${query}`, { profile, answers, saved: [] }).then((res) => res.data),

  /**
   * One call by id, straight from the server. The catalog only holds *open*
   * calls, but search also returns forthcoming ones; this is how those open.
   * The server's detail payload spreads the whole opportunity, so it can be
   * scored locally like any catalog entry.
   */
  detail: (oppId: string) =>
    httpClient.get<{ opportunity: Opportunity }>(`/opportunities/${encodeURIComponent(oppId)}`).then((res) => res.data.opportunity),

  toggleSaved: (oppId: string) =>
    httpClient.post<SaveOpportunityResponse>(`/opportunities/${encodeURIComponent(oppId)}/save`).then((res) => res.data),
};
