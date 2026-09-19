import { httpClient } from "@/shared/api/httpClient";
import type { CompanyProfile } from "@/features/profile/types/profile.types";
import type { AnswerMap } from "@/features/scoring/types/scoring.types";
import type { CatalogResponse, SaveOpportunityResponse } from "../types/opportunities.types";

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

  toggleSaved: (oppId: string) =>
    httpClient.post<SaveOpportunityResponse>(`/opportunities/${encodeURIComponent(oppId)}/save`).then((res) => res.data),
};
